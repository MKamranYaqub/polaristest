/**
 * Helper functions for Bridging Quote PDF generation
 * Extracts and formats data from quote and results
 * Handles three product columns: Fusion, Fixed Bridge, Variable Bridge
 */

import { getMarketRates } from '../../../config/constants';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (value) => {
  const num = parseNumber(value);
  return `£${Math.round(num).toLocaleString('en-GB')}`;
};

export const formatCurrencyWithPence = (value) => {
  const num = parseNumber(value);
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercentage = (value, decimals = 2) => {
  const num = parseNumber(value);
  return `${num.toFixed(decimals)}%`;
};

// ============================================================================
// QUOTE SUMMARY HELPERS
// ============================================================================

export const getQuoteType = (quote) => {
  return quote.product_scope || 'Bridging Finance';
};

export const getRequestedAmount = (quote) => {
  // Bridging typically uses gross loan or specific loan amount
  const loanType = quote.loan_calculation_requested || quote.loan_type;
  
  if (loanType === 'Maximum gross loan' || loanType === 'Max gross loan') {
    return 'Maximum gross loan';
  } else if (quote.specific_gross_loan) {
    return formatCurrency(quote.specific_gross_loan);
  } else if (quote.specific_net_loan) {
    return formatCurrency(quote.specific_net_loan);
  }
  
  return 'Maximum gross loan';
};

export const getPropertyValue = (quote) => {
  return formatCurrency(quote.property_value);
};

export const getMonthlyRent = (quote) => {
  const rent = parseNumber(quote.monthly_rent) ||
               parseNumber(quote.rent) ||
               0;
  if (rent === 0) return 'N/A';
  return formatCurrency(rent);
};

export const getBridgingTerm = (quote) => {
  const term = parseNumber(quote.bridging_loan_term) || 
               parseNumber(quote.term_months) ||
               12;
  return `${term} ${term === 1 ? 'month' : 'months'}`;
};

export const getChargeType = (quote) => {
  const chargeType = quote.charge_type || '';
  if (chargeType.includes('1st') || chargeType.includes('First')) return '1st Charge';
  if (chargeType.includes('2nd') || chargeType.includes('Second')) return '2nd Charge';
  return '1st Charge';
};

export const getVersion = (quote) => {
  const version = quote.quote_version || quote.version_number || quote.version || 1;
  return `Version ${version}`;
};

// ============================================================================
// PRODUCT COLUMN HELPERS
// ============================================================================

/**
 * Get available product types from results
 * Returns array of unique product types: ['Fusion', 'Fixed Bridge', 'Variable Bridge']
 */
export const getProductTypes = (results) => {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return [];
  }
  
  const productTypes = new Set();
  
  results.forEach(result => {
    // Check multiple fields for product type information
    const productType = (
      result.product_name || 
      result.product_type || 
      result.rate_type || 
      result.type || 
      result.product || 
      ''
    ).toLowerCase();
    
    if (productType.includes('fusion')) {
      productTypes.add('Fusion');
    } else if (productType.includes('fixed')) {
      productTypes.add('Fixed Bridge');
    } else if (productType.includes('variable')) {
      productTypes.add('Variable Bridge');
    }
  });
  
  // Return in specific order: Fusion, Fixed Bridge, Variable Bridge
  const orderedTypes = [];
  if (productTypes.has('Fusion')) orderedTypes.push('Fusion');
  if (productTypes.has('Fixed Bridge')) orderedTypes.push('Fixed Bridge');
  if (productTypes.has('Variable Bridge')) orderedTypes.push('Variable Bridge');
  
  return orderedTypes;
};

/**
 * Filter results by product type
 */
export const getResultsByProductType = (results, productType) => {
  if (!results || !Array.isArray(results)) return [];
  
  return results.filter(result => {
    // Check multiple fields for product type information
    const resultType = (
      result.product_name || 
      result.product_type || 
      result.rate_type || 
      result.type || 
      result.product || 
      ''
    ).toLowerCase();
    const targetType = productType.toLowerCase();
    
    if (targetType.includes('fusion')) {
      return resultType.includes('fusion');
    } else if (targetType.includes('fixed')) {
      return resultType.includes('fixed');
    } else if (targetType.includes('variable')) {
      return resultType.includes('variable');
    }
    
    return false;
  });
};

/**
 * Get the best result for a product type (highest LTV)
 * Sorts by LTV descending and returns the highest, which matches the user's actual calculation
 */
export const getBestResultForProductType = (results, productType) => {
  const filtered = getResultsByProductType(results, productType);
  if (filtered.length === 0) return null;
  
  // Sort by LTV descending and return the highest (user's actual calculation)
  const sorted = [...filtered].sort((a, b) => {
    const ltvA = parseNumber(a.gross_ltv || a.ltv_percentage || a.ltv) || 0;
    const ltvB = parseNumber(b.gross_ltv || b.ltv_percentage || b.ltv) || 0;
    return ltvB - ltvA; // Descending order
  });
  
  return sorted[0];
};

// ============================================================================
// RESULT FIELD EXTRACTORS
// ============================================================================

export const getGrossLoan = (result) => {
  return parseNumber(result?.gross_loan) || 0;
};

export const getNetLoan = (result) => {
  return parseNumber(result?.net_loan) || 0;
};

export const getLTV = (result) => {
  // Database fields: gross_ltv, net_ltv, ltv_percentage, ltv
  const ltv = parseNumber(result?.gross_ltv) ||
              parseNumber(result?.ltv_percentage) ||
              parseNumber(result?.net_ltv) ||
              parseNumber(result?.ltv) ||
              0;
  return ltv.toFixed(2);
};

export const getInterestRate = (result) => {
  // Determine product type to decide which rate to show
  const productName = (result?.product_name || result?.product_kind || result?.product || '').toLowerCase();
  const isFusion = productName.includes('fusion');
  
  if (isFusion) {
    // Fusion: Show annual rate (margin + BBR combined = initial_rate)
    const rate = parseNumber(result?.initial_rate) ||
                 parseNumber(result?.pay_rate) ||
                 parseNumber(result?.annual_rate) ||
                 0;
    return rate.toFixed(2);
  } else {
    // Bridge products: Show monthly rate (pay_rate = monthly margin/coupon)
    const rate = parseNumber(result?.pay_rate) ||
                 parseNumber(result?.margin_monthly) ||
                 parseNumber(result?.rate_percent) ||
                 0;
    return rate.toFixed(2);
  }
};

export const getMonthlyInterest = (result) => {
  return parseNumber(result?.monthly_interest_cost) || 
         parseNumber(result?.monthly_interest) ||
         0;
};

export const getProductFeePercent = (result) => {
  const pct = parseNumber(result?.product_fee_percent) ||
              parseNumber(result?.arrangement_fee_percent) ||
              parseNumber(result?.fee_percent) ||
              0;
  return pct.toFixed(2);
};

export const getProductFeeAmount = (result) => {
  // Database fields: product_fee_pounds, arrangement_fee_gbp
  return parseNumber(result?.product_fee_pounds) ||
         parseNumber(result?.arrangement_fee_gbp) ||
         parseNumber(result?.arrangement_fee) ||
         0;
};

export const getRolledMonths = (result) => {
  return parseNumber(result?.rolled_months) || 
         parseNumber(result?.months_rolled) ||
         0;
};

export const getRolledInterest = (result) => {
  // Database field: rolled_months_interest
  return parseNumber(result?.rolled_months_interest) ||
         parseNumber(result?.rolled_interest) ||
         0;
};

export const getRetention = (result) => {
  return parseNumber(result?.retention_amount) ||
         parseNumber(result?.retention) ||
         0;
};

export const getAdminFee = (result) => {
  return parseNumber(result?.admin_fee) || 995;
};

export const getCommitmentFee = (result) => {
  return parseNumber(result?.commitment_fee_pounds) || 0;
};

export const getValuationFee = (result) => {
  const fee = result?.valuation_fee;
  return fee || 'TBC';
};

export const getLegalFees = (result) => {
  const fees = result?.lender_legal_fee || 
               result?.legal_fees;
  return fees || 'TBC';
};

export const getExitFee = (result) => {
  return parseNumber(result?.exit_fee) || 
         parseNumber(result?.completion_fee) ||
         0;
};

export const getTitleInsuranceCost = (result) => {
  return parseNumber(result?.title_insurance_cost) || 0;
};

export const getTerm = (result) => {
  const term = parseNumber(result?.bridging_loan_term) ||
               parseNumber(result?.term_months) ||
               12;
  return term;
};

export const getMinimumTerm = (result) => {
  const productType = (result?.product_type || '').toLowerCase();
  
  // Fusion has no minimum term
  if (productType.includes('fusion')) return 0;
  
  // Fixed and Variable have minimum terms
  return parseNumber(result?.minimum_term) || 
         parseNumber(result?.min_term) ||
         3;
};

// ============================================================================
// NEW RATE/INTEREST HELPERS FOR PDF
// ============================================================================

/**
 * Get the product name from result
 */
export const getProductName = (result) => {
  return result?.product_name || result?.product || result?.rate_name || 'N/A';
};

/**
 * Get Initial Rate with BBR suffix and (pa)/(pm) indicator
 * Uses the same logic as the calculator display:
 * - Fusion: margin (annual %) + BBR (pa) - e.g., "4.79% + BBR (pa)"
 * - Variable Bridge: margin (monthly %) + BBR (pm) - e.g., "0.65% + BBR (pm)"
 * - Fixed Bridge: coupon (monthly %) (pm) - e.g., "1.00% (pm)"
 * 
 * For Fusion: initial_rate = margin + BBR, so margin = initial_rate - BBR
 * Uses getMarketRates() for BBR - same source as calculator
 */
export const getInitialRateFormatted = (result) => {
  if (!result) return 'N/A';
  
  const productName = (result?.product_name || result?.product_kind || result?.product || '').toLowerCase();
  const isFusionProduct = productName.includes('fusion');
  const isVariable = productName.includes('variable');
  
  // Get BBR from constants - same source as calculator uses
  // getMarketRates().STANDARD_BBR is decimal (0.04 = 4%), convert to percentage
  const bbrAnnualPct = (getMarketRates()?.STANDARD_BBR || 0.04) * 100; // e.g., 4.00
  
  // Get the initial_rate (full rate including BBR for Fusion/Variable)
  const initialRate = parseNumber(result?.initial_rate);
  
  if (initialRate != null && Number.isFinite(initialRate) && initialRate > 0) {
    if (isFusionProduct) {
      // Fusion: initial_rate = margin + BBR (annual)
      // margin = initial_rate - BBR_annual
      // This is exactly what the calculator does: initialRatePct - bbrPercent
      const marginAnnual = initialRate - bbrAnnualPct;
      const rounded = Math.round(marginAnnual * 100) / 100;
      return `${rounded.toFixed(2)}% + BBR (pa)`;
    } else if (isVariable) {
      // Variable Bridge: initial_rate = (margin + BBR) * 12 annually
      // Monthly margin = (initial_rate - BBR_annual) / 12
      const marginMonthly = (initialRate - bbrAnnualPct) / 12;
      const rounded = Math.round(marginMonthly * 100) / 100;
      return `${rounded.toFixed(2)}% + BBR (pm)`;
    } else {
      // Fixed Bridge: initial_rate = coupon * 12 (no BBR)
      // Monthly coupon = initial_rate / 12
      const couponMonthly = initialRate / 12;
      const rounded = Math.round(couponMonthly * 100) / 100;
      return `${rounded.toFixed(2)}% (pm)`;
    }
  }
  
  // Fallback if initial_rate not available
  const marginMonthly = parseNumber(result?.margin_monthly) || parseNumber(result?.marginMonthly) || 0;
  
  if (isFusionProduct) {
    const annualMargin = marginMonthly * 12;
    const rounded = Math.round(annualMargin * 100) / 100;
    return `${rounded.toFixed(2)}% + BBR (pa)`;
  } else if (isVariable) {
    const rounded = Math.round(marginMonthly * 100) / 100;
    return `${rounded.toFixed(2)}% + BBR (pm)`;
  } else {
    const rounded = Math.round(marginMonthly * 100) / 100;
    return `${rounded.toFixed(2)}% (pm)`;
  }
};

/**
 * Get Pay Rate with BBR suffix and (pa)/(pm) indicator
 * Fusion: "2.79% + BBR (pa)" (margin - deferred rate)
 * Variable Bridge: "0.65% + BBR (pm)" (same as initial)
 * Fixed Bridge: "1.00% (pm)" (same as initial)
 */
export const getPayRateFormatted = (result) => {
  const productName = (result?.product_name || result?.product_kind || result?.product || '').toLowerCase();
  const isFusionProduct = productName.includes('fusion');
  const isVariable = productName.includes('variable');
  
  if (isFusionProduct) {
    // Fusion: Show pay rate (margin - deferred) + BBR (pa)
    const payRate = parseNumber(result?.pay_rate_monthly) || // This is actually annual for fusion
                    parseNumber(result?.payRateMonthly) ||
                    parseNumber(result?.pay_rate) ||
                    0;
    return `${payRate.toFixed(2)}% + BBR (pa)`;
  } else if (isVariable) {
    // Variable Bridge: Same as initial rate
    const rate = parseNumber(result?.pay_rate) ||
                 parseNumber(result?.margin_monthly) ||
                 parseNumber(result?.fullCouponRateMonthly) ||
                 0;
    return `${rate.toFixed(2)}% + BBR (pm)`;
  } else {
    // Fixed Bridge: Same as initial rate
    const rate = parseNumber(result?.pay_rate) ||
                 parseNumber(result?.margin_monthly) ||
                 parseNumber(result?.fullCouponRateMonthly) ||
                 0;
    return `${rate.toFixed(2)}% (pm)`;
  }
};

/**
 * Get Gross Loan formatted with LTV: "£750,000 @ 75% LTV"
 */
export const getGrossLoanWithLTV = (result) => {
  const gross = parseNumber(result?.gross_loan) || parseNumber(result?.gross) || 0;
  const ltv = parseNumber(result?.gross_ltv) || parseNumber(result?.grossLTV) || parseNumber(result?.ltv) || 0;
  return `${formatCurrency(gross)} @ ${ltv.toFixed(0)}% LTV`;
};

/**
 * Get Net Loan formatted with LTV: "£680,475 @ 68% LTV"
 */
export const getNetLoanWithLTV = (result) => {
  const net = parseNumber(result?.net_loan) || parseNumber(result?.netLoanGBP) || 0;
  const netLtv = parseNumber(result?.net_ltv) || parseNumber(result?.netLTV) || 0;
  return `${formatCurrency(net)} @ ${netLtv.toFixed(0)}% LTV`;
};

/**
 * Get Rolled Months Interest formatted: "£24,525 (6 months)"
 */
export const getRolledInterestFormatted = (result) => {
  const rolledInterest = parseNumber(result?.rolled_months_interest) || 
                         parseNumber(result?.rolledInterestGBP) || 
                         parseNumber(result?.rolled_interest) || 
                         0;
  const rolledMonths = parseNumber(result?.rolled_months) || 
                       parseNumber(result?.rolledMonths) || 
                       0;
  if (rolledMonths === 0) return '£0 (0 months)';
  return `${formatCurrency(rolledInterest)} (${rolledMonths} ${rolledMonths === 1 ? 'month' : 'months'})`;
};

/**
 * Get Monthly Payment formatted: "£4,088 from month 7"
 */
export const getMonthlyPaymentFormatted = (result) => {
  const payment = parseNumber(result?.monthly_payment) || 
                  parseNumber(result?.monthlyPaymentGBP) || 
                  parseNumber(result?.monthly_interest_cost) ||
                  0;
  const rolledMonths = parseNumber(result?.rolled_months) || 
                       parseNumber(result?.rolledMonths) || 
                       0;
  const startMonth = rolledMonths + 1;
  return `${formatCurrencyWithPence(payment)} from month ${startMonth}`;
};

/**
 * Get Deferred Interest formatted: "£30,000 (2.00%)" for Fusion, "N/A" for Bridge
 */
export const getDeferredInterestFormatted = (result) => {
  const productName = (result?.product_name || result?.product_kind || result?.product || '').toLowerCase();
  const isFusionProduct = productName.includes('fusion');
  
  if (!isFusionProduct) {
    return 'N/A';
  }
  
  const deferredAmount = parseNumber(result?.deferred_gbp) || 
                         parseNumber(result?.deferredGBP) || 
                         parseNumber(result?.deferred_interest) ||
                         0;
  const deferredRate = parseNumber(result?.deferred_interest_rate) || 
                       parseNumber(result?.deferredInterestRate) ||
                       0;
  
  if (deferredAmount === 0 && deferredRate === 0) return '£0 (0.00%)';
  return `${formatCurrency(deferredAmount)} (${deferredRate.toFixed(2)}%)`;
};

/**
 * Get Min Interest Period formatted
 * Fusion: "6 Months" (from rate record)
 * Bridge: "3 Months"
 */
export const getMinInterestPeriod = (result) => {
  const minPeriod = parseNumber(result?.min_interest_period) || 
                    parseNumber(result?.minimum_term) ||
                    parseNumber(result?.minInterestPeriod) ||
                    3;
  return `${minPeriod} ${minPeriod === 1 ? 'Month' : 'Months'}`;
};

/**
 * Get ERC/Exit Fee formatted
 * Fusion: Complex text with ERC percentages
 * Bridge: Exit fee percentage
 */
export const getERCExitFeeFormatted = (result) => {
  const productName = (result?.product_name || result?.product_kind || result?.product || '').toLowerCase();
  const isFusionProduct = productName.includes('fusion');
  
  if (isFusionProduct) {
    // Fusion: Show ERC text from rate record
    const erc1 = parseNumber(result?.erc_1) || parseNumber(result?.erc1Percent) || 3;
    const erc2 = parseNumber(result?.erc_2) || parseNumber(result?.erc2Percent) || 1.5;
    const rolledMonths = parseNumber(result?.rolled_months) || parseNumber(result?.rolledMonths) || 6;
    const repaymentStartMonth = rolledMonths + 1;
    
    // Format: "3% in Yr1, 1.5% in Yr2 (25% capital repayment allowed from month X, no ERC after 21 months)"
    return `${erc1}% in Yr1, ${erc2}% in Yr2`;
  } else {
    // Bridge: Show exit fee percentage
    const exitFeePercent = parseNumber(result?.exit_fee_percent) || 
                           parseNumber(result?.exitFeePercent) ||
                           1;
    return `${exitFeePercent.toFixed(2)}%`;
  }
};

/**
 * Get Proc Fee (Broker Commission) formatted
 */
export const getProcFeeFormatted = (result) => {
  const procFee = parseNumber(result?.proc_fee) || 
                  parseNumber(result?.procFeeGBP) || 
                  parseNumber(result?.broker_fee) ||
                  0;
  return formatCurrency(procFee);
};

/**
 * Get Broker Client Fee formatted
 */
export const getBrokerClientFeeFormatted = (result) => {
  const fee = parseNumber(result?.broker_client_fee) || 
              parseNumber(result?.brokerClientFee) ||
              0;
  return formatCurrency(fee);
};

// ============================================================================
// CONDITIONAL CHECKS
// ============================================================================

export const hasRolledInterest = (result) => {
  return getRolledMonths(result) > 0;
};

export const hasRetention = (result) => {
  return getRetention(result) > 0;
};

export const hasTitleInsurance = (result) => {
  return getTitleInsuranceCost(result) > 0;
};

export const isFusion = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('fusion');
};

export const isFixedBridge = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('fixed') && !productType.includes('fusion');
};

export const isVariableBridge = (result) => {
  const productType = (result?.product_type || result?.rate_type || result?.type || '').toLowerCase();
  return productType.includes('variable');
};

// ============================================================================
// BROKER INFORMATION HELPERS
// ============================================================================

export const getBrokerCompany = (brokerSettings) => {
  return brokerSettings?.companyName || 
         brokerSettings?.company_name ||
         brokerSettings?.brokerCompanyName ||
         'Broker Company';
};

export const getBrokerName = (brokerSettings) => {
  if (brokerSettings?.brokerFirstName && brokerSettings?.brokerLastName) {
    return `${brokerSettings.brokerFirstName} ${brokerSettings.brokerLastName}`;
  }
  if (brokerSettings?.broker_first_name && brokerSettings?.broker_last_name) {
    return `${brokerSettings.broker_first_name} ${brokerSettings.broker_last_name}`;
  }
  return brokerSettings?.brokerFirstName || 
         brokerSettings?.broker_first_name ||
         'Broker Name';
};

export const getBrokerPhone = (brokerSettings) => {
  return brokerSettings?.brokerPhone || 
         brokerSettings?.broker_phone ||
         brokerSettings?.phone ||
         '';
};

export const getBrokerEmail = (brokerSettings) => {
  return brokerSettings?.brokerEmail || 
         brokerSettings?.broker_email ||
         brokerSettings?.email ||
         '';
};

// ============================================================================
// CLIENT INFORMATION HELPERS
// ============================================================================

export const getClientName = (clientDetails, quote) => {
  // Check clientDetails object first, then quote fields directly
  const firstName = clientDetails?.clientFirstName || clientDetails?.client_first_name || quote?.client_first_name || '';
  const lastName = clientDetails?.clientLastName || clientDetails?.client_last_name || quote?.client_last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

export const getClientCompany = (clientDetails, quote) => {
  return clientDetails?.brokerCompanyName || clientDetails?.broker_company_name || quote?.broker_company_name || 'N/A';
};

export const getClientEmail = (clientDetails, quote) => {
  return clientDetails?.clientEmail || clientDetails?.client_email || quote?.client_email || 'N/A';
};

export const getClientTelephone = (clientDetails, quote) => {
  return clientDetails?.clientContact || clientDetails?.client_contact_number || quote?.client_contact_number || 'N/A';
};

export const getClientRoute = (clientDetails, quote) => {
  // Check client type first
  const clientType = clientDetails?.clientType || quote?.client_type;
  if (clientType && clientType.toLowerCase() === 'direct') {
    return 'Direct Client';
  }
  // For brokers, return the broker route
  return clientDetails?.broker_route || quote?.broker_route || clientDetails?.brokerRoute || 'N/A';
};
