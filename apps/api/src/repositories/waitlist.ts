import type {
  JoinWaitlistInput,
  WaitlistEntry,
  WaitlistListResponse,
} from "@parking/contracts";
import { and, asc, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  reservationEvents,
  reservations,
  sectors,
  waitlistEntries,
} from "../db/schema.js";

export type JoinWaitlistResult =
  | { kind: "joined"; entry: WaitlistEntry }
  | { kind: "sector_not_found" }
  | { kind: "sector_has_availability" }
  | { kind: "active_plate" }
  | { kind: "duplicate_entry" }
  | { kind: "arrival_in_past" };

export type ListWaitlistResult =
  | { kind: "found"; response: WaitlistListResponse }
  | { kind: "sector_not_found" };

export type LeaveWaitlistResult =
  | "left"
  | "not_found"
  | "not_waiting";

export interface WaitlistRepository {
  join(
    input: JoinWaitlistInput & { userId: string; sectorId: string },
  ): Promise<JoinWaitlistResult>;
  list(sectorId: string, userId: string): Promise<ListWaitlistResult>;
  leave(entryId: string, userId: string): Promise<LeaveWaitlistResult>;
}

function maskPlate(plate: string): string {
  const visibleCharacters = 2;
  const hiddenLength = Math.max(plate.length - visibleCharacters, 0);
  return `${"*".repeat(hiddenLength)}${plate.slice(-visibleCharacters)}`;
}

function toWaitlistEntry(
  row: {
    id: string;
    sectorId: string;
    plate: string;
    userId: string;
    expectedArrivalAt: Date;
    joinedAt: Date;
  },
  position: number,
  currentUserId: string,
): WaitlistEntry {
  return {
    id: row.id,
    sectorId: row.sectorId,
    position,
    maskedPlate: maskPlate(row.plate),
    isMine: row.userId === currentUserId,
    expectedArrivalAt: row.expectedArrivalAt.toISOString(),
    joinedAt: row.joinedAt.toISOString(),
  };
}

function databaseErrorCode(error: unknown): string | undefined {
  let current = error;

  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    if ("code" in current) {
      const { code } = current as { code?: unknown };
      if (typeof code === "string") {
        return code;
      }
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return undefined;
}

/** Persists waitlist state and its reservation history atomically. */
export function createWaitlistRepository(
  db: Database,
  now: () => Date = () => new Date(),
): WaitlistRepository {
  return {
    async join(input) {
      const expectedArrivalAt = new Date(input.expectedArrivalAt);
      const occurredAt = now();

      if (expectedArrivalAt <= occurredAt) {
        return { kind: "arrival_in_past" };
      }

      try {
        return await db.transaction(async (transaction) => {
          const [sector] = await transaction
            .select({ availableSpots: sectors.availableSpots })
            .from(sectors)
            .where(eq(sectors.id, input.sectorId))
            .for("update")
            .limit(1);

          if (!sector) {
            return { kind: "sector_not_found" } as const;
          }

          if (sector.availableSpots > 0) {
            return { kind: "sector_has_availability" } as const;
          }

          const [activeReservation] = await transaction
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              and(
                eq(reservations.plate, input.plate),
                eq(reservations.status, "ACTIVE"),
              ),
            )
            .limit(1);

          if (activeReservation) {
            return { kind: "active_plate" } as const;
          }

          const [duplicateReservation] = await transaction
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              and(
                eq(reservations.sectorId, input.sectorId),
                eq(reservations.plate, input.plate),
                eq(reservations.status, "WAITLISTED"),
              ),
            )
            .limit(1);

          if (duplicateReservation) {
            return { kind: "duplicate_entry" } as const;
          }

          const [reservation] = await transaction
            .insert(reservations)
            .values({
              userId: input.userId,
              sectorId: input.sectorId,
              plate: input.plate,
              expectedArrivalAt,
              status: "WAITLISTED",
            })
            .returning({ id: reservations.id });

          if (!reservation) {
            throw new Error("Waitlist reservation insert returned no row");
          }

          const [entry] = await transaction
            .insert(waitlistEntries)
            .values({
              reservationId: reservation.id,
              sectorId: input.sectorId,
              joinedAt: occurredAt,
            })
            .returning({
              id: waitlistEntries.id,
              reservationId: waitlistEntries.reservationId,
              sectorId: waitlistEntries.sectorId,
              joinedAt: waitlistEntries.joinedAt,
            });

          if (!entry) {
            throw new Error("Waitlist entry insert returned no row");
          }

          await transaction.insert(reservationEvents).values([
            {
              reservationId: reservation.id,
              actorUserId: input.userId,
              type: "RESERVATION_CREATED",
              occurredAt,
            },
            {
              reservationId: reservation.id,
              actorUserId: input.userId,
              type: "WAITLIST_JOINED",
              occurredAt,
            },
          ]);

          const waitingEntries = await transaction
            .select({ id: waitlistEntries.id })
            .from(waitlistEntries)
            .where(
              and(
                eq(waitlistEntries.sectorId, input.sectorId),
                eq(waitlistEntries.status, "WAITING"),
              ),
            )
            .orderBy(asc(waitlistEntries.joinedAt), asc(waitlistEntries.id));
          const position = waitingEntries.findIndex(
            (waitingEntry) => waitingEntry.id === entry.id,
          );

          if (position < 0) {
            throw new Error("Created waitlist entry was not found in the queue");
          }

          return {
            kind: "joined",
            entry: toWaitlistEntry(
              {
                ...entry,
                plate: input.plate,
                userId: input.userId,
                expectedArrivalAt,
              },
              position + 1,
              input.userId,
            ),
          } as const;
        });
      } catch (error) {
        if (databaseErrorCode(error) === "23505") {
          return { kind: "duplicate_entry" };
        }

        throw error;
      }
    },

    async list(sectorId, userId) {
      const [sector] = await db
        .select({ id: sectors.id })
        .from(sectors)
        .where(eq(sectors.id, sectorId))
        .limit(1);

      if (!sector) {
        return { kind: "sector_not_found" };
      }

      const rows = await db
        .select({
          id: waitlistEntries.id,
          sectorId: waitlistEntries.sectorId,
          joinedAt: waitlistEntries.joinedAt,
          plate: reservations.plate,
          userId: reservations.userId,
          expectedArrivalAt: reservations.expectedArrivalAt,
        })
        .from(waitlistEntries)
        .innerJoin(
          reservations,
          eq(waitlistEntries.reservationId, reservations.id),
        )
        .where(
          and(
            eq(waitlistEntries.sectorId, sectorId),
            eq(waitlistEntries.status, "WAITING"),
          ),
        )
        .orderBy(asc(waitlistEntries.joinedAt), asc(waitlistEntries.id));

      return {
        kind: "found",
        response: {
          data: rows.map((row, index) =>
            toWaitlistEntry(row, index + 1, userId),
          ),
        },
      };
    },

    async leave(entryId, userId) {
      return db.transaction(async (transaction) => {
        const [entry] = await transaction
          .select({
            reservationId: waitlistEntries.reservationId,
            waitlistStatus: waitlistEntries.status,
            reservationStatus: reservations.status,
            userId: reservations.userId,
          })
          .from(waitlistEntries)
          .innerJoin(
            reservations,
            eq(waitlistEntries.reservationId, reservations.id),
          )
          .where(eq(waitlistEntries.id, entryId))
          .for("update")
          .limit(1);

        if (!entry || entry.userId !== userId) {
          return "not_found";
        }

        if (
          entry.waitlistStatus !== "WAITING" ||
          entry.reservationStatus !== "WAITLISTED"
        ) {
          return "not_waiting";
        }

        const occurredAt = now();

        await transaction
          .update(waitlistEntries)
          .set({ status: "LEFT", leftAt: occurredAt, updatedAt: occurredAt })
          .where(eq(waitlistEntries.id, entryId));
        await transaction
          .update(reservations)
          .set({ status: "LEFT_WAITLIST", updatedAt: occurredAt })
          .where(eq(reservations.id, entry.reservationId));
        await transaction.insert(reservationEvents).values({
          reservationId: entry.reservationId,
          actorUserId: userId,
          type: "WAITLIST_LEFT",
          occurredAt,
        });

        return "left";
      });
    },
  };
}
