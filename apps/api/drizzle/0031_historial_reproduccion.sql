CREATE TABLE "historial_reproduccion" (
	"station_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"titulo" text DEFAULT '' NOT NULL,
	"artista" text DEFAULT '' NOT NULL,
	"lista" text DEFAULT '' NOT NULL,
	"archivo" text DEFAULT '' NOT NULL,
	CONSTRAINT "historial_reproduccion_station_id_started_at_pk" PRIMARY KEY("station_id","started_at")
);
--> statement-breakpoint
ALTER TABLE "historial_reproduccion" ADD CONSTRAINT "historial_reproduccion_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;