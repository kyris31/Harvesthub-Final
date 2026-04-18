-- Junction table: cultivation activity → multiple plantings
CREATE TABLE "cultivation_activity_plantings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cultivation_activity_id" uuid NOT NULL REFERENCES "cultivation_activities"("id") ON DELETE CASCADE,
  "planting_log_id" uuid NOT NULL REFERENCES "planting_logs"("id") ON DELETE CASCADE,
  UNIQUE("cultivation_activity_id", "planting_log_id")
);

-- Migrate existing single planting_log_id values to junction table
INSERT INTO "cultivation_activity_plantings" ("cultivation_activity_id", "planting_log_id")
SELECT "id", "planting_log_id"
FROM "cultivation_activities"
WHERE "planting_log_id" IS NOT NULL;

-- Junction table: cultivation activity → multiple inputs
CREATE TABLE "cultivation_activity_inputs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cultivation_activity_id" uuid NOT NULL REFERENCES "cultivation_activities"("id") ON DELETE CASCADE,
  "input_inventory_id" uuid NOT NULL REFERENCES "input_inventory"("id") ON DELETE CASCADE,
  "quantity_used" decimal(10, 2),
  "quantity_unit" text,
  "cost" decimal(10, 2)
);

-- Migrate existing single input values to junction table
INSERT INTO "cultivation_activity_inputs" ("cultivation_activity_id", "input_inventory_id", "quantity_used", "quantity_unit", "cost")
SELECT "id", "input_inventory_id", "quantity_used", "quantity_unit", "cost"
FROM "cultivation_activities"
WHERE "input_inventory_id" IS NOT NULL;
