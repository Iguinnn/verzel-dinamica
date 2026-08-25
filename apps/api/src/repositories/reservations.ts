import type {
  CreateReservationInput,
  Reservation,
  ReservationEvent,
  ReservationEventType,
  UserRole,
} from "@parking/contracts";
import { and, asc, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  reservationEvents,
  reservations,
  sectors,
  waitlistEntries,
} from "../db/schema.js";

export type Actor = {
  id: string;
  role: UserRole;
};

export type CreateReservationResult =
  | { kind: "created"; reservation: Reservation }
  | { kind: "sector_not_found" }
  | { kind: "sector_full" }
  | { kind: "plate_active" };

export type CancelReservationResult =
  | {
      kind: "cancelled";
      reservation: Reservation;
      promoted?: Reservation;
    }
  | { kind: "not_found" }
  | { kind: "not_active" };

export type GetReservationResult =
  | { kind: "found"; reservation: Reservation }
  | { kind: "not_found" };

export type ListEventsResult =
  | { kind: "found"; events: ReservationEvent[] }
  | { kind: "not_found" };

export interface ReservationRepository {
  list(actor: Actor): Promise<Reservation[]>;
  findById(id: string, actor: Actor): Promise<GetReservationResult>;
  create(
    input: CreateReservationInput,
    actor: Actor,
  ): Promise<CreateReservationResult>;
  cancel(id: string, actor: Actor): Promise<CancelReservationResult>;
  listEvents(id: string, actor: Actor): Promise<ListEventsResult>;
}

type EventRecord = {
  id: string;
  reservationId: string;
  actorUserId: string | null;
  type: ReservationEventType;
  occurredAt: Date;
  triggeredByReservationId: string | null;
  details: unknown;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toPublicReservation(row: {
  id: string;
  userId: string;
  sectorId: string;
  plate: string;
  expectedArrivalAt: Date;
  status: Reservation["status"];
  activatedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Reservation {
  return {
    id: row.id,
    userId: row.userId,
    sectorId: row.sectorId,
    plate: row.plate,
    expectedArrivalAt: row.expectedArrivalAt.toISOString(),
    status: row.status,
    activatedAt: toIso(row.activatedAt),
    cancelledAt: toIso(row.cancelledAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function eventDescription(event: EventRecord): string {
  const details =
    event.details && typeof event.details === "object"
      ? (event.details as Record<string, unknown>)
      : {};
  const plate = typeof details.plate === "string" ? details.plate : "";

  switch (event.type) {
    case "RESERVATION_CREATED":
      return `Reserva criada para a placa ${plate}.`;
    case "RESERVATION_CANCELLED":
      return `Reserva da placa ${plate} cancelada.`;
    case "WAITLIST_JOINED":
      return `Placa ${plate} entrou na lista de espera.`;
    case "WAITLIST_LEFT":
      return `Placa ${plate} saiu voluntariamente da lista de espera.`;
    case "WAITLIST_PROMOTED":
      return event.triggeredByReservationId
        ? `Placa ${plate} promovida da lista de espera apos o cancelamento ${event.triggeredByReservationId}.`
        : `Placa ${plate} promovida da lista de espera.`;
  }
}

function toPublicEvent(event: EventRecord): ReservationEvent {
  return {
    id: event.id,
    reservationId: event.reservationId,
    actorUserId: event.actorUserId,
    type: event.type,
    occurredAt: event.occurredAt.toISOString(),
    triggeredByReservationId: event.triggeredByReservationId,
    details: event.details,
    description: eventDescription(event),
  };
}

function canAccess(actor: Actor, userId: string) {
  return actor.role === "ADMIN" || actor.id === userId;
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

const reservationSelection = {
  id: reservations.id,
  userId: reservations.userId,
  sectorId: reservations.sectorId,
  plate: reservations.plate,
  expectedArrivalAt: reservations.expectedArrivalAt,
  status: reservations.status,
  activatedAt: reservations.activatedAt,
  cancelledAt: reservations.cancelledAt,
  createdAt: reservations.createdAt,
  updatedAt: reservations.updatedAt,
};

export function createReservationRepository(db: Database): ReservationRepository {
  return {
    async list(actor) {
      const rows =
        actor.role === "ADMIN"
          ? await db
              .select(reservationSelection)
              .from(reservations)
              .orderBy(reservations.createdAt, reservations.id)
          : await db
              .select(reservationSelection)
              .from(reservations)
              .where(eq(reservations.userId, actor.id))
              .orderBy(reservations.createdAt, reservations.id);

      return rows.map(toPublicReservation);
    },

    async findById(id, actor) {
      const [row] = await db
        .select(reservationSelection)
        .from(reservations)
        .where(eq(reservations.id, id))
        .limit(1);

      if (!row || !canAccess(actor, row.userId)) {
        return { kind: "not_found" };
      }

      return { kind: "found", reservation: toPublicReservation(row) };
    },

    async create(input, actor) {
      try {
        return await db.transaction(async (transaction) => {
          const [sector] = await transaction
            .select({
              id: sectors.id,
              availableSpots: sectors.availableSpots,
            })
            .from(sectors)
            .where(eq(sectors.id, input.sectorId))
            .for("update")
            .limit(1);

          if (!sector) {
            return { kind: "sector_not_found" } as const;
          }

          if (sector.availableSpots < 1) {
            return { kind: "sector_full" } as const;
          }

          const [active] = await transaction
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              and(
                eq(reservations.plate, input.plate),
                eq(reservations.status, "ACTIVE"),
              ),
            )
            .limit(1);

          if (active) {
            return { kind: "plate_active" } as const;
          }

          const now = new Date();
          const [created] = await transaction
            .insert(reservations)
            .values({
              userId: actor.id,
              sectorId: input.sectorId,
              plate: input.plate,
              expectedArrivalAt: new Date(input.expectedArrivalAt),
              status: "ACTIVE",
              activatedAt: now,
            })
            .returning(reservationSelection);

          if (!created) {
            throw new Error("RESERVATION_INSERT_FAILED");
          }

          await transaction.insert(reservationEvents).values({
            reservationId: created.id,
            actorUserId: actor.id,
            type: "RESERVATION_CREATED",
            details: { plate: created.plate, sectorId: created.sectorId },
          });

          await transaction
            .update(sectors)
            .set({
              availableSpots: sector.availableSpots - 1,
              updatedAt: now,
            })
            .where(eq(sectors.id, sector.id));

          return {
            kind: "created" as const,
            reservation: toPublicReservation(created),
          };
        });
      } catch (error) {
        if (databaseErrorCode(error) === "23505") {
          return { kind: "plate_active" };
        }

        throw error;
      }
    },

    async cancel(id, actor) {
      return db.transaction(async (transaction) => {
        const [current] = await transaction
          .select(reservationSelection)
          .from(reservations)
          .where(eq(reservations.id, id))
          .for("update")
          .limit(1);

        if (!current || !canAccess(actor, current.userId)) {
          return { kind: "not_found" } as const;
        }

        if (current.status !== "ACTIVE") {
          return { kind: "not_active" } as const;
        }

        const [sector] = await transaction
          .select({
            id: sectors.id,
            availableSpots: sectors.availableSpots,
          })
          .from(sectors)
          .where(eq(sectors.id, current.sectorId))
          .for("update")
          .limit(1);

        if (!sector) {
          return { kind: "not_found" } as const;
        }

        const now = new Date();
        const [cancelled] = await transaction
          .update(reservations)
          .set({
            status: "CANCELLED",
            cancelledAt: now,
            updatedAt: now,
          })
          .where(eq(reservations.id, current.id))
          .returning(reservationSelection);

        if (!cancelled) {
          throw new Error("RESERVATION_CANCEL_FAILED");
        }

        await transaction.insert(reservationEvents).values({
          reservationId: cancelled.id,
          actorUserId: actor.id,
          type: "RESERVATION_CANCELLED",
          details: { plate: cancelled.plate, sectorId: cancelled.sectorId },
        });

        const [waiting] = await transaction
          .select()
          .from(waitlistEntries)
          .where(
            and(
              eq(waitlistEntries.sectorId, cancelled.sectorId),
              eq(waitlistEntries.status, "WAITING"),
            ),
          )
          .orderBy(asc(waitlistEntries.joinedAt), asc(waitlistEntries.id))
          .for("update")
          .limit(1);

        if (!waiting) {
          await transaction
            .update(sectors)
            .set({
              availableSpots: sector.availableSpots + 1,
              updatedAt: now,
            })
            .where(eq(sectors.id, sector.id));

          return {
            kind: "cancelled" as const,
            reservation: toPublicReservation(cancelled),
          };
        }

        await transaction
          .update(waitlistEntries)
          .set({
            status: "PROMOTED",
            promotedAt: now,
            updatedAt: now,
          })
          .where(eq(waitlistEntries.id, waiting.id));

        const [promoted] = await transaction
          .update(reservations)
          .set({
            status: "ACTIVE",
            activatedAt: now,
            updatedAt: now,
          })
          .where(eq(reservations.id, waiting.reservationId))
          .returning(reservationSelection);

        if (!promoted) {
          throw new Error("WAITLIST_PROMOTE_FAILED");
        }

        await transaction.insert(reservationEvents).values({
          reservationId: promoted.id,
          actorUserId: null,
          type: "WAITLIST_PROMOTED",
          triggeredByReservationId: cancelled.id,
          details: { plate: promoted.plate, sectorId: promoted.sectorId },
        });

        return {
          kind: "cancelled" as const,
          reservation: toPublicReservation(cancelled),
          promoted: toPublicReservation(promoted),
        };
      });
    },

    async listEvents(id, actor) {
      const [row] = await db
        .select({ id: reservations.id, userId: reservations.userId })
        .from(reservations)
        .where(eq(reservations.id, id))
        .limit(1);

      if (!row || !canAccess(actor, row.userId)) {
        return { kind: "not_found" };
      }

      const events = await db
        .select()
        .from(reservationEvents)
        .where(eq(reservationEvents.reservationId, id))
        .orderBy(asc(reservationEvents.occurredAt), asc(reservationEvents.id));

      return {
        kind: "found",
        events: events.map((event) =>
          toPublicEvent({
            id: event.id,
            reservationId: event.reservationId,
            actorUserId: event.actorUserId,
            type: event.type,
            occurredAt: event.occurredAt,
            triggeredByReservationId: event.triggeredByReservationId ?? null,
            details: event.details,
          }),
        ),
      };
    },
  };
}

type MemoryReservation = {
  id: string;
  userId: string;
  sectorId: string;
  plate: string;
  expectedArrivalAt: Date;
  status: Reservation["status"];
  activatedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryWaitlist = {
  id: string;
  reservationId: string;
  sectorId: string;
  status: "WAITING" | "PROMOTED" | "LEFT";
  joinedAt: Date;
};

export function createMemoryReservationRepository(
  initialSectors: { id: string; availableSpots: number }[] = [],
): ReservationRepository & {
  seedWaitlist(entry: MemoryWaitlist): void;
  seedReservation(row: MemoryReservation): void;
} {
  const spots = new Map(
    initialSectors.map((sector) => [sector.id, sector.availableSpots]),
  );
  const records: MemoryReservation[] = [];
  const events: EventRecord[] = [];
  const waitlist: MemoryWaitlist[] = [];

  function visible(actor: Actor, row: MemoryReservation) {
    return canAccess(actor, row.userId);
  }

  return {
    seedWaitlist(entry) {
      waitlist.push(entry);
    },
    seedReservation(row) {
      records.push(row);
    },
    async list(actor) {
      return records
        .filter((row) => visible(actor, row))
        .sort(
          (a, b) =>
            a.createdAt.getTime() - b.createdAt.getTime() ||
            a.id.localeCompare(b.id),
        )
        .map(toPublicReservation);
    },
    async findById(id, actor) {
      const row = records.find((item) => item.id === id);
      if (!row || !visible(actor, row)) {
        return { kind: "not_found" };
      }
      return { kind: "found", reservation: toPublicReservation(row) };
    },
    async create(input, actor) {
      if (!spots.has(input.sectorId)) {
        return { kind: "sector_not_found" };
      }

      const available = spots.get(input.sectorId) ?? 0;
      if (available < 1) {
        return { kind: "sector_full" };
      }

      if (
        records.some(
          (row) => row.plate === input.plate && row.status === "ACTIVE",
        )
      ) {
        return { kind: "plate_active" };
      }

      const now = new Date();
      const created: MemoryReservation = {
        id: crypto.randomUUID(),
        userId: actor.id,
        sectorId: input.sectorId,
        plate: input.plate,
        expectedArrivalAt: new Date(input.expectedArrivalAt),
        status: "ACTIVE",
        activatedAt: now,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      };
      records.push(created);
      events.push({
        id: crypto.randomUUID(),
        reservationId: created.id,
        actorUserId: actor.id,
        type: "RESERVATION_CREATED",
        occurredAt: now,
        triggeredByReservationId: null,
        details: { plate: created.plate, sectorId: created.sectorId },
      });
      spots.set(input.sectorId, available - 1);
      return { kind: "created", reservation: toPublicReservation(created) };
    },
    async cancel(id, actor) {
      const current = records.find((item) => item.id === id);
      if (!current || !visible(actor, current)) {
        return { kind: "not_found" };
      }
      if (current.status !== "ACTIVE") {
        return { kind: "not_active" };
      }

      const now = new Date();
      current.status = "CANCELLED";
      current.cancelledAt = now;
      current.updatedAt = now;
      events.push({
        id: crypto.randomUUID(),
        reservationId: current.id,
        actorUserId: actor.id,
        type: "RESERVATION_CANCELLED",
        occurredAt: now,
        triggeredByReservationId: null,
        details: { plate: current.plate, sectorId: current.sectorId },
      });

      const next = waitlist
        .filter(
          (entry) =>
            entry.sectorId === current.sectorId && entry.status === "WAITING",
        )
        .sort(
          (a, b) =>
            a.joinedAt.getTime() - b.joinedAt.getTime() ||
            a.id.localeCompare(b.id),
        )[0];

      if (!next) {
        spots.set(current.sectorId, (spots.get(current.sectorId) ?? 0) + 1);
        return {
          kind: "cancelled",
          reservation: toPublicReservation(current),
        };
      }

      next.status = "PROMOTED";
      const promoted = records.find((row) => row.id === next.reservationId);
      if (!promoted) {
        throw new Error("WAITLIST_PROMOTE_FAILED");
      }
      promoted.status = "ACTIVE";
      promoted.activatedAt = now;
      promoted.updatedAt = now;
      events.push({
        id: crypto.randomUUID(),
        reservationId: promoted.id,
        actorUserId: null,
        type: "WAITLIST_PROMOTED",
        occurredAt: now,
        triggeredByReservationId: current.id,
        details: { plate: promoted.plate, sectorId: promoted.sectorId },
      });

      return {
        kind: "cancelled",
        reservation: toPublicReservation(current),
        promoted: toPublicReservation(promoted),
      };
    },
    async listEvents(id, actor) {
      const row = records.find((item) => item.id === id);
      if (!row || !visible(actor, row)) {
        return { kind: "not_found" };
      }

      return {
        kind: "found",
        events: events
          .filter((event) => event.reservationId === id)
          .sort(
            (a, b) =>
              a.occurredAt.getTime() - b.occurredAt.getTime() ||
              a.id.localeCompare(b.id),
          )
          .map(toPublicEvent),
      };
    },
  };
}
