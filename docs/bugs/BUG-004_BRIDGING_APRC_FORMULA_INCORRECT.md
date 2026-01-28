# BUG-004: Bridging APRC Formula Incorrect

## Summary
The APRC (Annual Percentage Rate of Charge) calculation in `bridgeFusionCalculationEngine.js` uses an incorrect formula compared to the business reference spreadsheet (`Issued - Bridge Calc 070126.xlsm`).

## Reported Issue
Calculator APRC values differ from expected business values:
- Fixed Bridge: Calculator shows ~17.89%, expected ~15.79%
- Variable Bridge: Calculator shows ~17.28%, expected ~15.30%
- Fusion: Calculator shows ~12.55%, expected ~10.71%

## Root Cause

### Current Code Formula (WRONG)
Location: [bridgeFusionCalculationEngine.js](../../frontend/src/utils/bridgeFusionCalculationEngine.js#L581-L588)

```javascript
// === APR/APRC CALCULATION ===
// APRC = Annual Percentage Rate of Charge
// Formula: ((Total Repayable / Net Proceeds) - 1) / (Term in years) * 100
const totalAmountRepayable = gross + totalInterest;
const aprcAnnual = netLoanGBP > 0 
  ? ((totalAmountRepayable / netLoanGBP - 1) / (term / 12)) * 100
  : 0;
```

This formula:
```
APRC = ((Gross + TotalInterest) / NetLoan - 1) / Years * 100
```

### Correct Formula (From Excel Spreadsheet)
Source: `Main Calculations` sheet, Row 47 in `Issued - Bridge Calc 070126.xlsm`

Excel Formula:
```
=IFERROR((D40+D38+D46)/D35/D29*12,0)
```

Which translates to:
```
APRC = (Additional Broker Fee + Arrangement Fee + Total Interest) / Net Loan / Term (months) * 12
```

Or simplified (assuming Additional Broker Fee = 0 in most cases):
```
APRC = (Arrangement Fee + Total Interest) / Net Loan / Term * 12
```

### Key Differences

| Component | Current (Wrong) | Correct (Excel) |
|-----------|-----------------|-----------------|
| Numerator | `Gross + TotalInterest` | `ArrangementFee + TotalInterest` (+ Additional Broker Fee if any) |
| Formula | `(Repayable/Net - 1) / Years` | `TotalCost / Net / Years` |
| Calculation Type | Effective rate from principal ratio | Simple cost ratio |

## Impact
- APRC percentages displayed in calculator are ~2-3% higher than they should be
- APRC values on PDF quotes will be incorrect
- Affects all Bridge and Fusion products

## Related Bugs
- **BUG-003**: Net Loan formula is also incorrect (incorrectly deducts extra fees), which compounds the APRC error since Net Loan is the denominator

## Correct Net Loan Formula (for reference)
From Excel sheet Row 35:
- **Bridge**: `Net Loan = Gross - Arrangement Fee - Rolled Interest`
- **Fusion**: `Net Loan = Gross - Deferred - Arrangement Fee - Rolled Interest`

## Suggested Fix

Replace lines 581-588 in `bridgeFusionCalculationEngine.js`:

```javascript
// === APR/APRC CALCULATION ===
// APRC = (Additional Broker Fee + Arrangement Fee + Total Interest) / Net Loan / Term (months) * 12
// This represents the annual cost as a percentage of the net loan received
// Note: "Additional Broker Fee" in Excel = procFeeGBP (1% proc fee) in code
const additionalBrokerFeeForAPRC = procFeeGBP || 0;  // 1% of gross, Row 40 in Excel
const totalCreditCost = additionalBrokerFeeForAPRC + arrangementFeeGBP + totalInterest;
const aprcAnnual = netLoanGBP > 0 && term > 0
  ? (totalCreditCost / netLoanGBP / term * 12) * 100
  : 0;
```

**Important Notes**:
1. The "Additional Broker Fee" in Excel (1%) maps to `procFeeGBP` in the code
2. Also requires fixing the Net Loan calculation (see BUG-003) for correct APRC values
3. Net Loan formula should be: `Net = Gross - ArrangementFee - RolledInterest` (not including proc fee, admin fee, title insurance, etc.)

## Verification Test

With the correct formulas and these inputs (from Excel screenshot):
- Gross Loan: £750,000
- Arrangement Fee: £15,000 (2%)
- **Additional Broker Fee: £7,500 (1%)** ← KEY COMPONENT
- Fixed Bridge Rolled Interest: £22,500
- Fixed Bridge Total Interest: £90,000
- Fixed Bridge Term: 12 months
- Net Loan: £712,500

Expected calculation:
```
APRC = (7,500 + 15,000 + 90,000) / 712,500 / 12 * 12 * 100
APRC = 112,500 / 712,500 * 100
APRC = 15.79% ✓
```

**Verified all products match with Additional Broker Fee included:**
| Product | Calculated | Expected | Match |
|---------|-----------|----------|-------|
| Fixed Bridge | 15.79% | 15.79% | ✓ |
| Variable Bridge | 15.30% | 15.30% | ✓ |
| Fusion | 10.71% | 10.71% | ✓ |

## Status
- **Severity**: Medium
- **Status**: Fixed
- **Fixed Date**: January 28, 2026
- **Discovered**: 2026-01-26
- **Case Reference**: MFS001117
- **Verified**: 2026-01-26 (formula confirmed against Excel spreadsheet)

## Notes
1. The key missing component was the **Additional Broker Fee** (1% = £7,500) which must be included in the APRC numerator
2. The current code does NOT include Additional Broker Fee in APRC calculation
3. Both the APRC formula AND the Net Loan formula (BUG-003) need to be fixed together
