/**
 * Rate selection and filtering utilities
 * Used for matching loan criteria to best available rates
 */

import { parseNumber } from './numberFormatting';

/**
 * Filter rates by lifecycle status and date range
 * Returns only rates that are Active AND currently within their valid date range
 * 
 * Logic (Option B):
 * - rate_status must be 'Active'
 * - start_date must be null OR <= today
 * - end_date must be null OR >= today
 * 
 * @param {Array} rates - Array of rate objects
 * @param {Date} [referenceDate] - Date to check against (defaults to today)
 * @returns {Array} Filtered array of active, in-range rates
 */
export function filterActiveRates(rates, referenceDate = new Date()) {
  if (!rates || !Array.isArray(rates)) return [];
  
  // Normalize reference date to YYYY-MM-DD string for comparison
  const today = referenceDate.toISOString().split('T')[0];
  
  // Debug: log total rates and first rate's lifecycle fields
  if (rates.length > 0) {
    console.log('[filterActiveRates] Total rates:', rates.length, 'Sample rate lifecycle:', {
      rate_status: rates[0].rate_status,
      start_date: rates[0].start_date,
      end_date: rates[0].end_date,
      today
    });
  }
  
  const filtered = rates.filter(rate => {
    // Check status - must be Active (check both possible field names)
    const status = rate.rate_status ?? rate.status ?? 'Active'; // Use nullish coalescing - only default if null/undefined
    if (status !== 'Active') return false;
    
    // Check start_date - must be null OR <= today
    const startDate = rate.start_date;
    if (startDate && startDate > today) return false;
    
    // Check end_date - must be null OR >= today
    const endDate = rate.end_date;
    if (endDate && endDate < today) return false;
    
    return true;
  });
  
  console.log('[filterActiveRates] After filtering:', filtered.length, 'active rates');
  return filtered;
}

/**
 * Check if a single rate is currently active and within date range
 * 
 * @param {Object} rate - Rate object with rate_status, start_date, end_date
 * @param {Date} [referenceDate] - Date to check against (defaults to today)
 * @returns {boolean} True if rate is active and within date range
 */
export function isRateActive(rate, referenceDate = new Date()) {
  if (!rate) return false;
  
  const today = referenceDate.toISOString().split('T')[0];
  
  // Check status
  const status = rate.rate_status || rate.status || 'Active';
  if (status !== 'Active') return false;
  
  // Check start_date
  if (rate.start_date && rate.start_date > today) return false;
  
  // Check end_date
  if (rate.end_date && rate.end_date < today) return false;
  
  return true;
}

/**
 * Get rate lifecycle status for display
 * Returns a descriptive status based on rate_status and dates
 * 
 * @param {Object} rate - Rate object
 * @param {Date} [referenceDate] - Date to check against (defaults to today)
 * @returns {Object} { status: string, color: string, label: string }
 */
export function getRateLifecycleStatus(rate, referenceDate = new Date()) {
  if (!rate) return { status: 'unknown', color: 'gray', label: 'Unknown' };
  
  const today = referenceDate.toISOString().split('T')[0];
  const status = rate.rate_status || rate.status || 'Active';
  
  if (status === 'Inactive') {
    return { status: 'inactive', color: 'red', label: 'Inactive' };
  }
  
  // Check if scheduled for future
  if (rate.start_date && rate.start_date > today) {
    return { status: 'scheduled', color: 'blue', label: `Starts ${rate.start_date}` };
  }
  
  // Check if expired
  if (rate.end_date && rate.end_date < today) {
    return { status: 'expired', color: 'orange', label: `Expired ${rate.end_date}` };
  }
  
  // Active and in range
  if (rate.end_date) {
    return { status: 'active', color: 'green', label: `Active until ${rate.end_date}` };
  }
  
  return { status: 'active', color: 'green', label: 'Active' };
}

/**
 * Pick the best rate from a list based on a primary value (LTV or Loan Size)
 * Uses distance-based scoring to find the best matching rate range
 * 
 * @param {Array} rows - Array of rate objects
 * @param {number} primaryValue - LTV percentage or loan amount to match
 * @param {string} minField - Field name for minimum value (e.g., 'ltv_min', 'loan_min')
 * @param {string} maxField - Field name for maximum value (e.g., 'ltv_max', 'loan_max')
 * @returns {Object|null} Best matching rate or null if no rates
 */
export function pickBestRate(rows, primaryValue, minField, maxField) {
  if (!rows || rows.length === 0) return null;

  // Helper to extract a numeric with flexible naming fallbacks
  const extractRangeVal = (r, baseField, isMin) => {
    const candidates = [
      r[baseField],
      r[baseField?.toLowerCase?.()],
      r[baseField?.toUpperCase?.()],
      // remove underscores/case e.g. min_ltv -> minltv
      r[baseField?.replace?.(/_/g, '')],
      // common explicit fallbacks for LTV fields
      isMin ? r.min_ltv : r.max_ltv,
      isMin ? r.minltv : r.maxltv,
      isMin ? r.min_LTV : r.max_LTV,
      isMin ? r.minLTV : r.maxLTV,
      // legacy naming observed in CSVs
      isMin ? r.min_loan_ltv : r.max_loan_ltv,
    ];
    for (const c of candidates) {
      const parsed = parseNumber(c);
      if (Number.isFinite(parsed)) return parsed;
    }
    return NaN;
  };

  // If primaryValue is invalid, fall back to lowest rate (by numeric rate where possible)
  if (!Number.isFinite(primaryValue)) {
    const byRate = rows.filter(r => r.rate != null).sort((a, b) => Number(a.rate) - Number(b.rate));
    return byRate[0] || rows[0];
  }

  // 1. Prefer rows whose range contains the primary value, choosing the LOWEST bucket (smallest max)
  const containing = [];
  for (const r of rows) {
    const min = extractRangeVal(r, minField, true);
    const max = extractRangeVal(r, maxField, false);
    // Use inclusive comparison for both boundaries to handle edge cases like exactly 75.0%
    if (Number.isFinite(min) && Number.isFinite(max) && primaryValue >= min && primaryValue <= max) {
      containing.push({ row: r, min, max });
    }
  }
  
  if (containing.length > 0) {
    containing.sort((a, b) => a.max - b.max || a.min - b.min);
    return containing[0].row;
  }

  // 2. If no containing range, fall back to closest midpoint; bias lower max then lower min
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const r of rows) {
    const min = extractRangeVal(r, minField, true);
    const max = extractRangeVal(r, maxField, false);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      const mid = (min + max) / 2;
      const score = Math.abs(primaryValue - mid);
      const currentBestMax = best ? extractRangeVal(best, maxField, false) : Number.POSITIVE_INFINITY;
      const currentBestMin = best ? extractRangeVal(best, minField, true) : Number.POSITIVE_INFINITY;
      if (
        score < bestScore ||
        (score === bestScore && max < currentBestMax) ||
        (score === bestScore && max === currentBestMax && min < currentBestMin)
      ) {
        bestScore = score;
        best = r;
      }
    } else if (r.rate != null && best == null) {
      // Fallback: pick first with a rate if no structured ranges
      best = r;
    } else if (best == null) {
      best = r;
    }
  }
  return best || rows[0];
}

/**
 * Determine calculator mode (Fusion vs Bridge) based on selected answers
 * Used in Bridging calculator to differentiate product types
 * 
 * @param {Object} answers - Map of question keys to selected answer objects
 * @returns {string} 'Fusion' or 'Bridge'
 */
export function computeModeFromAnswers(answers) {
  // If any selected answer originates from a criteria row whose criteria_set mentions 'fusion', treat as Fusion
  const vals = Object.values(answers || {});
  for (const v of vals) {
    if (v && v.raw && v.raw.criteria_set && /fusion/i.test(String(v.raw.criteria_set))) {
      return 'Fusion';
    }
  }
  return 'Bridge';
}

/**
 * Compute tier level from selected answers
 * Used in BTL calculator to determine rate tier
 * Picks the highest numeric tier among selected options, defaults to Tier 1
 * 
 * @param {Object} answers - Map of question keys to selected answer objects
 * @returns {number} Maximum tier number (defaults to 1)
 */
export function computeTierFromAnswers(answers) {
  let maxTier = 1;
  Object.values(answers).forEach((opt) => {
    if (!opt) return;
    const t = Number(opt.tier ?? opt.tier?.toString?.() ?? 1);
    if (!Number.isNaN(t) && t > maxTier) maxTier = t;
  });
  return maxTier;
}
