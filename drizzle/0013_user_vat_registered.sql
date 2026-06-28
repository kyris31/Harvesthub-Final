-- Per-user VAT registration flag. Controls whether material costs derived from
-- supplier invoices are stored VAT-inclusive (not registered) or net (registered).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vat_registered" boolean DEFAULT false NOT NULL;
