-- Make plantingLogId nullable to support tree harvests
ALTER TABLE "harvest_logs" ALTER COLUMN "planting_log_id" DROP NOT NULL;

-- Add optional treeId for tree harvests
ALTER TABLE "harvest_logs" ADD COLUMN IF NOT EXISTS "tree_id" uuid REFERENCES "trees"("id") ON DELETE SET NULL;
