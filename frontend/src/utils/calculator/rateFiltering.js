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
  
  // If primaryValue is invalid, fall back to lowest rate
  if (!Number.isFinite(primaryValue)) {
    const byRate = rows.filter(r => r.rate != null).sort((a, b) => Number(a.rate) - Number(b.rate));
    return byRate[0] || rows[0];
  }

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const r of rows) {
    const min = parseNumber(r[minField]);
    const max = parseNumber(r[maxField]);

    if (Number.isFinite(min) && Number.isFinite(max)) {
      // Exact match: value falls within range
      if (primaryValue >= min && primaryValue <= max) return r;
      
      // Distance-based scoring: find closest range midpoint
      const mid = (min + max) / 2;
      const score = Math.abs(primaryValue - mid);
      if (score < bestScore) {
        bestScore = score;
        best = r;
      }
    } else if (r.rate != null && best == null) {
      // Fallback: rate exists but no valid range
      best = r;
    } else if (best == null) {
      // Last resort: any row
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
