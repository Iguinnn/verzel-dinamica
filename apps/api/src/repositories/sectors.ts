import type {
  CreateSectorInput,
  Sector,
  SectorListResponse,
  UpdateSectorInput,
} from "@parking/contracts";
import { eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { sectors } from "../db/schema.js";

export type UpdateSectorResult =
  | { kind: "updated"; sector: Sector }
  | { kind: "not_found" }
  | { kind: "capacity_conflict" };

export type DeleteSectorResult = "deleted" | "not_found" | "in_use";

export interface SectorRepository {
  list(): Promise<SectorListResponse>;
  findById(id: string): Promise<Sector | null>;
  create(input: CreateSectorInput): Promise<Sector>;
  update(id: string, input: UpdateSectorInput): Promise<UpdateSectorResult>;
  delete(id: string): Promise<DeleteSectorResult>;
}

const sectorSelection = {
  id: sectors.id,
  name: sectors.name,
  location: sectors.location,
  capacity: sectors.capacity,
  availableSpots: sectors.availableSpots,
  hourlyRate: sectors.hourlyRate,
};

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

/** Persists and reads sectors from PostgreSQL while preserving current occupancy. */
export function createSectorRepository(db: Database): SectorRepository {
  return {
    async list() {
      const data = await db
        .select(sectorSelection)
        .from(sectors)
        .orderBy(sectors.name, sectors.id);

      return { data };
    },

    async findById(id) {
      const [sector] = await db
        .select(sectorSelection)
        .from(sectors)
        .where(eq(sectors.id, id))
        .limit(1);

      return sector ?? null;
    },

    async create(input) {
      const [sector] = await db
        .insert(sectors)
        .values({
          ...input,
          availableSpots: input.capacity,
        })
        .returning(sectorSelection);

      if (!sector) {
        throw new Error("Sector insert returned no row");
      }

      return sector;
    },

    async update(id, input) {
      return db.transaction(async (transaction) => {
        const [current] = await transaction
          .select({
            capacity: sectors.capacity,
            availableSpots: sectors.availableSpots,
          })
          .from(sectors)
          .where(eq(sectors.id, id))
          .for("update")
          .limit(1);

        if (!current) {
          return { kind: "not_found" } as const;
        }

        const occupiedSpots = current.capacity - current.availableSpots;

        if (input.capacity !== undefined && input.capacity < occupiedSpots) {
          return { kind: "capacity_conflict" } as const;
        }

        const [sector] = await transaction
          .update(sectors)
          .set({
            ...input,
            availableSpots:
              input.capacity === undefined
                ? current.availableSpots
                : input.capacity - occupiedSpots,
            updatedAt: new Date(),
          })
          .where(eq(sectors.id, id))
          .returning(sectorSelection);

        if (!sector) {
          throw new Error("Sector update returned no row");
        }

        return { kind: "updated", sector } as const;
      });
    },

    async delete(id) {
      try {
        const deleted = await db
          .delete(sectors)
          .where(eq(sectors.id, id))
          .returning({ id: sectors.id });

        return deleted.length === 0 ? "not_found" : "deleted";
      } catch (error) {
        const code = databaseErrorCode(error);

        if (code === "23001" || code === "23503") {
          return "in_use";
        }

        throw error;
      }
    },
  };
}
