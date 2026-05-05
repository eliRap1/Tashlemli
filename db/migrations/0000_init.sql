CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE TABLE "airlines" (
	"iata" text PRIMARY KEY NOT NULL,
	"legal_name" text,
	"legal_entity_country" text,
	"primary_contact_email" text,
	"fallback_contact_email" text,
	"preferred_language" text,
	"jurisdiction_response" text,
	"tone_profile" text,
	"historical_success_rate" numeric,
	"median_settlement_days" integer,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"channel" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"code" text NOT NULL,
	"actor" text NOT NULL,
	"label_he" text NOT NULL,
	"label_en" text NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"flight_id" uuid,
	"airline_iata" text,
	"jurisdiction" text NOT NULL,
	"reason_category" text NOT NULL,
	"amount_ils" integer NOT NULL,
	"current_state" text DEFAULT 'intake.received' NOT NULL,
	"current_stage_index" smallint DEFAULT 1 NOT NULL,
	"passenger_name" text NOT NULL,
	"passenger_id_he" text,
	"contact_email" "citext",
	"contact_phone" text,
	"claim_token" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_claim_token_unique" UNIQUE("claim_token")
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flight_number" text NOT NULL,
	"date" date NOT NULL,
	"airline_iata" text,
	"departure_iata" text,
	"arrival_iata" text,
	"scheduled_dep" timestamp with time zone,
	"actual_dep" timestamp with time zone,
	"scheduled_arr" timestamp with time zone,
	"actual_arr" timestamp with time zone,
	"status" text,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flights_uniq" UNIQUE("flight_number","date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext",
	"phone" text,
	"full_name" text,
	"privacy_mode" text DEFAULT 'anonymous' NOT NULL,
	"language" text DEFAULT 'he' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_airline_iata_airlines_iata_fk" FOREIGN KEY ("airline_iata") REFERENCES "public"."airlines"("iata") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mlt_user_exp_idx" ON "magic_link_tokens" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "claim_events_claim_occurred_idx" ON "claim_events" USING btree ("claim_id","occurred_at");--> statement-breakpoint
CREATE INDEX "claims_user_created_idx" ON "claims" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "claims_state_updated_idx" ON "claims" USING btree ("current_state","updated_at");