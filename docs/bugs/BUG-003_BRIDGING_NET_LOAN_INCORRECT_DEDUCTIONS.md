# BUG-003: Bridging Calculator Net Loan Formula Deducts Incorrect Fees

**Bug ID:** BUG-003  
**Date Identified:** January 26, 2026  
**Status:** Open  
**Severity:** High  
**Affected Component:** Bridge/Fusion Calculation Engine

---

## Problem Description

The Net Loan calculation in the Bridge/Fusion calculator is deducting fees that should NOT be subtracted from the Net Loan. This results in an **understated Net Loan amount** shown to users.

---

## Current (Incorrect) Formula

**Location:** `frontend/src/utils/bridgeFusionCalculationEngine.js` lines 564-566

```javascript
const netLoanGBP = Math.max(
  0,
  gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP - procFeeGBP - brokerFeeGBP - brokerClientFeeGBP - adminFeeAmt - (titleInsuranceCost || 0)
);
```

### Fees Currently Being Deducted:

| Fee | Should Deduct? | Notes |
|-----|----------------|-------|
| Arrangement Fee (Product Fee) | ✅ Yes | Correct - deducted from loan |
| Rolled Interest | ✅ Yes | Correct - pre-paid interest |
| Deferred Interest | ✅ Yes | Correct - interest added to loan |
| **Proc Fee (Broker Commission)** | ❌ No | **Should NOT be deducted** |
| **Broker Fee (Flat)** | ❌ No | **Should NOT be deducted** |
| **Broker Client Fee** | ❌ No | **Should NOT be deducted** |
| **Admin Fee** | ❌ No | **Should NOT be deducted** |
| **Title Insurance Cost** | ❌ No | **Should NOT be deducted** |

---

## Correct Formula

The Net Loan should only deduct fees that are **retained by the lender** from the gross loan:

```javascript
const netLoanGBP = Math.max(
  0,
  gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP
);
```

### Correct Net Loan Formula:

```
Net Loan = Gross Loan 
         - Arrangement Fee (Product Fee)
         - Rolled Interest
         - Deferred Interest
```

The following fees are **separate charges** and should NOT reduce the Net Loan:
- **Proc Fee** - Paid to broker, not retained from loan
- **Broker Fee** - Paid to broker, not retained from loan
- **Broker Client Fee** - Additional client fee, not retained from loan
- **Admin Fee** - Separate admin charge
- **Title Insurance** - Separate insurance cost

---

## Impact

This bug causes the Net Loan to be **understated** by the sum of:
- Proc Fee
- Broker Fee  
- Broker Client Fee
- Admin Fee
- Title Insurance Cost

### Example Impact:

For a £750,000 gross loan with:
- Proc Fee: £6,750 (0.9%)
- Admin Fee: £995
- Title Insurance: £1,092

**Current (Wrong):** Net Loan reduced by an extra £8,837
**Correct:** Net Loan should NOT be reduced by these amounts

---

## Solution

**File:** `frontend/src/utils/bridgeFusionCalculationEngine.js`

### Change from:
```javascript
const netLoanGBP = Math.max(
  0,
  gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP - procFeeGBP - brokerFeeGBP - brokerClientFeeGBP - adminFeeAmt - (titleInsuranceCost || 0)
);
```

### Change to:
```javascript
const netLoanGBP = Math.max(
  0,
  gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP
);
```

---

## Related Calculations to Review

After fixing Net Loan, verify these dependent calculations are still correct:

1. **Net LTV** - Uses `netLoanGBP / propertyValue`
2. **APRC** - Uses `netLoanGBP` in formula
3. **NBP (Net Borrowing Position)** - May have different formula

---

## Files Involved

| File | Purpose |
|------|---------|
| `frontend/src/utils/bridgeFusionCalculationEngine.js` | Net Loan calculation (line 564-566) |

---

## Testing Steps

1. Create a Bridging quote with:
   - Property Value: £1,000,000
   - Gross Loan: £750,000
   - Product Fee: 2% (£15,000)
   - Rolled Months: 3 months
   - Client Type: Broker (to trigger Proc Fee)

2. Calculate expected Net Loan:
   - Gross: £750,000
   - Less Product Fee: £15,000
   - Less Rolled Interest: (depends on rate)
   - Less Deferred Interest: £0 (if none)
   - = Net Loan

3. Verify Net Loan does NOT deduct:
   - Proc Fee
   - Admin Fee
   - Title Insurance

4. Compare calculator display vs. expected value
