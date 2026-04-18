-- Junction table: cultivation activity → trees
CREATE TABLE IF NOT EXISTS "cultivation_activity_trees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cultivation_activity_id" uuid NOT NULL REFERENCES "cultivation_activities"("id") ON DELETE CASCADE,
  "tree_id" uuid NOT NULL REFERENCES "trees"("id") ON DELETE CASCADE,
  UNIQUE("cultivation_activity_id", "tree_id")
);
