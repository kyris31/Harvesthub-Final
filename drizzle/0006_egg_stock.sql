-- Migration: 0006_egg_stock.sql
-- Add current_stock to egg_production table for inventory tracking

ALTER TABLE "egg_production" ADD COLUMN IF NOT EXISTS "current_stock" integer NOT NULL DEFAULT 0;

-- Initialize existing records: current_stock = eggs_collected - COALESCE(eggs_cracked, 0)
UPDATE "egg_production"
SET "current_stock" = "eggs_collected" - COALESCE("eggs_cracked", 0)
WHERE "current_stock" = 0 AND "eggs_collected" > COALESCE("eggs_cracked", 0);
