CREATE TABLE "radios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"genre" text,
	"image_url" text,
	"kind" text DEFAULT 'own' NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"area_id" uuid,
	"operated_by_name" text,
	"owner_user_id" text,
	"visible_in_ministry" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "radios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "station_playlists" ADD COLUMN "radio_id" uuid;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD COLUMN "radio_id" uuid;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "radio_id" uuid;--> statement-breakpoint
ALTER TABLE "radios" ADD CONSTRAINT "radios_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radios" ADD CONSTRAINT "radios_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_playlists" ADD CONSTRAINT "station_playlists_radio_id_radios_id_fk" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD CONSTRAINT "station_tracks_radio_id_radios_id_fk" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_radio_id_radios_id_fk" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Datos: la emisora «Radio La Luz del Tiempo» es el contenedor de las estaciones propias (principal, música, salud…).
-- Su archivo y listas compartidas (antes «biblioteca institucional») pasan a ser de la emisora.
INSERT INTO "radios" ("slug", "name", "description", "genre", "image_url", "kind", "is_main", "area_id", "operated_by_name", "visible_in_ministry", "status", "sort_order", "contact_name", "contact_phone", "contact_email", "notes")
SELECT 'radio-la-luz-del-tiempo', "name", "description", "genre", "image_url", 'own', true, "area_id", "operated_by_name", "visible_in_ministry", "status", "sort_order", "contact_name", "contact_phone", "contact_email", "notes"
FROM "stations" WHERE "is_main" = true AND "kind" = 'own' LIMIT 1;--> statement-breakpoint
UPDATE "stations" SET "radio_id" = (SELECT "id" FROM "radios" WHERE "slug" = 'radio-la-luz-del-tiempo') WHERE "kind" = 'own';--> statement-breakpoint
-- Una emisora externa (de un tercero) tiene su propia emisora con su única estación
INSERT INTO "radios" ("slug", "name", "description", "kind", "is_main", "operated_by_name", "visible_in_ministry", "status", "sort_order", "contact_name", "contact_phone", "contact_email", "notes")
SELECT "slug" || '-emisora', "name", "description", 'external', false, "operated_by_name", "visible_in_ministry", "status", "sort_order", "contact_name", "contact_phone", "contact_email", "notes"
FROM "stations" WHERE "kind" = 'external';--> statement-breakpoint
UPDATE "stations" s SET "radio_id" = r."id" FROM "radios" r WHERE s."kind" = 'external' AND r."slug" = s."slug" || '-emisora';--> statement-breakpoint
UPDATE "station_tracks" SET "radio_id" = (SELECT "id" FROM "radios" WHERE "slug" = 'radio-la-luz-del-tiempo') WHERE "station_id" IS NULL;--> statement-breakpoint
UPDATE "station_playlists" SET "radio_id" = (SELECT "id" FROM "radios" WHERE "slug" = 'radio-la-luz-del-tiempo') WHERE "station_id" IS NULL;--> statement-breakpoint
ALTER TABLE "stations" ALTER COLUMN "radio_id" SET NOT NULL;
