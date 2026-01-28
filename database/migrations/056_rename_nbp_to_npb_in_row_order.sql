-- Migration 056: Rename NBP to NPB in results row order
-- This updates the stored row order JSON to use the correct label "NPB" instead of "NBP"

-- Update BTL row order: Replace "NBP" with "NPB"
UPDATE app_constants
SET results_row_order = jsonb_set(
  results_row_order,
  '{btl}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem = 'NBP' THEN 'NPB'
        WHEN elem = 'NBP LTV' THEN 'NPB LTV'
        ELSE elem
      END
    )
    FROM jsonb_array_elements_text(results_row_order->'btl') AS elem
  )
)
WHERE key = 'global_settings'
  AND results_row_order->'btl' IS NOT NULL;

-- Update Bridge row order: Replace "NBP" with "NPB"  
UPDATE app_constants
SET results_row_order = jsonb_set(
  results_row_order,
  '{bridge}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem = 'NBP' THEN 'NPB'
        WHEN elem = 'NBP LTV' THEN 'NPB LTV'
        ELSE elem
      END
    )
    FROM jsonb_array_elements_text(results_row_order->'bridge') AS elem
  )
)
WHERE key = 'global_settings'
  AND results_row_order->'bridge' IS NOT NULL;

-- Update Core row order: Replace "NBP" with "NPB"
UPDATE app_constants
SET results_row_order = jsonb_set(
  results_row_order,
  '{core}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem = 'NBP' THEN 'NPB'
        WHEN elem = 'NBP LTV' THEN 'NPB LTV'
        ELSE elem
      END
    )
    FROM jsonb_array_elements_text(results_row_order->'core') AS elem
  )
)
WHERE key = 'global_settings'
  AND results_row_order->'core' IS NOT NULL;

-- Also update label_aliases if they exist
UPDATE app_constants
SET label_aliases = jsonb_set(
  jsonb_set(
    label_aliases - 'NBP' - 'NBP LTV',
    '{NPB}',
    COALESCE(label_aliases->'NBP', '"NPB"'::jsonb)
  ),
  '{NPB LTV}',
  COALESCE(label_aliases->'NBP LTV', '"NPB LTV"'::jsonb)
)
WHERE key = 'global_settings'
  AND (label_aliases ? 'NBP' OR label_aliases ? 'NBP LTV');
