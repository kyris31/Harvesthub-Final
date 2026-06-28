-- Link sale items back to the egg production batch they were sold from, so
-- editing a sale can reconcile egg stock the same way it does harvest stock.
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "egg_production_id" uuid REFERENCES "egg_production"("id") ON DELETE SET NULL;
