import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Export all quotes with their results
router.get('/quotes', async (req, res) => {
  try {
    const { calculator_type } = req.query;
    console.log('Export request received for calculator_type:', calculator_type);

    let allData = [];

    // Determine which tables to query
    const shouldQueryBTL = !calculator_type || calculator_type.toLowerCase() === 'btl';
    const shouldQueryBridge = !calculator_type || calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge';

    // Fetch BTL quotes with results
    if (shouldQueryBTL) {
      const { data: btlQuotes, error: btlError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (btlError) {
        console.error('Error fetching BTL quotes:', btlError);
        throw btlError;
      }

      // Fetch results for each BTL quote
      for (const quote of btlQuotes || []) {
        const { data: results, error: resultsError } = await supabase
          .from('quote_results')
          .select('*')
          .eq('quote_id', quote.id);

        if (resultsError) {
          console.error(`Error fetching results for quote ${quote.id}:`, resultsError);
        }

        if (results && results.length > 0) {
          // Create one row per result
          results.forEach((result, index) => {
            allData.push({
              // Quote fields
              reference_number: quote.reference_number,
              quote_name: quote.name,
              calculator_type: quote.calculator_type,
              status: quote.status,
              loan_amount: quote.loan_amount,
              ltv: quote.ltv,
              borrower_type: extractFromPayload(quote.payload, 'borrower_type'),
              borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
              company_name: extractFromPayload(quote.payload, 'company_name'),
              created_at: quote.created_at,
              updated_at: quote.updated_at,
              
              // Result index to identify multiple results for same quote
              result_number: index + 1,
              total_results: results.length,
              
              // Result fields
              fee_column: result.fee_column,
              product_name: result.product_name,
              gross_loan: result.gross_loan,
              net_loan: result.net_loan,
              ltv_percentage: result.ltv_percentage,
              net_ltv: result.net_ltv,
              property_value: result.property_value,
              icr: result.icr,
              initial_rate: result.initial_rate,
              pay_rate: result.pay_rate,
              revert_rate: result.revert_rate,
              revert_rate_dd: result.revert_rate_dd,
              full_rate: result.full_rate,
              aprc: result.aprc,
              product_fee_percent: result.product_fee_percent,
              product_fee_pounds: result.product_fee_pounds,
              admin_fee: result.admin_fee,
              broker_client_fee: result.broker_client_fee,
              broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent,
              broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds,
              commitment_fee_pounds: result.commitment_fee_pounds,
              exit_fee: result.exit_fee,
              monthly_interest_cost: result.monthly_interest_cost,
              rolled_months: result.rolled_months,
              rolled_months_interest: result.rolled_months_interest,
              deferred_interest_percent: result.deferred_interest_percent,
              deferred_interest_pounds: result.deferred_interest_pounds,
              serviced_interest: result.serviced_interest,
              direct_debit: result.direct_debit,
              erc: result.erc,
              rent: result.rent,
              top_slicing: result.top_slicing,
              nbp: result.nbp,
              total_cost_to_borrower: result.total_cost_to_borrower,
              total_loan_term: result.total_loan_term,
            });
          });
        } else {
          // Quote without results - still include it
          allData.push({
            reference_number: quote.reference_number,
            quote_name: quote.name,
            calculator_type: quote.calculator_type,
            status: quote.status,
            loan_amount: quote.loan_amount,
            ltv: quote.ltv,
            borrower_type: extractFromPayload(quote.payload, 'borrower_type'),
            borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
            company_name: extractFromPayload(quote.payload, 'company_name'),
            created_at: quote.created_at,
            updated_at: quote.updated_at,
            result_number: 0,
            total_results: 0,
          });
        }
      }
    }

    // Fetch Bridge quotes with results
    if (shouldQueryBridge) {
      const { data: bridgeQuotes, error: bridgeError } = await supabase
        .from('bridge_quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (bridgeError) {
        console.error('Error fetching Bridge quotes:', bridgeError);
        throw bridgeError;
      }

      // Fetch results for each Bridge quote
      for (const quote of bridgeQuotes || []) {
        const { data: results, error: resultsError } = await supabase
          .from('bridge_quote_results')
          .select('*')
          .eq('quote_id', quote.id);

        if (resultsError) {
          console.error(`Error fetching results for bridge quote ${quote.id}:`, resultsError);
        }

        if (results && results.length > 0) {
          // Create one row per result
          results.forEach((result, index) => {
            allData.push({
              // Quote fields
              reference_number: quote.reference_number,
              quote_name: quote.name,
              calculator_type: quote.calculator_type,
              status: quote.status,
              loan_amount: quote.loan_amount,
              ltv: quote.ltv,
              borrower_type: extractFromPayload(quote.payload, 'borrower_type'),
              borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
              company_name: extractFromPayload(quote.payload, 'company_name'),
              created_at: quote.created_at,
              updated_at: quote.updated_at,
              
              // Result index to identify multiple results for same quote
              result_number: index + 1,
              total_results: results.length,
              
              // Result fields (Bridge has some additional fields)
              fee_column: result.fee_column,
              product_name: result.product_name,
              gross_loan: result.gross_loan,
              net_loan: result.net_loan,
              ltv_percentage: result.ltv_percentage,
              net_ltv: result.net_ltv,
              property_value: result.property_value,
              icr: result.icr,
              initial_rate: result.initial_rate,
              pay_rate: result.pay_rate,
              revert_rate: result.revert_rate,
              revert_rate_dd: result.revert_rate_dd,
              full_rate: result.full_rate,
              aprc: result.aprc,
              product_fee_percent: result.product_fee_percent,
              product_fee_pounds: result.product_fee_pounds,
              admin_fee: result.admin_fee,
              broker_client_fee: result.broker_client_fee,
              broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent,
              broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds,
              commitment_fee_pounds: result.commitment_fee_pounds,
              exit_fee: result.exit_fee,
              monthly_interest_cost: result.monthly_interest_cost,
              rolled_months: result.rolled_months,
              rolled_months_interest: result.rolled_months_interest,
              deferred_interest_percent: result.deferred_interest_percent,
              deferred_interest_pounds: result.deferred_interest_pounds,
              deferred_rate: result.deferred_rate, // Bridge specific
              serviced_interest: result.serviced_interest,
              direct_debit: result.direct_debit,
              erc: result.erc,
              erc_fusion_only: result.erc_fusion_only, // Bridge specific
              rent: result.rent,
              top_slicing: result.top_slicing,
              nbp: result.nbp,
              total_cost_to_borrower: result.total_cost_to_borrower,
              total_loan_term: result.total_loan_term,
            });
          });
        } else {
          // Quote without results - still include it
          allData.push({
            reference_number: quote.reference_number,
            quote_name: quote.name,
            calculator_type: quote.calculator_type,
            status: quote.status,
            loan_amount: quote.loan_amount,
            ltv: quote.ltv,
            borrower_type: extractFromPayload(quote.payload, 'borrower_type'),
            borrower_name: extractFromPayload(quote.payload, 'borrower_name'),
            company_name: extractFromPayload(quote.payload, 'company_name'),
            created_at: quote.created_at,
            updated_at: quote.updated_at,
            result_number: 0,
            total_results: 0,
          });
        }
      }
    }

    console.log(`Export complete: ${allData.length} rows`);
    return res.status(200).json({ data: allData });
  } catch (err) {
    console.error('Error exporting quotes:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Helper function to extract values from JSONB payload
function extractFromPayload(payload, key) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return parsed[key] || null;
    } catch {
      return null;
    }
  }
  return payload[key] || null;
}

export default router;
