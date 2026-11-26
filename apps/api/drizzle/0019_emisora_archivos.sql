-- Playlists y audios son de la EMISORA, no de la estación.
-- Las listas que nacieron en una estación pasan a su emisora y quedan vinculadas a esa estación,
-- así que siguen sonando igual. Los audios de estación (si los hay) pasan a la emisora.
INSERT INTO "station_playlist_links" ("station_id", "playlist_id")
SELECT sp."station_id", sp."id" FROM "station_playlists" sp WHERE sp."station_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "station_playlists" sp SET "radio_id" = s."radio_id", "station_id" = NULL
FROM "stations" s WHERE sp."station_id" = s."id";--> statement-breakpoint
UPDATE "station_tracks" t SET "radio_id" = s."radio_id", "station_id" = NULL
FROM "stations" s WHERE t."station_id" = s."id";
