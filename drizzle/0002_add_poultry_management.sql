-- Add Poultry Management Tables

-- Flocks table
CREATE TABLE IF NOT EXISTS "flocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"breed" text,
	"purpose" text NOT NULL,
	"initial_count" integer NOT NULL,
	"current_count" integer NOT NULL,
	"date_acquired" date NOT NULL,
	"supplier" text,
	"cost_per_bird" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"housing_location" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "flocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);

-- Poultry Feed Inventory table
CREATE TABLE IF NOT EXISTS "poultry_feed_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"feed_type" text NOT NULL,
	"brand" text,
	"description" text,
	"purchase_date" date,
	"supplier_id" uuid,
	"initial_quantity" numeric(10, 2) NOT NULL,
	"current_quantity" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"cost_per_unit" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"expiry_date" date,
	"batch_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "poultry_feed_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "poultry_feed_inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE set null ON UPDATE no action
);

-- Egg Production Records table
CREATE TABLE IF NOT EXISTS "egg_production" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"collection_date" date NOT NULL,
	"eggs_collected" integer NOT NULL,
	"eggs_cracked" integer DEFAULT 0,
	"eggs_small" integer DEFAULT 0,
	"eggs_medium" integer DEFAULT 0,
	"eggs_large" integer DEFAULT 0,
	"eggs_x_large" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "egg_production_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "egg_production_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "flocks"("id") ON DELETE cascade ON UPDATE no action
);

-- Mortality Records table
CREATE TABLE IF NOT EXISTS "mortality_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"record_date" date NOT NULL,
	"count" integer NOT NULL,
	"cause" text,
	"symptoms" text,
	"action_taken" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mortality_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "mortality_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "flocks"("id") ON DELETE cascade ON UPDATE no action
);

-- Health Records table
CREATE TABLE IF NOT EXISTS "health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"record_date" date NOT NULL,
	"record_type" text NOT NULL,
	"description" text NOT NULL,
	"product_used" text,
	"dosage" text,
	"administered_by" text,
	"birds_affected" integer,
	"cost" numeric(10, 2),
	"next_due_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "health_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "flocks"("id") ON DELETE cascade ON UPDATE no action
);

-- Feed Usage Records table
CREATE TABLE IF NOT EXISTS "feed_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"feed_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"quantity_used" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_usage_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "feed_usage_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "flocks"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "feed_usage_records_feed_id_poultry_feed_inventory_id_fk" FOREIGN KEY ("feed_id") REFERENCES "poultry_feed_inventory"("id") ON DELETE restrict ON UPDATE no action
);

-- Add constraints
ALTER TABLE "poultry_feed_inventory" ADD CONSTRAINT "chk_feed_quantities" CHECK ("current_quantity" >= 0);
ALTER TABLE "poultry_feed_inventory" ADD CONSTRAINT "chk_feed_quantity_consistency" CHECK ("current_quantity" <= "initial_quantity");
ALTER TABLE "flocks" ADD CONSTRAINT "chk_flock_count" CHECK ("current_count" >= 0);
