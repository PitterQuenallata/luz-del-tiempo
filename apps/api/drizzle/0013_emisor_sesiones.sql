CREATE TABLE "broadcast_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"user_id" text,
	"equipo" text,
	"ip" text,
	"version" text,
	"sistema" text,
	"programa" text,
	"estado" text DEFAULT 'conectando' NOT NULL,
	"kbps" smallint,
	"cortes" integer DEFAULT 0 NOT NULL,
	"silencios" integer DEFAULT 0 NOT NULL,
	"saturaciones" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"motivo_fin" text
);
--> statement-breakpoint
CREATE TABLE "station_broadcasters" (
	"station_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "station_broadcasters_station_id_user_id_pk" PRIMARY KEY("station_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "broadcast_sessions" ADD CONSTRAINT "broadcast_sessions_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_sessions" ADD CONSTRAINT "broadcast_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_broadcasters" ADD CONSTRAINT "station_broadcasters_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_broadcasters" ADD CONSTRAINT "station_broadcasters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "broadcast_sessions_station_idx" ON "broadcast_sessions" USING btree ("station_id","started_at");--> statement-breakpoint
CREATE INDEX "broadcast_sessions_activa_idx" ON "broadcast_sessions" USING btree ("ended_at");--> statement-breakpoint
-- Permiso nuevo del catálogo (lib/permisos.ts) y asignación a los roles que lo traen por defecto
INSERT INTO "permissions" ("key", "descripcion", "grupo") VALUES ('radio:transmitir', 'Transmitir en vivo con el emisor de Windows', 'radio') ON CONFLICT ("key") DO NOTHING;--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_key") SELECT "id", 'radio:transmitir' FROM "roles" WHERE "key" IN ('admin', 'station_operator') ON CONFLICT DO NOTHING;
