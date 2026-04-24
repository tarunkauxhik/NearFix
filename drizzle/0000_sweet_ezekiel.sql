CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'provider_accepted', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."provider_profile_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"provider_category" varchar(128) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_price" numeric(10, 2) NOT NULL,
	"scheduled_date" varchar(32) NOT NULL,
	"scheduled_time" varchar(32) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_phone" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"landmark" varchar(255),
	"payment_method" varchar(64) DEFAULT 'pay_after' NOT NULL,
	"platform_fee" numeric(10, 2) DEFAULT '29.00' NOT NULL,
	"gst_amount" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"booking_ref" varchar(32) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"business_name" varchar(120),
	"full_name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"city" varchar(80) NOT NULL,
	"service_area" varchar(160) NOT NULL,
	"category" varchar(64) NOT NULL,
	"years_experience" integer NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"bio" text NOT NULL,
	"has_own_tools" boolean DEFAULT false NOT NULL,
	"offers_emergency_services" boolean DEFAULT false NOT NULL,
	"consent_terms" boolean NOT NULL,
	"consent_background_check" boolean NOT NULL,
	"consent_data_processing" boolean NOT NULL,
	"status" "provider_profile_status" DEFAULT 'draft' NOT NULL,
	"review_notes" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_provider_profile_clerk_user" ON "provider_profiles" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_provider" ON "saved_providers" USING btree ("user_id","provider_id");