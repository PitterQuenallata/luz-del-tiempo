CREATE TABLE "live_streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "live_streams_platform_idx" ON "live_streams" USING btree ("platform");--> statement-breakpoint
ALTER TABLE "live_status" DROP COLUMN "platform";--> statement-breakpoint
ALTER TABLE "live_status" DROP COLUMN "url";