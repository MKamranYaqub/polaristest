-- Migration 058: Add separate proc fee columns for Specialist and Core
-- This allows saving different proc fee percentages for each product range

-- Add columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS proc_fee_specialist_percent NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS proc_fee_core_percent NUMERIC;

-- Migrate existing broker_commission_percent to both columns for existing data
-- (Assuming existing data was Specialist rate)
UPDATE quotes 
SET proc_fee_specialist_percent = broker_commission_percent,
    proc_fee_core_percent = broker_commission_percent
WHERE broker_commission_percent IS NOT NULL 
  AND proc_fee_specialist_percent IS NULL;

-- Add columns to bridge_quotes table as well
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS proc_fee_specialist_percent NUMERIC;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS proc_fee_core_percent NUMERIC;

-- Migrate existing bridge_quotes broker_commission_percent
UPDATE bridge_quotes 
SET proc_fee_specialist_percent = broker_commission_percent,
    proc_fee_core_percent = broker_commission_percent
WHERE broker_commission_percent IS NOT NULL 
  AND proc_fee_specialist_percent IS NULL;

COMMENT ON COLUMN quotes.proc_fee_specialist_percent IS 'Proc fee percentage for Specialist product range';
COMMENT ON COLUMN quotes.proc_fee_core_percent IS 'Proc fee percentage for Core product range';
