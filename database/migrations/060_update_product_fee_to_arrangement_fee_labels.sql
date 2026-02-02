-- Migration: Update "Product Fee" labels to "Arrangement Fee" in saved label configurations
-- This updates existing saved label aliases in results_configuration table
-- Date: 2026-02-02
-- Reason: Terminology standardization - "Arrangement Fee" is more common in UK lending

-- Update BTL calculator label aliases
UPDATE results_configuration
SET config = jsonb_set(
  jsonb_set(config, '{Product Fee %}', '"Arrangement Fee %"'::jsonb),
  '{Product Fee £}', '"Arrangement Fee £"'::jsonb
)
WHERE key = 'label_aliases' 
  AND calculator_type = 'btl'
  AND config ? 'Product Fee %';

-- Update Bridge calculator label aliases
UPDATE results_configuration
SET config = jsonb_set(
  jsonb_set(config, '{Product Fee %}', '"Arrangement Fee %"'::jsonb),
  '{Product Fee £}', '"Arrangement Fee £"'::jsonb
)
WHERE key = 'label_aliases' 
  AND calculator_type = 'bridge'
  AND config ? 'Product Fee %';

-- Update Core calculator label aliases
UPDATE results_configuration
SET config = jsonb_set(
  jsonb_set(config, '{Product Fee %}', '"Arrangement Fee %"'::jsonb),
  '{Product Fee £}', '"Arrangement Fee £"'::jsonb
)
WHERE key = 'label_aliases' 
  AND calculator_type = 'core'
  AND config ? 'Product Fee %';

-- Verify the update
SELECT 
  key, 
  calculator_type,
  config->>'Product Fee %' as arrangement_fee_percent_label,
  config->>'Product Fee £' as arrangement_fee_pounds_label
FROM results_configuration 
WHERE key = 'label_aliases';
