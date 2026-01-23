-- Migration 054: Add rate lifecycle management columns
-- Adds status, start_date, and end_date columns to both BTL (rates_flat) and Bridging (bridge_fusion_rates_full) tables
-- This enables rate scheduling and activation/deactivation management

-- =====================================================
-- BTL Rates Table (rates_flat)
-- =====================================================

-- Add status column with default 'Active'
ALTER TABLE rates_flat 
ADD COLUMN IF NOT EXISTS rate_status TEXT NOT NULL DEFAULT 'Active';

-- Add start_date column with default June 1, 2025
ALTER TABLE rates_flat 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT '2025-06-01';

-- Add end_date column (NULL means no expiry)
ALTER TABLE rates_flat 
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN rates_flat.rate_status IS 'Rate lifecycle status: Active or Inactive';
COMMENT ON COLUMN rates_flat.start_date IS 'Date from which this rate becomes usable (NULL means always active from past)';
COMMENT ON COLUMN rates_flat.end_date IS 'Date after which this rate is no longer usable (NULL means no expiry)';

-- Add constraint to ensure valid status values
ALTER TABLE rates_flat 
DROP CONSTRAINT IF EXISTS rates_flat_status_check;
ALTER TABLE rates_flat 
ADD CONSTRAINT rates_flat_status_check CHECK (rate_status IN ('Active', 'Inactive'));

-- Add constraint to ensure start_date is before end_date (when both are set)
ALTER TABLE rates_flat 
DROP CONSTRAINT IF EXISTS rates_flat_date_range_check;
ALTER TABLE rates_flat 
ADD CONSTRAINT rates_flat_date_range_check CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date);

-- Add index for efficient filtering by status and dates
CREATE INDEX IF NOT EXISTS idx_rates_flat_lifecycle 
ON rates_flat (rate_status, start_date, end_date);

-- =====================================================
-- Bridge/Fusion Rates Table (bridge_fusion_rates_full)
-- =====================================================

-- Add status column with default 'Active'
ALTER TABLE bridge_fusion_rates_full 
ADD COLUMN IF NOT EXISTS rate_status TEXT NOT NULL DEFAULT 'Active';

-- Add start_date column with default June 1, 2025
ALTER TABLE bridge_fusion_rates_full 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT '2025-06-01';

-- Add end_date column (NULL means no expiry)
ALTER TABLE bridge_fusion_rates_full 
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bridge_fusion_rates_full.rate_status IS 'Rate lifecycle status: Active or Inactive';
COMMENT ON COLUMN bridge_fusion_rates_full.start_date IS 'Date from which this rate becomes usable (NULL means always active from past)';
COMMENT ON COLUMN bridge_fusion_rates_full.end_date IS 'Date after which this rate is no longer usable (NULL means no expiry)';

-- Add constraint to ensure valid status values
ALTER TABLE bridge_fusion_rates_full 
DROP CONSTRAINT IF EXISTS bridge_fusion_rates_status_check;
ALTER TABLE bridge_fusion_rates_full 
ADD CONSTRAINT bridge_fusion_rates_status_check CHECK (rate_status IN ('Active', 'Inactive'));

-- Add constraint to ensure start_date is before end_date (when both are set)
ALTER TABLE bridge_fusion_rates_full 
DROP CONSTRAINT IF EXISTS bridge_fusion_rates_date_range_check;
ALTER TABLE bridge_fusion_rates_full 
ADD CONSTRAINT bridge_fusion_rates_date_range_check CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date);

-- Add index for efficient filtering by status and dates
CREATE INDEX IF NOT EXISTS idx_bridge_fusion_rates_lifecycle 
ON bridge_fusion_rates_full (rate_status, start_date, end_date);

-- =====================================================
-- Update existing rates to Active status with June 2025 start date
-- =====================================================

-- Update all existing BTL rates
UPDATE rates_flat 
SET rate_status = 'Active', 
    start_date = '2025-06-01',
    end_date = NULL
WHERE rate_status IS NULL OR rate_status = '';

-- Update all existing Bridge/Fusion rates
UPDATE bridge_fusion_rates_full 
SET rate_status = 'Active', 
    start_date = '2025-06-01',
    end_date = NULL
WHERE rate_status IS NULL OR rate_status = '';

-- =====================================================
-- Add to rate_audit_log table for tracking status changes
-- =====================================================

-- Ensure audit log can track these new fields
-- (The existing rate_audit_log structure should already support field_name tracking)
