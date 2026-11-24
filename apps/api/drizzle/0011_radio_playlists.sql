CREATE TABLE "playlist_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_tracks" (
	"playlist_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "playlist_tracks_playlist_id_track_id_pk" PRIMARY KEY("playlist_id","track_id")
);
--> statement-breakpoint
CREATE TABLE "station_listener_samples" (
	"station_id" uuid NOT NULL,
	"sampled_at" timestamp with time zone NOT NULL,
	"listeners" integer NOT NULL,
	CONSTRAINT "station_listener_samples_station_id_sampled_at_pk" PRIMARY KEY("station_id","sampled_at")
);
--> statement-breakpoint
CREATE TABLE "station_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mode" text DEFAULT 'rotacion' NOT NULL,
	"weight" smallint DEFAULT 50 NOT NULL,
	"shuffle" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "station_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"duration_sec" integer,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playlist_schedules" ADD CONSTRAINT "playlist_schedules_playlist_id_station_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."station_playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_station_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."station_playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_station_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."station_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_listener_samples" ADD CONSTRAINT "station_listener_samples_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_playlists" ADD CONSTRAINT "station_playlists_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_tracks" ADD CONSTRAINT "station_tracks_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playlist_schedules_playlist_idx" ON "playlist_schedules" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "playlist_tracks_position_idx" ON "playlist_tracks" USING btree ("playlist_id","position");--> statement-breakpoint
CREATE INDEX "station_playlists_station_idx" ON "station_playlists" USING btree ("station_id");--> statement-breakpoint
CREATE UNIQUE INDEX "station_tracks_key_idx" ON "station_tracks" USING btree ("station_id","storage_key");