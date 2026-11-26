-- Horarios de las listas: opciones de las listas programadas
ALTER TABLE "station_playlists" ADD COLUMN IF NOT EXISTS "interrumpe" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "station_playlists" ADD COLUMN IF NOT EXISTS "una_sola" boolean DEFAULT false NOT NULL;
