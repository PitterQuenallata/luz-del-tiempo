-- Espacio para audios por emisora (antes una sola cuota para todas)
ALTER TABLE "radios" ADD COLUMN IF NOT EXISTS "storage_quota_mb" integer DEFAULT 10240 NOT NULL;
