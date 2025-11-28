-- Migration: Add dedicated column for results table label aliases
-- This stores custom display labels for each loan type's results table

-- Add the label_aliases column to app_constants table
ALTER TABLE app_constants
ADD COLUMN IF NOT EXISTS label_aliases JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN app_constants.label_aliases IS 'Stores custom label aliases for results table rows, organized by loan type (btl, bridge, core)';

-- Create an index for faster lookups on the key column if not exists
CREATE INDEX IF NOT EXISTS idx_app_constants_key ON app_constants(key);

-- Insert or update the initial record for label aliases
INSERT INTO app_constants (key, label_aliases, updated_at)
VALUES (
  'results_table_label_aliases',
  '{"btl": {}, "bridge": {}, "core": {}}'::jsonb,
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  label_aliases = COALESCE(
    app_constants.label_aliases,
    CASE 
      WHEN app_constants.value IS NOT NULL AND app_constants.value::text != 'null' 
      THEN app_constants.value 
      ELSE '{"btl": {}, "bridge": {}, "core": {}}'::jsonb 
    END
  ),
  updated_at = NOW()
WHERE app_constants.key = 'results_table_label_aliases';
