import { sql } from "drizzle-orm";
import {
  check,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const sectors = pgTable(
  "sectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    capacity: integer("capacity").notNull(),
    availableSpots: integer("available_spots").notNull(),
    hourlyRate: numeric("hourly_rate", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("sectors_capacity_positive", sql`${table.capacity} >= 1`),
    check(
      "sectors_available_spots_range",
      sql`${table.availableSpots} >= 0 AND ${table.availableSpots} <= ${table.capacity}`,
    ),
    check("sectors_hourly_rate_non_negative", sql`${table.hourlyRate} >= 0`),
  ],
);
