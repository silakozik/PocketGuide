CREATE TABLE IF NOT EXISTS "saved_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"cityName" text,
	"stops" jsonb NOT NULL,
	"routeData" jsonb,
	"durationMinutes" integer,
	"distanceKm" double precision,
	"status" text DEFAULT 'planned',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_trips" ADD CONSTRAINT "saved_trips_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
