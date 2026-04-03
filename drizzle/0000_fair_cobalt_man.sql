CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"season_id" uuid,
	"crop_id" uuid NOT NULL,
	"plot_id" uuid,
	"planned_planting_date" date,
	"planned_harvest_date" date,
	"target_quantity" numeric(10, 2),
	"target_unit" text,
	"estimated_cost" numeric(10, 2),
	"status" text DEFAULT 'planned',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_plan_dates" CHECK ("crop_plans"."planned_harvest_date" IS NULL OR "crop_plans"."planned_planting_date" IS NULL OR "crop_plans"."planned_harvest_date" > "crop_plans"."planned_planting_date")
);
--> statement-breakpoint
CREATE TABLE "crop_seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_season_dates" CHECK ("crop_seasons"."end_date" > "crop_seasons"."start_date")
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"variety" text,
	"category" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cultivation_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"planting_log_id" uuid,
	"activity_type" text NOT NULL,
	"activity_date" date NOT NULL,
	"input_inventory_id" uuid,
	"quantity_used" numeric(10, 2),
	"quantity_unit" text,
	"cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"customer_type" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"expense_date" date NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"supplier_id" uuid,
	"payment_method" text,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_expense_amount" CHECK ("expenses"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "feed_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"feed_date" date NOT NULL,
	"feed_type" text NOT NULL,
	"quantity_kg" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_feed_quantity" CHECK ("feed_logs"."quantity_kg" > 0),
	CONSTRAINT "chk_feed_cost" CHECK ("feed_logs"."cost" IS NULL OR "feed_logs"."cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "flock_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flock_id" uuid NOT NULL,
	"record_date" date NOT NULL,
	"record_type" text NOT NULL,
	"eggs_collected" integer,
	"mortality_count" integer,
	"mortality_reason" text,
	"health_status" text,
	"health_issues" text,
	"average_weight_kg" numeric(10, 2),
	"birds_weighed" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_eggs_positive" CHECK ("flock_records"."eggs_collected" IS NULL OR "flock_records"."eggs_collected" >= 0),
	CONSTRAINT "chk_mortality_positive" CHECK ("flock_records"."mortality_count" IS NULL OR "flock_records"."mortality_count" > 0),
	CONSTRAINT "chk_weight_positive" CHECK ("flock_records"."average_weight_kg" IS NULL OR "flock_records"."average_weight_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "flocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"flock_type" text NOT NULL,
	"species" text NOT NULL,
	"breed" text,
	"hatch_date" date,
	"initial_count" integer NOT NULL,
	"current_count" integer NOT NULL,
	"status" text DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_flock_counts" CHECK ("flocks"."initial_count" > 0 AND "flocks"."current_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "harvest_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"planting_log_id" uuid NOT NULL,
	"harvest_date" date NOT NULL,
	"quantity_harvested" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"current_stock" numeric(10, 2) NOT NULL,
	"quality_grade" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_harvest_quantities" CHECK ("harvest_logs"."quantity_harvested" > 0 AND "harvest_logs"."current_stock" >= 0 AND "harvest_logs"."current_stock" <= "harvest_logs"."quantity_harvested")
);
--> statement-breakpoint
CREATE TABLE "input_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"supplier_id" uuid,
	"purchase_date" date,
	"initial_quantity" numeric(10, 2),
	"current_quantity" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"cost_per_unit" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"minimum_stock_level" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_input_quantity" CHECK ("input_inventory"."current_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "planting_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"crop_id" uuid NOT NULL,
	"plot_id" uuid,
	"seed_batch_id" uuid,
	"purchased_seedling_id" uuid,
	"planting_date" date NOT NULL,
	"quantity_planted" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"expected_harvest_date" date,
	"actual_harvest_date" date,
	"status" text DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_harvest_dates" CHECK ("planting_logs"."actual_harvest_date" IS NULL OR "planting_logs"."actual_harvest_date" >= "planting_logs"."planting_date")
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"area_sqm" numeric(10, 2),
	"status" text DEFAULT 'available',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "purchased_seedlings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"crop_id" uuid NOT NULL,
	"supplier_id" uuid,
	"purchase_date" date NOT NULL,
	"quantity_purchased" integer NOT NULL,
	"current_quantity" integer NOT NULL,
	"cost_per_seedling" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_seedling_quantities" CHECK ("purchased_seedlings"."current_quantity" >= 0 AND "purchased_seedlings"."current_quantity" <= "purchased_seedlings"."quantity_purchased")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"planting_log_id" uuid,
	"flock_id" uuid,
	"tree_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"reminder_date" date NOT NULL,
	"reminder_time" time,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"harvest_log_id" uuid,
	"product_name" text NOT NULL,
	"product_description" text,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_sale_item_amounts" CHECK ("sale_items"."quantity" > 0 AND "sale_items"."unit_price" >= 0 AND "sale_items"."discount_percent" >= 0 AND "sale_items"."discount_percent" <= 100 AND "sale_items"."discount_amount" >= 0 AND "sale_items"."subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"customer_id" uuid,
	"sale_date" date NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"amount_paid" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_amounts" CHECK ("sales"."total_amount" >= 0 AND "sales"."amount_paid" >= 0 AND "sales"."amount_paid" <= "sales"."total_amount")
);
--> statement-breakpoint
CREATE TABLE "seed_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"crop_id" uuid NOT NULL,
	"supplier_id" uuid,
	"batch_code" text NOT NULL,
	"purchase_date" date,
	"initial_quantity" numeric(10, 2) NOT NULL,
	"current_quantity" numeric(10, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"cost_per_unit" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"organic_certified" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "seed_batches_batch_code_unique" UNIQUE("batch_code"),
	CONSTRAINT "chk_quantities" CHECK ("seed_batches"."current_quantity" >= 0),
	CONSTRAINT "chk_quantity_consistency" CHECK ("seed_batches"."current_quantity" <= "seed_batches"."initial_quantity")
);
--> statement-breakpoint
CREATE TABLE "seedling_production_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"seed_batch_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"sowing_date" date NOT NULL,
	"quantity_sown" numeric(10, 2) NOT NULL,
	"sowing_unit" text NOT NULL,
	"nursery_location" text,
	"expected_seedlings" integer,
	"actual_seedlings_produced" integer DEFAULT 0,
	"current_seedlings_available" integer DEFAULT 0,
	"ready_for_transplant_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_seedling_production" CHECK ("seedling_production_logs"."current_seedlings_available" >= 0 AND "seedling_production_logs"."current_seedlings_available" <= "seedling_production_logs"."actual_seedlings_produced" AND "seedling_production_logs"."actual_seedlings_produced" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"identifier" text NOT NULL,
	"species" text NOT NULL,
	"variety" text,
	"planting_date" date,
	"plot_id" uuid,
	"location_description" text,
	"status" text DEFAULT 'healthy',
	"health_notes" text,
	"last_harvest_date" date,
	"estimated_annual_yield" numeric(10, 2),
	"yield_unit" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"image" text,
	"farm_name" text,
	"farm_logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_plans" ADD CONSTRAINT "crop_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_plans" ADD CONSTRAINT "crop_plans_season_id_crop_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."crop_seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_plans" ADD CONSTRAINT "crop_plans_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_plans" ADD CONSTRAINT "crop_plans_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD CONSTRAINT "crop_seasons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultivation_activities" ADD CONSTRAINT "cultivation_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultivation_activities" ADD CONSTRAINT "cultivation_activities_planting_log_id_planting_logs_id_fk" FOREIGN KEY ("planting_log_id") REFERENCES "public"."planting_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultivation_activities" ADD CONSTRAINT "cultivation_activities_input_inventory_id_input_inventory_id_fk" FOREIGN KEY ("input_inventory_id") REFERENCES "public"."input_inventory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_logs" ADD CONSTRAINT "feed_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_logs" ADD CONSTRAINT "feed_logs_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flock_records" ADD CONSTRAINT "flock_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flock_records" ADD CONSTRAINT "flock_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_logs" ADD CONSTRAINT "harvest_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_logs" ADD CONSTRAINT "harvest_logs_planting_log_id_planting_logs_id_fk" FOREIGN KEY ("planting_log_id") REFERENCES "public"."planting_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "input_inventory" ADD CONSTRAINT "input_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "input_inventory" ADD CONSTRAINT "input_inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_logs" ADD CONSTRAINT "planting_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_logs" ADD CONSTRAINT "planting_logs_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_logs" ADD CONSTRAINT "planting_logs_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_logs" ADD CONSTRAINT "planting_logs_seed_batch_id_seed_batches_id_fk" FOREIGN KEY ("seed_batch_id") REFERENCES "public"."seed_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_logs" ADD CONSTRAINT "planting_logs_purchased_seedling_id_purchased_seedlings_id_fk" FOREIGN KEY ("purchased_seedling_id") REFERENCES "public"."purchased_seedlings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_seedlings" ADD CONSTRAINT "purchased_seedlings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_seedlings" ADD CONSTRAINT "purchased_seedlings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_seedlings" ADD CONSTRAINT "purchased_seedlings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_planting_log_id_planting_logs_id_fk" FOREIGN KEY ("planting_log_id") REFERENCES "public"."planting_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_harvest_log_id_harvest_logs_id_fk" FOREIGN KEY ("harvest_log_id") REFERENCES "public"."harvest_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_batches" ADD CONSTRAINT "seed_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_batches" ADD CONSTRAINT "seed_batches_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_batches" ADD CONSTRAINT "seed_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seedling_production_logs" ADD CONSTRAINT "seedling_production_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seedling_production_logs" ADD CONSTRAINT "seedling_production_logs_seed_batch_id_seed_batches_id_fk" FOREIGN KEY ("seed_batch_id") REFERENCES "public"."seed_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seedling_production_logs" ADD CONSTRAINT "seedling_production_logs_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trees" ADD CONSTRAINT "trees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trees" ADD CONSTRAINT "trees_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE set null ON UPDATE no action;