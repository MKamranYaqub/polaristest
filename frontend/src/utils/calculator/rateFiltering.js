/**
 * Rate selection and filtering utilities
 * Used for matching loan criteria to best available rates
 */

import { parseNumber } from './numberFormatting';

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

/**
 * Filter rates to only include active rates within their effective date range
 * Checks is_active flag and effective_from/effective_to date boundaries
 * 
 * @param {Array} rates - Array of rate objects
 * @returns {Array} Filtered array of active rates
 */
export function filterActiveRates(rates) {
  if (!rates || !Array.isArray(rates)) return [];
  
  const now = new Date();
  
  return rates.filter(rate => {
    // Check is_active flag if present (default to true if not set)
    const isActive = rate.is_active !== undefined ? rate.is_active : true;
    if (!isActive) return false;
    
    // Check effective_from date if present
    if (rate.effective_from) {
      const fromDate = new Date(rate.effective_from);
      if (!isNaN(fromDate.getTime()) && now < fromDate) return false;
    }
    
    // Check effective_to date if present
    if (rate.effective_to) {
      const toDate = new Date(rate.effective_to);
      if (!isNaN(toDate.getTime()) && now > toDate) return false;
    }
    
    // Check active_from/active_to as alternative field names
    if (rate.active_from) {
      const fromDate = new Date(rate.active_from);
      if (!isNaN(fromDate.getTime()) && now < fromDate) return false;
    }
    
    if (rate.active_to) {
      const toDate = new Date(rate.active_to);
      if (!isNaN(toDate.getTime()) && now > toDate) return false;
    }
    
    return true;
  });
}

/**
 * Get the lifecycle status of a rate based on its date fields and active state
 * Returns status information for display in admin tables
 * 
 * @param {Object} rate - Rate object with potential date/active fields
 * @returns {Object} Status object with status, label, and color properties
 */
export function getRateLifecycleStatus(rate) {
  if (!rate) {
    return { status: 'unknown', label: 'Unknown', color: 'gray' };
  }

  const now = new Date();
  
  // Check explicit is_active flag
  if (rate.is_active === false) {
    return { status: 'inactive', label: 'Inactive', color: 'red' };
  }

  // Parse date fields (support multiple naming conventions)
  const effectiveFrom = rate.effective_from || rate.active_from || rate.start_date;
  const effectiveTo = rate.effective_to || rate.active_to || rate.end_date;
  
  const fromDate = effectiveFrom ? new Date(effectiveFrom) : null;
  const toDate = effectiveTo ? new Date(effectiveTo) : null;
  
  // Check if rate is scheduled for future
  if (fromDate && !isNaN(fromDate.getTime()) && now < fromDate) {
    return { status: 'scheduled', label: 'Scheduled', color: 'blue' };
  }
  
  // Check if rate has expired
  if (toDate && !isNaN(toDate.getTime()) && now > toDate) {
    return { status: 'expired', label: 'Expired', color: 'red' };
  }
  
  // Check if rate is expiring soon (within 7 days)
  if (toDate && !isNaN(toDate.getTime())) {
    const daysUntilExpiry = Math.ceil((toDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return { status: 'expiring', label: `Expiring in ${daysUntilExpiry}d`, color: 'orange' };
    }
  }
  
  // Rate is active
  return { status: 'active', label: 'Active', color: 'green' };
}
