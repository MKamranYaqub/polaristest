-- Add new fields for Multi-Property Loan POC feature
-- These fields extend the bridge_multi_property_details table to support 
-- the Multi-Property Loan section with blended rates

-- Add new columns for Multi-Property Loan data
ALTER TABLE bridge_multi_property_details
ADD COLUMN IF NOT EXISTS sub_product TEXT,
ADD COLUMN IF NOT EXISTS fixed_rate NUMERIC(5, 3),
ADD COLUMN IF NOT EXISTS variable_rate NUMERIC(5, 3),
ADD COLUMN IF NOT EXISTS max_ltv NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS max_gross_loan NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS is_multi_property_loan BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups of multi-property loan rows
CREATE INDEX IF NOT EXISTS idx_bridge_multi_property_details_is_mpl 
ON bridge_multi_property_details(bridge_quote_id, is_multi_property_loan);

-- Add comment
COMMENT ON COLUMN bridge_multi_property_details.sub_product IS 'Sub-product type for Multi-Property Loan rows (e.g., BTL Single Property Investment)';
COMMENT ON COLUMN bridge_multi_property_details.fixed_rate IS 'Fixed bridge rate for this property (monthly %)';
COMMENT ON COLUMN bridge_multi_property_details.variable_rate IS 'Variable bridge rate for this property (monthly %)';
COMMENT ON COLUMN bridge_multi_property_details.max_ltv IS 'Maximum LTV for this property (%)';
COMMENT ON COLUMN bridge_multi_property_details.max_gross_loan IS 'Calculated max gross loan (Property Value × Max LTV - 1st Charge)';
COMMENT ON COLUMN bridge_multi_property_details.is_multi_property_loan IS 'TRUE if this row is from Multi-Property Loan section, FALSE for regular Multi-property section';
