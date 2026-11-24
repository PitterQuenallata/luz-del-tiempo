ALTER TABLE "station_tracks" ADD COLUMN "album" text;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD COLUMN "year" smallint;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD COLUMN "genre" text;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD COLUMN "folder" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "stream_name" text;