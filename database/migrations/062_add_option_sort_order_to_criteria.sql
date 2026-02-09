-- Migration: Add option_sort_order column to criteria_config_flat
-- Purpose: Allow configurable sorting of dropdown options in BTL/Bridging criteria fields
-- 
-- Usage:
--   option_sort_order = 1: First option (e.g., "No")
--   option_sort_order = 2: Second priority
--   option_sort_order = 3+: Standard options sorted by tier
--   option_sort_order = NULL: Default to tier-based sorting
--
-- Date: 2026-02-09

BEGIN;

-- Add option_sort_order column
ALTER TABLE criteria_config_flat 
ADD COLUMN IF NOT EXISTS option_sort_order INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN criteria_config_flat.option_sort_order IS 
  'Controls the display order of options within a question. Lower numbers appear first. NULL values sort by tier.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_criteria_option_sort_order 
ON criteria_config_flat(question_key, option_sort_order) 
WHERE option_sort_order IS NOT NULL;

-- Example: Set "No" options to sort first (option_sort_order = 1)
-- Uncomment and customize as needed:
-- UPDATE criteria_config_flat 
-- SET option_sort_order = 1 
-- WHERE LOWER(TRIM(option_label)) = 'no';

COMMIT;

-- Verification query:
-- SELECT question_key, option_label, tier, option_sort_order, display_order
-- FROM criteria_config_flat
-- WHERE criteria_set = 'BTL'
-- ORDER BY display_order, question_key, option_sort_order NULLS LAST, tier;
