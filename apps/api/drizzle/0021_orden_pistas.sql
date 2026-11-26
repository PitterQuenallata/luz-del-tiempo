-- Orden de los audios dentro de cada lista (independiente del modo de la lista).
-- Antes, "secuencial" era el único que quitaba el sorteo: esas listas pasan a "secuencial"; las demás, a "aleatorio".
ALTER TABLE "station_playlists" ADD COLUMN IF NOT EXISTS "order_pistas" text DEFAULT 'aleatorio' NOT NULL;--> statement-breakpoint
UPDATE "station_playlists" SET "order_pistas" = 'secuencial' WHERE "shuffle" = false;--> statement-breakpoint
ALTER TABLE "station_playlists" ADD CONSTRAINT "station_playlists_order_pistas_check" CHECK ("order_pistas" IN ('mezclado', 'aleatorio', 'secuencial'));
