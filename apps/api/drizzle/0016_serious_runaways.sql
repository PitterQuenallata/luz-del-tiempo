CREATE TABLE "station_playlist_links" (
	"station_id" uuid NOT NULL,
	"playlist_id" uuid NOT NULL,
	CONSTRAINT "station_playlist_links_station_id_playlist_id_pk" PRIMARY KEY("station_id","playlist_id")
);
--> statement-breakpoint
ALTER TABLE "station_playlists" ALTER COLUMN "station_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "station_tracks" ALTER COLUMN "station_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "station_playlist_links" ADD CONSTRAINT "station_playlist_links_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_playlist_links" ADD CONSTRAINT "station_playlist_links_playlist_id_station_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."station_playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Datos: las emisoras propias comparten una biblioteca. Sus playlists y audios pasan a la biblioteca
-- (sin dueño) y cada emisora propia que ya las tenía queda enlazada para no perder nada.
INSERT INTO "station_playlist_links" ("station_id", "playlist_id") SELECT sp."station_id", sp."id" FROM "station_playlists" sp JOIN "stations" s ON s."id" = sp."station_id" WHERE s."kind" = 'own' ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "station_playlists" SET "station_id" = NULL WHERE "station_id" IN (SELECT "id" FROM "stations" WHERE "kind" = 'own');--> statement-breakpoint
UPDATE "station_tracks" SET "station_id" = NULL WHERE "station_id" IN (SELECT "id" FROM "stations" WHERE "kind" = 'own');
