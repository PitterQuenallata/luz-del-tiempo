-- Orden de las listas de reproducción dentro de cada estación (de arriba abajo = orden de sonido).
ALTER TABLE "station_playlist_links" ADD COLUMN IF NOT EXISTS "position" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Orden inicial: el orden en que se vincularon (createdAt de la lista).
WITH ordenadas AS (
  SELECT l."station_id", l."playlist_id", ROW_NUMBER() OVER (PARTITION BY l."station_id" ORDER BY sp."created_at") - 1 AS pos
  FROM "station_playlist_links" l JOIN "station_playlists" sp ON sp."id" = l."playlist_id"
)
UPDATE "station_playlist_links" l SET "position" = o.pos
FROM ordenadas o WHERE l."station_id" = o."station_id" AND l."playlist_id" = o."playlist_id";
