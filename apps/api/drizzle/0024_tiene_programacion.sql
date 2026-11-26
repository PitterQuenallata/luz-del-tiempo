-- Estaciones con programas (por defecto sí; la principal las tiene, una de solo música no)
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "tiene_programacion" boolean DEFAULT true NOT NULL;
