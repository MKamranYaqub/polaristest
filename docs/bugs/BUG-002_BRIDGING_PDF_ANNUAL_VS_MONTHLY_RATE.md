# BUG-002: Bridging Quote PDF Shows Annual Rate Instead of Monthly Rate for Bridge Products

**Bug ID:** BUG-002  
**Date Identified:** January 26, 2026  
**Status:** Fixed  
**Fixed Date:** January 28, 2026  
**Severity:** Medium  
**Affected Component:** Bridging Quote PDF Generation  
**Related Bug:** BUG-001

---

## Problem Description

When generating a Bridging Quote PDF, the "Interest Rate p.a." field displays the **annual rate** for Bridge products, but the calculator UI displays the **monthly rate** in the "Full Rate" row. This creates an inconsistency between what the user sees in the calculator vs. the PDF.

### Evidence from Case MFS001117

**Calculator UI shows (Full Rate row):**
- Fusion: 4.79% + BBR
- Variable Bridge: 0.65% + BBR  
- Fixed Bridge: 1.00%

**Quote PDF shows (Interest Rate p.a.):**
- Fusion: 8.54%
- Variable Bridge: 9.15%
- Fixed Bridge: 9.60%

---

## Root Cause Analysis

### Database Storage

The calculation engine stores both rates:

| Field | Description | Example (Fixed Bridge 75% LTV) |
|-------|-------------|-------------------------------|
| `initial_rate` | Annual rate (monthly × 12, or margin + BBR annualized) | 12.00 |
| `pay_rate` | Monthly rate (margin only for Bridge) | 1.00 |
| `margin_monthly` | Monthly margin | 1.00 |

### PDF Helper Function

**Location:** `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js` lines 190-198

```javascript
export const getInterestRate = (result) => {
  // Check multiple fields for rate information, prioritizing initial_rate (saved overridden rate)
  const rate = parseNumber(result?.initial_rate) ||    // ⚠️ Prioritizes annual rate
               parseNumber(result?.pay_rate) ||
               parseNumber(result?.actual_rate) || 
               parseNumber(result?.annual_rate) ||
               parseNumber(result?.rate) ||
               0;
  return rate.toFixed(2);
};
```

The function prioritizes `initial_rate` which contains the **annual** rate.

### Calculator UI Mapping

**Location:** `frontend/src/components/calculators/BridgingCalculator.jsx` lines 1121-1123

```javascript
initial_rate: calculated.fullAnnualRate?.toFixed(2) || null,  // Annual rate
pay_rate: calculated.payRateMonthly?.toFixed(2) || null,      // Monthly rate
```

The UI's "Full Rate" row displays `best.rate` which corresponds to the monthly margin/coupon rate, not the annual rate.

---

## Data Evidence (Case MFS001117)

```json
[
  {
    "product_name": "Fixed Bridge",
    "initial_rate": 12,      // Annual: 1% × 12 = 12%
    "pay_rate": 1,           // Monthly: 1%
    "margin_monthly": 1,
    "gross_ltv": 75
  },
  {
    "product_name": "Variable Bridge", 
    "initial_rate": 11.55,   // Annual: (0.65% + BBR) × 12
    "pay_rate": 0.65,        // Monthly margin: 0.65%
    "margin_monthly": 0.65,
    "gross_ltv": 75
  },
  {
    "product_name": "Fusion",
    "initial_rate": 8.54,    // Annual: margin + BBR
    "pay_rate": 4.79,        // Annual margin (Fusion uses annual)
    "margin_monthly": 0.4,
    "gross_ltv": 75
  }
]
```

---

## Industry Context

- **Bridge Products (Fixed/Variable):** Industry standard is to quote rates as **monthly** (e.g., 1% per month)
- **Fusion Products:** Typically quoted as **annual** rates (e.g., 4.79% + BBR)
- **PDF Label:** Currently says "Interest Rate p.a." which implies annual, but Bridge products should show monthly

---

## Solution Options

### Option A: Show Monthly Rate for Bridge, Annual for Fusion (Recommended)

Modify `getInterestRate()` to return the appropriate rate based on product type:

**File:** `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js`

```javascript
export const getInterestRate = (result) => {
  const productName = (result?.product_name || result?.product_kind || '').toLowerCase();
  const isFusion = productName.includes('fusion');
  
  if (isFusion) {
    // Fusion: Show annual rate (margin + BBR combined)
    const rate = parseNumber(result?.initial_rate) ||
                 parseNumber(result?.pay_rate) ||
                 0;
    return rate.toFixed(2);
  } else {
    // Bridge products: Show monthly rate (margin only)
    const rate = parseNumber(result?.pay_rate) ||
                 parseNumber(result?.margin_monthly) ||
                 parseNumber(result?.rate_percent) ||
                 0;
    return rate.toFixed(2);
  }
};
```

Also update the PDF to use different labels:
- Fusion: "Interest Rate p.a."
- Bridge: "Monthly Rate" or "Interest Rate p.m."

### Option B: Add Separate Fields for Display

Create separate helper functions:

```javascript
export const getMonthlyRate = (result) => {
  return parseNumber(result?.pay_rate) ||
         parseNumber(result?.margin_monthly) ||
         0;
};

export const getAnnualRate = (result) => {
  return parseNumber(result?.initial_rate) ||
         parseNumber(result?.full_annual_rate) ||
         0;
};
```

### Option C: Change PDF Label Based on Product Type

Keep using `initial_rate` but change the label dynamically:

```jsx
<Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>
  {productType === 'Fusion' ? 'Interest Rate p.a.' : 'Interest Rate p.m.'}
</Text>
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `frontend/src/components/pdf/utils/bridgingQuoteHelpers.js` | `getInterestRate()` function |
| `frontend/src/components/pdf/BridgingQuotePDF.jsx` | PDF component, rate label |
| `frontend/src/components/calculators/BridgingCalculator.jsx` | Rate calculation and mapping |
| `frontend/src/utils/bridgeFusionCalculationEngine.js` | Rate calculations |

---

## Testing Steps

1. Create a Bridging quote with:
   - Property Value: £1,000,000
   - Gross Loan: £750,000

2. Note the "Full Rate" values in calculator UI:
   - Fusion: X.XX% + BBR
   - Variable Bridge: X.XX% + BBR
   - Fixed Bridge: X.XX%

3. Generate Quote PDF

4. **Expected:** PDF rates should match calculator display (monthly for Bridge)

5. **Actual (Bug):** PDF shows annual rates which are ~12× higher for Bridge products

---

## Notes

- This bug is related to BUG-001 (wrong LTV selection) but is a separate display issue
- The annual rate IS stored correctly in `initial_rate` - this is not a calculation error
- The issue is which rate field the PDF should display for each product type
