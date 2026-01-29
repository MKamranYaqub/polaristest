-- Migration 057: Add quote_include_title_insurance field to quotes tables
-- This allows users to optionally include Title Insurance in the PDF quote

-- Add to BTL quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_include_title_insurance BOOLEAN DEFAULT false;

-- Add to Bridge quotes table
ALTER TABLE bridge_quotes 
ADD COLUMN IF NOT EXISTS quote_include_title_insurance BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN quotes.quote_include_title_insurance IS 'Whether to include Title Insurance section in the PDF quote';
COMMENT ON COLUMN bridge_quotes.quote_include_title_insurance IS 'Whether to include Title Insurance section in the PDF quote';
