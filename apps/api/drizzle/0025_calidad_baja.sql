-- Calidad baja del HLS por estación (señal lenta o datos móviles)
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "calidad_baja_kbps" integer DEFAULT 48 NOT NULL;
