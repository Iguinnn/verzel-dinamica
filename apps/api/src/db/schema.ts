import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const reservationStatus = pgEnum("reservation_status", [
  "WAITLISTED",
  "ACTIVE",
  "CANCELLED",
  "LEFT_WAITLIST",
]);

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);

export const waitlistStatus = pgEnum("waitlist_status", [
  "WAITING",
  "PROMOTED",
  "LEFT",
]);

export const reservationEventType = pgEnum("reservation_event_type", [
  "RESERVATION_CREATED",
  "RESERVATION_CANCELLED",
  "WAITLIST_JOINED",
  "WAITLIST_LEFT",
  "WAITLIST_PROMOTED",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRole("role").default("USER").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
    index("sectors_name_idx").on(table.name),
  ],
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    sectorId: uuid("sector_id")
      .notNull()
      .references(() => sectors.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    plate: varchar("plate", { length: 10 }).notNull(),
    expectedArrivalAt: timestamp("expected_arrival_at", {
      withTimezone: true,
    }).notNull(),
    status: reservationStatus("status").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reservations_user_timeline_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("reservations_sector_idx").on(table.sectorId),
    index("reservations_plate_idx").on(table.plate),
    index("reservations_ranking_idx").on(
      table.sectorId,
      table.activatedAt,
    ),
    uniqueIndex("reservations_active_plate_unique")
      .on(table.plate)
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex("reservations_waitlisted_sector_plate_unique")
      .on(table.sectorId, table.plate)
      .where(sql`${table.status} = 'WAITLISTED'`),
  ],
);

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .unique()
      .references(() => reservations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sectorId: uuid("sector_id")
      .notNull()
      .references(() => sectors.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    status: waitlistStatus("status").default("WAITING").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("waitlist_fifo_idx").on(
      table.sectorId,
      table.status,
      table.joinedAt,
      table.id,
    ),
  ],
);

export const reservationEvents = pgTable(
  "reservation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    type: reservationEventType("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    triggeredByReservationId: uuid("triggered_by_reservation_id").references(
      () => reservations.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    details: jsonb("details"),
  },
  (table) => [
    index("reservation_events_timeline_idx").on(
      table.reservationId,
      table.occurredAt,
      table.id,
    ),
  ],
);
