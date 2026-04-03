-- Modify flocks table to use supplier_id instead of supplier text
ALTER TABLE "flocks" DROP COLUMN IF EXISTS "supplier";
ALTER TABLE "flocks" ADD COLUMN "supplier_id" uuid;
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_supplier_id_suppliers_id_fk" 
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE set null ON UPDATE no action;
