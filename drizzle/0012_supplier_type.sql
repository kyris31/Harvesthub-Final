-- Add supplier_type column to suppliers (was referenced by the form/UI but never existed in the DB)
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "supplier_type" text;
