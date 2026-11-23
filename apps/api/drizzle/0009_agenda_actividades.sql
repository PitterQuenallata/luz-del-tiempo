-- Desarrollo: las actividades de prueba se vuelven a sembrar (kind es obligatorio).
DELETE FROM "activities";--> statement-breakpoint
CREATE TABLE "activity_areas" (
	"activity_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	CONSTRAINT "activity_areas_activity_id_area_id_pk" PRIMARY KEY("activity_id","area_id")
);
--> statement-breakpoint
CREATE TABLE "activity_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"value" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_program_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"start_time" time,
	"duration_min" integer,
	"title" text NOT NULL,
	"description" text,
	"person_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"location_id" uuid,
	"location_note" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"map_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone_code" text,
	"phone" text,
	"email" text,
	"origin" text DEFAULT 'web' NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_area_id_areas_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_presenter_person_id_people_id_fk";
--> statement-breakpoint
DROP INDEX "activities_starts_idx";--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "kind" text NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "report" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "language" text DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "is_free" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "price_amount" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "price_note" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "status" text DEFAULT 'borrador' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_areas" ADD CONSTRAINT "activity_areas_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_areas" ADD CONSTRAINT "activity_areas_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_channels" ADD CONSTRAINT "activity_channels_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_gallery" ADD CONSTRAINT "activity_gallery_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_people" ADD CONSTRAINT "activity_people_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_people" ADD CONSTRAINT "activity_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_program_items" ADD CONSTRAINT "activity_program_items_session_id_activity_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_program_items" ADD CONSTRAINT "activity_program_items_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_channels_unique_idx" ON "activity_channels" USING btree ("activity_id","channel");--> statement-breakpoint
CREATE INDEX "activity_gallery_activity_idx" ON "activity_gallery" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_people_activity_idx" ON "activity_people" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_program_session_idx" ON "activity_program_items" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "activity_sessions_activity_idx" ON "activity_sessions" USING btree ("activity_id","starts_at");--> statement-breakpoint
CREATE INDEX "registrations_activity_idx" ON "registrations" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activities_status_idx" ON "activities" USING btree ("status");--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "area_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "starts_at";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "ends_at";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "schedule_text";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "location_name";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "location_address";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "registration_type";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "registration_value";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "presenter_person_id";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "cost";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "agenda";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "is_published";