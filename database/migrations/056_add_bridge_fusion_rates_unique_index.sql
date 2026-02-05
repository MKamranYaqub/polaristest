-- Migration 056: Add unique index for bridge_fusion_rates_full table
-- This enables CSV import with upsert functionality (update existing, insert new)
-- The index includes start_date so rates can be versioned by date

-- Drop existing unique constraints if they exist (might have different columns)
DROP INDEX IF EXISTS ux_bridge_fusion_rates_unique;
DROP INDEX IF EXISTS idx_bridge_fusion_rates_unique;
DROP INDEX IF EXISTS uq_bridge_fusion_rates_full_all_columns;

-- Create unique index matching the CSV import onConflict columns
-- This allows the same rate configuration to exist with different start_dates (versioning)
CREATE UNIQUE INDEX idx_bridge_fusion_rates_unique 
ON bridge_fusion_rates_full (set_key, property, product, type, charge_type, product_fee, min_ltv, max_ltv, start_date);

-- Add comment explaining the index purpose
COMMENT ON INDEX idx_bridge_fusion_rates_unique IS 
'Unique constraint for CSV import upsert. Allows same rate config with different start_dates for versioning.';
