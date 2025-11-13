/**
 * Loan calculation utilities for Bridging calculator
 * Pure functions that compute LTV and loan amounts
 */

import { parseNumber } from './numberFormatting';

/**
 * Compute Loan-to-Value (LTV) percentage
 * Formula: ((Loan Amount + First Charge) / Property Value) × 100
 * @param {*} propertyValue - Current property value
 * @param {*} specificNetLoan - Specific net loan amount (priority)
 * @param {*} grossLoan - Gross loan amount (fallback)
 * @param {*} firstChargeValue - First charge value to include in LTV calculation
 * @returns {number} LTV percentage or NaN if invalid inputs
 */
export function computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue) {
  const pv = parseNumber(propertyValue);
  if (!Number.isFinite(pv) || pv <= 0) return NaN;
  
  const loanAmount = parseNumber(specificNetLoan) || parseNumber(grossLoan);
  const firstCharge = parseNumber(firstChargeValue) || 0;
  
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return NaN;
  
  // LTV = (Gross Loan + First Charge Value) / Property Value × 100
  return ((loanAmount + firstCharge) / pv) * 100;
}

/**
 * Compute actual loan size from specific net loan or gross loan
 * Priority: specificNetLoan > grossLoan
 * @param {*} specificNetLoan - Specific net loan amount (priority)
 * @param {*} grossLoan - Gross loan amount (fallback)
 * @returns {number} Loan amount or NaN if invalid
 */
export function computeLoanSize(specificNetLoan, grossLoan) {
  const loanAmount = parseNumber(specificNetLoan) || parseNumber(grossLoan);
  return Number.isFinite(loanAmount) ? loanAmount : NaN;
}
