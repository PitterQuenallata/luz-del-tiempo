CREATE TABLE "radio_ajustes" (
	"id" text PRIMARY KEY NOT NULL,
	"encendida" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "encendida" boolean DEFAULT true NOT NULL;