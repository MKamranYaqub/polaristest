# Code & Structure Cleanup Backlog

This document tracks technical debt and cleanup opportunities identified during development. These are non-urgent improvements that can be addressed when time permits.

**Created**: January 28, 2026  
**Priority**: Low (functionality works, but code could be cleaner)

---

## 1. Monthly Payment Field Redundancy

### Issue
Multiple fields represent the same value across the codebase:
- `monthlyPaymentGBP` (calculation engine)
- `directDebit` (engine output, UI display)
- `monthly_interest_cost` (database, UI)
- `monthly_payment` (legacy database field)
- `monthly_dd` (another legacy alias)

### Current Workarounds
```javascript
// SaveQuoteButton.jsx - fallback chain
monthly_payment: parseNumeric(rate.monthly_interest_cost || rate.monthly_payment),

// btlQuoteHelpers.js - triple fallback
const monthly = parseNumber(result.monthly_dd || result.monthly_payment || result.monthly_interest_cost);
```

### Recommended Cleanup
1. Standardize on two fields:
   - `monthly_interest_cost`: Theoretical monthly interest (always calculated)
   - `direct_debit`: Actual payment amount (£0 during rolled months)
2. Create database migration to consolidate columns
3. Update all helpers to use consistent naming

### Files Affected
- `frontend/src/utils/bridgeFusionCalculationEngine.js`
- `frontend/src/utils/btlCalculationEngine.js`
- `frontend/src/components/calculators/SaveQuoteButton.jsx`
- `frontend/src/components/pdf/utils/btlQuoteHelpers.js`
- `frontend/src/components/pdf/utils/bridgingDipHelpers.js`
- `frontend/src/utils/generateQuotePDF.js`

---

## 2. Rate Terminology Inconsistency

### Issue
Rate-related fields have inconsistent naming:
- `rate` vs `rate_percent` vs `ratePercent`
- `fullRateText` vs `full_rate`
- `payRateText` vs `pay_rate`

### Current State
| Internal Name | Database Column | UI Label |
|--------------|-----------------|----------|
| `result.fullRateText` | `full_rate` | "Full Rate" |
| `result.payRateText` | `pay_rate` | "Pay Rate" |
| `selectedRate.rate` | `rate_percent` | N/A (snapshot) |

### Recommended Cleanup
1. Standardize snake_case for database columns
2. Standardize camelCase for JavaScript variables
3. Document the mapping clearly

### Files Affected
- `frontend/src/utils/btlCalculationEngine.js`
- `frontend/src/utils/bridgeFusionCalculationEngine.js`
- `frontend/src/components/calculators/SaveQuoteButton.jsx`

---

## 3. NBP/NPB Variable Names

### Issue
UI labels were updated to "NPB" but internal variable names remain as `nbp`:
- `result.nbp` (engine)
- `best.nbp` (calculator)
- `nbp_ltv` (database)

### Current State
- ✅ UI labels: Changed to "NPB" and "NPB LTV"
- ❌ Variable names: Still `nbp`, `nbpLTV`
- ❌ Database columns: Still `nbp`, `nbp_ltv`

### Recommended Cleanup (Optional)
If desired for consistency:
1. Rename variables to `npb`, `npbLTV`
2. Create migration to rename database columns
3. Update all references

**Note**: This is cosmetic - the mismatch between internal names and UI labels is common and acceptable.

### Files Affected
- `frontend/src/utils/btlCalculationEngine.js`
- `frontend/src/utils/bridgeFusionCalculationEngine.js`
- `frontend/src/components/calculators/BridgingCalculator.jsx`
- `frontend/src/components/calculators/BTL_Calculator.jsx`
- `frontend/src/components/calculators/SaveQuoteButton.jsx`

---

## 4. Backup Files in Repository

### Issue
`.backup` files exist in the repository that should be removed:
- `frontend/src/components/admin/GlobalSettings.jsx.backup`

### Recommended Cleanup
1. Delete backup files
2. Add `*.backup` to `.gitignore`

---

## 5. Dead/Unused Backend PDF Routes

### Issue
Backend has PDF generation routes that are NOT USED (all PDF generation is frontend-only):
- `backend/routes/quotePdf.js`
- `backend/routes/dipPdf.js`

### Current State
Per `copilot-instructions.md`:
> **CRITICAL PDF NOTE**: All PDF generation (Quotes & DIPs) uses FRONTEND React components with @react-pdf/renderer. Backend PDF routes exist but are NOT USED.

### Recommended Cleanup
1. Verify no external systems call these endpoints
2. Remove or deprecate the routes
3. Add clear deprecation comments if keeping for reference

---

## 6. Inconsistent Number Parsing

### Issue
Multiple number parsing utilities exist:
- `parseNumber()` from various locations
- `parseNumeric()` in SaveQuoteButton
- Direct `Number()` or `parseFloat()` calls

### Recommended Cleanup
1. Consolidate into single `parseNumber` utility
2. Import consistently from one location
3. Handle all edge cases (currency strings, percentages, null/undefined)

### Canonical Location
`frontend/src/utils/calculator/numberFormatting.js`

---

## 7. GlobalSettings Default Arrays Duplication

### Issue
`GlobalSettings.jsx` has three nearly identical arrays:
- `DEFAULT_BTL_ROWS`
- `DEFAULT_BRIDGE_ROWS`  
- `DEFAULT_CORE_ROWS`

And three nearly identical label alias objects:
- `DEFAULT_LABEL_ALIASES_BTL`
- `DEFAULT_LABEL_ALIASES_BRIDGE`
- `DEFAULT_LABEL_ALIASES_CORE`

### Recommended Cleanup
1. Create base array with common rows
2. Extend for product-specific rows
3. Reduce duplication

---

## 8. Test Coverage Gaps

### Areas Needing Tests
- [ ] bridgeFusionCalculationEngine - APRC formula (after BUG-004 fix)
- [ ] bridgeFusionCalculationEngine - Net Loan formula (after BUG-003 fix)
- [ ] ICR warning highlighting logic
- [ ] Rate/product fee override save/restore cycle

---

## Priority Matrix

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Monthly Payment Redundancy | Medium | High | P3 |
| Rate Terminology | Low | Medium | P4 |
| NBP Variable Names | Low | Medium | P5 |
| Backup Files | Low | Low | P2 |
| Dead Backend Routes | Low | Low | P3 |
| Number Parsing | Medium | Medium | P3 |
| GlobalSettings Duplication | Low | Medium | P4 |
| Test Coverage | High | High | P2 |

---

## Notes

- These are all non-breaking changes
- Functionality is correct; this is code quality improvement
- Consider addressing during quieter development periods
- Some items may require database migrations (plan carefully)
