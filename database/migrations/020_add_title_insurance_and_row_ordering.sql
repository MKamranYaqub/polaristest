-- Add title_insurance_cost field to quote results tables and row ordering to app_constants

-- Add title_insurance_cost to quote_results (BTL)
ALTER TABLE quote_results ADD COLUMN IF NOT EXISTS title_insurance_cost NUMERIC;

COMMENT ON COLUMN quote_results.title_insurance_cost IS 'Title insurance cost for the BTL loan';

-- Add title_insurance_cost to bridge_quote_results (Bridging)
ALTER TABLE bridge_quote_results ADD COLUMN IF NOT EXISTS title_insurance_cost NUMERIC;

COMMENT ON COLUMN bridge_quote_results.title_insurance_cost IS 'Title insurance cost for the bridging loan';

-- Add row_order configuration to app_constants for results table row ordering
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS results_row_order JSONB;

COMMENT ON COLUMN app_constants.results_row_order IS 'Display order configuration for results table rows (JSON object with btl and bridge arrays)';

-- Initialize default row ordering (matching current display order in calculators)
INSERT INTO app_constants (key, results_row_order)
VALUES (
  'results_table_row_order',
  '{
    "btl": [
      "APRC",
      "Admin Fee",
      "Broker Client Fee",
      "Broker Commission (Proc Fee %)",
      "Broker Commission (Proc Fee £)",
      "Deferred Interest %",
      "Deferred Interest £",
      "Direct Debit",
      "ERC",
      "Exit Fee",
      "Gross Loan",
      "ICR",
      "LTV",
      "Monthly Interest Cost",
      "NBP",
      "Net Loan",
      "Net LTV",
      "Pay Rate",
      "Product Fee %",
      "Product Fee £",
      "Revert Rate",
      "Revert Rate DD",
      "Rolled Months",
      "Rolled Months Interest",
      "Serviced Interest",
      "Title Insurance Cost",
      "Total Cost to Borrower",
      "Total Loan Term"
    ],
    "bridge": [
      "APRC",
      "Admin Fee",
      "Broker Client Fee",
      "Broker Comission (Proc Fee %)",
      "Broker Comission (Proc Fee £)",
      "Commitment Fee £",
      "Deferred Interest %",
      "Deferred Interest £",
      "Direct Debit",
      "ERC",
      "ERC (Fusion Only)",
      "Exit Fee",
      "Gross Loan",
      "ICR",
      "LTV",
      "Monthly Interest Cost",
      "NBP",
      "Net Loan",
      "Net LTV",
      "Pay Rate",
      "Product Fee %",
      "Product Fee £",
      "Revert Rate",
      "Revert Rate DD",
      "Rolled Months",
      "Rolled Months Interest",
      "Serviced Interest",
      "Title Insurance Cost",
      "Total Cost to Borrower",
      "Total Loan Term"
    ]
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET 
  results_row_order = CASE 
    WHEN app_constants.results_row_order IS NULL THEN EXCLUDED.results_row_order 
    ELSE app_constants.results_row_order 
  END,
  updated_at = NOW();
