/**
 * Helper functions for BTL DIP PDF generation
 * Implements all conditional logic and formatting from Excel DIP sheet
 * 
 * Conditional Scenarios:
 * 1. Product Type: Fixed vs Tracker - different term text
 * 2. Revert Rate: BBR-based vs MVR-based - different rate description
 * 3. Property Type: Residential BTL / Commercial / Semi-Commercial - different declarations
 * 4. Rolled Months: Show only if > 0
 * 5. Deferred Interest: Show only if deferred rate > 0
 * 6. Broker Fees: Show only if broker client type
 * 7. Number of Applicants: 1-4 signature blocks
 * 8. Title Insurance: Conditional note about valuation
 */

import { parseNumber } from '../../utils/calculator/numberFormatting';

// ============================================================================
// BORROWER & PROPERTY HELPERS
// ============================================================================

/**
 * Get borrower name from quote or broker settings
 */
export const getBorrowerName = (quote, brokerSettings) => {
  if (quote.quote_borrower_name) return quote.quote_borrower_name;
  
  if (brokerSettings?.clientFirstName && brokerSettings?.clientLastName) {
    return `${brokerSettings.clientFirstName} ${brokerSettings.clientLastName}`;
  }
  if (brokerSettings?.clientFirstName) return brokerSettings.clientFirstName;
  if (brokerSettings?.clientLastName) return brokerSettings.clientLastName;
  
  return 'Borrower Name';
};

/**
 * Get formatted security property address from dipData
 */
export const getSecurityAddress = (dipData) => {
  if (!dipData?.security_properties || !Array.isArray(dipData.security_properties)) {
    return 'Property Address';
  }
  
  const properties = dipData.security_properties;
  if (properties.length === 0) return 'Property Address';
  
  // Format first property (or all if multiple)
  return properties.map((prop, idx) => {
    const parts = [];
    if (prop.street) parts.push(prop.street);
    if (prop.city) parts.push(prop.city);
    if (prop.postcode) parts.push(prop.postcode);
    const address = parts.join(', ') || 'Address not provided';
    return properties.length > 1 ? `Property ${idx + 1}: ${address}` : address;
  }).join('\n');
};

/**
 * Get property type for conditional declarations
 * Returns: 'Residential', 'Commercial', 'Semi-Commercial'
 */
export const getPropertyType = (quote, dipData) => {
  // Check dipData first (from modal selection)
  if (dipData?.commercial_or_main_residence) {
    if (dipData.commercial_or_main_residence === 'Commercial') return 'Commercial';
    if (dipData.commercial_or_main_residence === 'Main Residence') return 'Residential BTL';
  }
  
  // Check quote property type
  const propType = (quote.property_type || '').toLowerCase();
  if (propType.includes('commercial') && propType.includes('semi')) return 'Semi-Commercial';
  if (propType.includes('commercial')) return 'Commercial';
  
  return 'Residential BTL';
};

// ============================================================================
// LOAN AMOUNT HELPERS
// ============================================================================

export const getGrossLoan = (quote) => parseNumber(quote.gross_loan) || parseNumber(quote.specific_gross_loan) || 0;
export const getNetLoan = (quote) => parseNumber(quote.net_loan) || parseNumber(quote.specific_net_loan) || 0;
export const getPropertyValue = (quote) => parseNumber(quote.property_value) || 0;

// ============================================================================
// PRODUCT FEE HELPERS
// ============================================================================

export const getProductFeePercent = (quote) => {
  const pct = parseNumber(quote.product_fee_percent) || parseNumber(quote.arrangement_fee_percent);
  return pct || 0;
};

export const getProductFeeAmount = (quote) => {
  const amt = parseNumber(quote.product_fee_amount) || parseNumber(quote.arrangement_fee);
  if (amt) return amt;
  
  // Calculate from gross loan and percentage
  const gross = getGrossLoan(quote);
  const pct = getProductFeePercent(quote);
  return gross * (pct / 100);
};

// ============================================================================
// RATE HELPERS - CONDITIONAL LOGIC FOR FIXED vs TRACKER
// ============================================================================

/**
 * Check if product is tracker-based
 */
export const isTrackerProduct = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const rateType = (quote.rate_type || '').toLowerCase();
  return productType.includes('tracker') || rateType.includes('tracker');
};

/**
 * Check if product is fixed-rate
 */
export const isFixedProduct = (quote) => {
  const productType = (quote.product_type || '').toLowerCase();
  const rateType = (quote.rate_type || '').toLowerCase();
  return productType.includes('fix') || rateType.includes('fix');
};

/**
 * Get initial term in years
 */
export const getInitialTerm = (quote) => {
  const months = parseNumber(quote.initial_term) || parseNumber(quote.term_months) || 24;
  return months / 12;
};

/**
 * Get full loan term in years
 */
export const getFullTerm = (quote) => {
  const months = parseNumber(quote.full_term) || parseNumber(quote.total_loan_term) || 120;
  // If stored as months, convert to years
  return months > 50 ? months / 12 : months;
};

/**
 * Get annual interest rate
 */
export const getAnnualRate = (quote) => {
  return parseNumber(quote.actual_rate) || parseNumber(quote.annual_rate) || 0;
};

/**
 * Get revert rate
 */
export const getRevertRate = (quote) => {
  return parseNumber(quote.revert_rate) || 8.59; // Default MVR
};

/**
 * Check if revert rate is MVR-based (vs BBR-based)
 */
export const isMVRRevert = (quote) => {
  const revertText = (quote.revert_rate_text || quote.revert_index || '').toLowerCase();
  return revertText.includes('mvr') || revertText.includes('variable');
};

/**
 * Get APRC
 */
export const getAPRC = (quote) => {
  const aprc = parseNumber(quote.aprc);
  return aprc ? aprc.toFixed(2) : '0.00';
};

/**
 * Get monthly interest cost (direct debit amount)
 */
export const getMonthlyInterestCost = (quote) => {
  return parseNumber(quote.direct_debit) || parseNumber(quote.monthly_payment) || 0;
};

// ============================================================================
// ROLLED & DEFERRED INTEREST - CONDITIONAL SHOW/HIDE
// ============================================================================

/**
 * Check if rolled months > 0 (to show/hide section)
 */
export const hasRolledMonths = (quote) => {
  const rolled = parseNumber(quote.rolled_months) || 0;
  return rolled > 0;
};

export const getRolledMonths = (quote) => parseNumber(quote.rolled_months) || 0;

export const getRolledInterestAmount = (quote) => {
  return parseNumber(quote.rolled_interest_amount) || parseNumber(quote.rolled_interest) || 0;
};

/**
 * Check if deferred interest is used (to show/hide section)
 */
export const hasDeferredInterest = (quote) => {
  const deferred = parseNumber(quote.deferred_rate) || parseNumber(quote.deferred_cap_pct) || 0;
  return deferred > 0;
};

export const getDeferredRate = (quote) => {
  return parseNumber(quote.deferred_rate) || parseNumber(quote.deferred_cap_pct) || 0;
};

export const getDeferredAmount = (quote) => {
  return parseNumber(quote.deferred_interest_amount) || parseNumber(quote.deferred_interest) || 0;
};

/**
 * Get pay rate (full rate minus deferred)
 */
export const getPayRate = (quote) => {
  const fullRate = getAnnualRate(quote);
  const deferredRate = getDeferredRate(quote);
  return (fullRate - deferredRate).toFixed(2);
};

// ============================================================================
// FEES HELPERS
// ============================================================================

export const getAdminFee = (quote, dipData) => {
  // From dipData input or quote, default £250 per property
  const fee = parseNumber(dipData?.admin_fee) || parseNumber(quote.admin_fee);
  return fee || 250;
};

export const getValuationFee = (quote, dipData) => {
  const fee = dipData?.valuation_fee || quote.valuation_fee;
  return fee || 'TBC by the Underwriter';
};

export const getLegalFees = (quote, dipData) => {
  const fee = dipData?.lender_legal_fee || quote.lender_legal_fee;
  return fee || 'TBC by the Underwriter';
};

// ============================================================================
// BROKER FEES - CONDITIONAL SHOW/HIDE
// ============================================================================

/**
 * Check if broker fees should be shown
 */
export const hasBrokerFees = (brokerSettings) => {
  return brokerSettings?.clientType === 'Broker';
};

export const getBrokerCommission = (quote, brokerSettings) => {
  const procFee = parseNumber(quote.proc_fee_value) || parseNumber(quote.broker_commission);
  if (procFee) return procFee;
  
  // Calculate from percentage
  const gross = getGrossLoan(quote);
  const pct = parseNumber(brokerSettings?.brokerCommissionPercent) || 0;
  return gross * (pct / 100);
};

export const getBrokerClientFee = (quote, brokerSettings) => {
  const fee = parseNumber(quote.broker_client_fee) || parseNumber(quote.broker_fee_value);
  if (fee) return fee;
  
  // From broker settings
  if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
    const amt = parseNumber(brokerSettings.additionalFeeAmount);
    if (brokerSettings.feeCalculationType === 'percentage') {
      return getGrossLoan(quote) * (amt / 100);
    }
    return amt;
  }
  
  return 0;
};

// ============================================================================
// ERC & OVERPAYMENTS
// ============================================================================

/**
 * Get ERC text from rate record
 * Format: "3% of loan balance in yr1, 2.5% of loan balance in yr2. No charge thereafter."
 */
export const getERCText = (quote) => {
  const ercText = quote.erc_text;
  if (ercText) return ercText;
  
  // Build from individual ERC values
  const erc1 = parseNumber(quote.erc_1);
  const erc2 = parseNumber(quote.erc_2);
  const erc3 = parseNumber(quote.erc_3);
  
  const parts = [];
  if (erc1) parts.push(`${erc1}% of loan balance in yr1`);
  if (erc2) parts.push(`${erc2}% of loan balance in yr2`);
  if (erc3) parts.push(`${erc3}% of loan balance in yr3`);
  
  if (parts.length === 0) return 'No early repayment charge applies.';
  
  return parts.join(', ') + '. No charge thereafter.';
};

/**
 * Get overpayment terms text
 */
export const getOverpaymentText = (quote, dipData) => {
  const pct = parseNumber(dipData?.overpayments_percent) || 10;
  const isTracker = isTrackerProduct(quote);
  const periodText = isTracker ? 'Initial Tracker Rate Period' : 'Initial Fixed Rate Period';
  
  return `Permitted up to ${pct}% of the capital amount outstanding per annum during the ${periodText} without incurring an ERC. Any prepayments over ${pct}% will be subject to the Early Repayment Charge stated above. No limit after the ${periodText} has expired.`;
};

// ============================================================================
// DIRECT DEBIT
// ============================================================================

export const getDirectDebit = (quote) => {
  return parseNumber(quote.direct_debit) || parseNumber(quote.monthly_payment) || 0;
};

export const getDDStartMonth = (quote) => {
  const rolled = getRolledMonths(quote);
  return rolled > 0 ? rolled + 1 : 1;
};

// ============================================================================
// ICR
// ============================================================================

export const getICR = (quote) => {
  const icr = parseNumber(quote.icr);
  // ICR is stored as ratio (e.g., 1.45) not percentage
  return icr || null;
};

// ============================================================================
// APPLICANTS - CONDITIONAL SIGNATURE BLOCKS
// ============================================================================

/**
 * Get number of applicants (1-4) for signature blocks
 */
export const getNumberOfApplicants = (dipData) => {
  const num = parseNumber(dipData?.number_of_applicants);
  return Math.min(Math.max(num || 1, 1), 4); // Clamp between 1-4
};

// ============================================================================
// TITLE INSURANCE
// ============================================================================

export const hasTitleInsurance = (quote) => {
  const ti = (quote.title_insurance || '').toLowerCase();
  return ti === 'yes' || ti === 'true' || ti === '1';
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency with £ symbol and commas
 */
export const formatCurrency = (value) => {
  const num = parseNumber(value);
  if (!num && num !== 0) return '£0.00';
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date in long format: "Friday, November 28, 2025"
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format date short: "28 November 2025"
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  const num = parseNumber(value);
  return `${(num || 0).toFixed(decimals)}%`;
};
