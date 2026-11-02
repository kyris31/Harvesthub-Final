-- Record the date a planting's status changed away from 'active' (harvested, completed, failed),
-- so cultivation activities can tell whether a planting was still active on a given date.
ALTER TABLE "planting_logs" ADD COLUMN IF NOT EXISTS "status_changed_date" date;

-- Backfill finished plantings: recorded harvest date, else latest harvest log, else last update.
UPDATE "planting_logs" p
SET "status_changed_date" = COALESCE(
  p."actual_harvest_date",
  (SELECT MAX(h."harvest_date") FROM "harvest_logs" h WHERE h."planting_log_id" = p."id" AND h."deleted_at" IS NULL),
  p."updated_at"::date
)
WHERE p."status" IS NOT NULL AND p."status" <> 'active' AND p."status_changed_date" IS NULL;
