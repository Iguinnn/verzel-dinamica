import type { SectorListResponse } from "@parking/contracts";

import type { Database } from "../db/client.js";
import { sectors } from "../db/schema.js";

export interface SectorReader {
  list(): Promise<SectorListResponse>;
}

/** Reads the current sector state from PostgreSQL through Drizzle. */
export function createSectorRepository(db: Database): SectorReader {
  return {
    async list() {
      const data = await db
        .select({
          id: sectors.id,
          name: sectors.name,
          location: sectors.location,
          capacity: sectors.capacity,
          availableSpots: sectors.availableSpots,
          hourlyRate: sectors.hourlyRate,
        })
        .from(sectors)
        .orderBy(sectors.name, sectors.id);

      return { data };
    },
  };
}
