-- Migration 055: Add min_icr column to bridge_fusion_rates_full table
-- This column stores the minimum ICR (Interest Coverage Ratio) threshold for Fusion products
-- When ICR falls below this threshold, it should be highlighted in red in the UI

-- Add min_icr column to bridge_fusion_rates_full
ALTER TABLE bridge_fusion_rates_full 
ADD COLUMN IF NOT EXISTS min_icr NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN bridge_fusion_rates_full.min_icr IS 'Minimum ICR (Interest Coverage Ratio) threshold percentage. If calculated ICR is below this value, it should be highlighted as a warning. Only applicable to Fusion products.';

-- Set default value of 110 for Fusion products only
UPDATE bridge_fusion_rates_full
SET min_icr = 110
WHERE LOWER(set_key) = 'fusion' AND min_icr IS NULL;

-- Bridge products don't have ICR, so leave min_icr as NULL for them
-- This allows the UI to check: if min_icr is set AND icr < min_icr, show warning
