-- Migration: 0007_seed_batch_source_type.sql
-- Add source_type to seed_batches table

ALTER TABLE "seed_batches" ADD COLUMN IF NOT EXISTS "source_type" text;
