-- Per-line VAT/tax on supplier invoice items. Falls back to the invoice-level
-- tax rate when a line doesn't specify its own.
ALTER TABLE "supplier_invoice_items" ADD COLUMN IF NOT EXISTS "tax_rate" numeric(5, 2);
ALTER TABLE "supplier_invoice_items" ADD COLUMN IF NOT EXISTS "tax_amount" numeric(10, 2) DEFAULT '0';
