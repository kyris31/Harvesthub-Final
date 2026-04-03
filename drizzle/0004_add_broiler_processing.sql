-- Migration: Add broiler_processing_records table
-- Run this in your Neon SQL Editor

CREATE TABLE IF NOT EXISTS "broiler_processing_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "flock_id" uuid NOT NULL REFERENCES "flocks"("id") ON DELETE CASCADE,
    "processing_date" date NOT NULL,
    "birds_processed" integer NOT NULL,
    "avg_weight_kg" numeric(10, 3),
    "total_weight_kg" numeric(10, 2),
    "price_per_kg" numeric(10, 2),
    "total_revenue" numeric(10, 2),
    "processing_cost" numeric(10, 2) DEFAULT '0',
    "transport_cost" numeric(10, 2) DEFAULT '0',
    "other_costs" numeric(10, 2) DEFAULT '0',
    "buyer_name" text,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
