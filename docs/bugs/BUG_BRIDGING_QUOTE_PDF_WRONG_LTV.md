# BUG-001: Bridging Quote PDF Shows Wrong LTV and Gross Loan for Bridge Products

**Bug ID:** BUG-001  
**Date Identified:** January 26, 2026  
**Status:** Open  
**Severity:** Medium  
**Affected Component:** Bridging Quote PDF Generation

---

## Problem Description

When generating a Bridging Quote PDF, the Fixed Bridge and Variable Bridge columns display **60% LTV and £600,000 Gross Loan** instead of the correct **75% LTV and £750,000 Gross Loan** that the user calculated. The Fusion column displays correctly.

### Screenshot Evidence
- Calculator UI shows: LTV 75.00%, Gross Loan £750,000 for all three products ✅
- Quote PDF shows: LTV 60.00%, Gross Loan £600,000 for Fixed/Variable Bridge ❌
- Quote PDF shows: LTV 75.00%, Gross Loan £750,000 for Fusion ✅

---

## Root Cause Analysis

### Issue 1: Database stores 7 results instead of 3

The calculator saves **all LTV band calculations** to the database, not just the 3 "best" results shown in the UI:

| Product Type | LTV Bands Stored |
|--------------|------------------|
| Fixed Bridge | 60%, 70%, 75% (3 rows) |
| Variable Bridge | 60%, 70%, 75% (3 rows) |
| Fusion | 75% only (1 row) |
| **Total** | **7 rows** |

**Location:** `frontend/src/components/calculators/BridgingCalculator.jsx` line 1644
```javascript
results: calculatedRates, // Saves ALL 7 calculated results
```

The UI only displays 3 results using `bestBridgeRates` which selects the best rate per product type.

### Issue 2: PDF Helper picks the wrong result

The PDF helper function picks the **first matching result** for each product type, which is the lowest LTV band (60%):

**Location:** `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js` lines 163-165
```javascript
export const getBestResultForProductType = (results, productType) => {
  const filtered = getResultsByProductType(results, productType);
  return filtered.length > 0 ? filtered[0] : null;  // ⚠️ Returns FIRST match (60% LTV)
};
```

Since the database stores results in order (60%, 70%, 75%), the first match is always the 60% LTV band for Bridge products.

For Fusion, there's only ONE result stored (75% LTV), so it displays correctly.

---

## Data Evidence (Case MFS001117)

Query: `bridge_quote_results` table for quote_id `411080bf-00c1-46d6-b5a8-c69d129c041f`

### Fixed Bridge Results (3 rows stored):
| gross_loan | ltv_percentage | max_ltv | rate_id |
|------------|----------------|---------|---------|
| 600,000 | 60 | 60 | 404 |
| 700,000 | 70 | 70 | 405 |
| **750,000** | **75** | **75** | **406** | ← Correct one

### Variable Bridge Results (3 rows stored):
| gross_loan | ltv_percentage | max_ltv | rate_id |
|------------|----------------|---------|---------|
| 600,000 | 60 | 60 | 446 |
| 700,000 | 70 | 70 | 447 |
| **750,000** | **75** | **75** | **448** | ← Correct one

### Fusion Results (1 row stored):
| gross_loan | ltv_percentage | max_ltv | rate_id |
|------------|----------------|---------|---------|
| **750,000** | **75** | **75** | **477** | ← Only one, always correct

---

## Solution Options

### Option A: Fix the PDF Helper (Recommended - Less Risk)

Modify `getBestResultForProductType()` to select the result with the **highest LTV** (matching user's actual calculation):

**File:** `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js`

```javascript
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
```

### Option B: Only Save 3 "Best" Results to Database

Modify the save logic to only store the 3 results shown in the UI:

**File:** `frontend/src/components/calculators/BridgingCalculator.jsx` line 1644

```javascript
// Change from:
results: calculatedRates,

// To:
results: bestBridgeRatesArray, // Only save the 3 "best" results shown in UI
```

**Note:** This requires ensuring `bestBridgeRatesArray` contains all required fields for the database schema.

### Option C: Match by Gross Loan Amount

Select the result whose `gross_loan` matches the quote's `gross_loan`:

```javascript
export const getBestResultForProductType = (results, productType, quoteGrossLoan) => {
  const filtered = getResultsByProductType(results, productType);
  if (filtered.length === 0) return null;
  
  // Find the result matching the quote's gross loan
  const matching = filtered.find(r => 
    parseNumber(r.gross_loan) === parseNumber(quoteGrossLoan)
  );
  
  return matching || filtered[filtered.length - 1]; // Fallback to last (highest LTV)
};
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `frontend/src/components/calculators/BridgingCalculator.jsx` | Calculator logic, saves results |
| `frontend/src/components/calculators/SaveQuoteButton.jsx` | Prepares results for database |
| `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js` | PDF helper - selects wrong result |
| `frontend/src/components/pdf/BridgingQuotePDF.jsx` | PDF component |
| `database: bridge_quote_results` | Stores all LTV band results |

---

## Testing Steps

1. Create a new Bridging quote with:
   - Property Value: £1,000,000
   - Gross Loan: £750,000 (75% LTV)
   
2. Verify calculator UI shows 75% LTV for all products

3. Save and issue the quote

4. Generate Quote PDF

5. **Expected:** PDF shows 75% LTV, £750,000 for all three products

6. **Actual (Bug):** PDF shows 60% LTV, £600,000 for Fixed/Variable Bridge

---

## Related Information

- The BTL calculator does NOT have this issue because it stores only the selected rate results, not all LTV bands
- The Fusion product is unaffected because it only has one rate record per loan size tier (not multiple LTV bands)
