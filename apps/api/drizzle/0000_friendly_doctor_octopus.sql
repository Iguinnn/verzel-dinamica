CREATE TYPE "public"."reservation_event_type" AS ENUM('RESERVATION_CREATED', 'RESERVATION_CANCELLED', 'WAITLIST_JOINED', 'WAITLIST_LEFT', 'WAITLIST_PROMOTED');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('WAITLISTED', 'ACTIVE', 'CANCELLED', 'LEFT_WAITLIST');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('WAITING', 'PROMOTED', 'LEFT');--> statement-breakpoint
CREATE TABLE "reservation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" "reservation_event_type" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triggered_by_reservation_id" uuid,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	"plate" varchar(10) NOT NULL,
	"expected_arrival_at" timestamp with time zone NOT NULL,
	"status" "reservation_status" NOT NULL,
	"activated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"location" varchar(255) NOT NULL,
	"capacity" integer NOT NULL,
	"available_spots" integer NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sectors_capacity_positive" CHECK ("sectors"."capacity" >= 1),
	CONSTRAINT "sectors_available_spots_range" CHECK ("sectors"."available_spots" >= 0 AND "sectors"."available_spots" <= "sectors"."capacity"),
	CONSTRAINT "sectors_hourly_rate_non_negative" CHECK ("sectors"."hourly_rate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	"status" "waitlist_status" DEFAULT 'WAITING' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"promoted_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entries_reservation_id_unique" UNIQUE("reservation_id")
);
--> statement-breakpoint
ALTER TABLE "reservation_events" ADD CONSTRAINT "reservation_events_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reservation_events" ADD CONSTRAINT "reservation_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reservation_events" ADD CONSTRAINT "reservation_events_triggered_by_reservation_id_reservations_id_fk" FOREIGN KEY ("triggered_by_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "reservation_events_timeline_idx" ON "reservation_events" USING btree ("reservation_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "reservations_user_timeline_idx" ON "reservations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reservations_sector_idx" ON "reservations" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "reservations_plate_idx" ON "reservations" USING btree ("plate");--> statement-breakpoint
CREATE INDEX "reservations_ranking_idx" ON "reservations" USING btree ("sector_id","activated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_active_plate_unique" ON "reservations" USING btree ("plate") WHERE "reservations"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_waitlisted_sector_plate_unique" ON "reservations" USING btree ("sector_id","plate") WHERE "reservations"."status" = 'WAITLISTED';--> statement-breakpoint
CREATE INDEX "sectors_name_idx" ON "sectors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "waitlist_fifo_idx" ON "waitlist_entries" USING btree ("sector_id","status","joined_at","id");