-- Harvest Orders: pre-harvest customer order management
-- Migration: 0005_harvest_orders.sql

CREATE TABLE IF NOT EXISTS "harvest_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "order_date" date NOT NULL,
    "notes" text,
    "status" text DEFAULT 'open' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "harvest_order_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "harvest_orders"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
    "customer_name" text NOT NULL,
    "product_name" text NOT NULL,
    "quantity_kg" numeric(10, 2) NOT NULL,
    "unit" text DEFAULT 'kg' NOT NULL,
    "price_per_unit" numeric(10, 2),
    "total_price" numeric(10, 2),
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "harvest_orders_user_idx" ON "harvest_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "harvest_order_items_order_idx" ON "harvest_order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "harvest_order_items_customer_idx" ON "harvest_order_items" ("customer_id");
