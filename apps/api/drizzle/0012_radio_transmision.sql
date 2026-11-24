ALTER TABLE "stations" ADD COLUMN "mount_point" text;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "live_password_enc" text;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "bitrate_kbps" smallint DEFAULT 128 NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "autodj_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "max_listeners" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD COLUMN "storage_quota_mb" integer DEFAULT 5120 NOT NULL;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_mount_point_unique" UNIQUE("mount_point");