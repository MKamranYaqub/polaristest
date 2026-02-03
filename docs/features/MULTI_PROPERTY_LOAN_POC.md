# Multi-Property Loan POC - Implementation Documentation

**Document Version:** 1.0  
**Date:** 3 February 2026  
**Status:** Implemented

---

## Overview

The Multi-Property Loan feature enables brokers to calculate bridging loans across multiple properties with blended rates. When "Multi-Property Loan" is selected from the Product Scope dropdown, a dedicated section appears allowing entry of multiple properties with individual rates, LTVs, and automatic blended rate calculations.

---

## Features Implemented

### 1. Multi-Property Loan Section
- **Location:** `frontend/src/components/calculator/bridging/MultiPropertyLoanSection.jsx`
- Displays when Product Scope = "Multi-Property Loan"
- Professional admin-style table with the following columns:
  - Property Type (Residential, Commercial, Semi-Commercial)
  - Charge Type (1st Charge, 2nd Charge - residential only)
  - Sub Product Type (based on property type)
  - Property Address
  - Property Value (£)
  - 1st Charge Value (£) - visible only for 2nd charge
  - Fixed Rate (%)
  - Variable Rate (%)
  - Max LTV (%)
  - Max Gross Loan (£) - calculated
  - Actions (Delete button)

### 2. Blended Rate Calculations
- **Fixed Rate Blended:** Weighted average based on property values
- **Variable Rate Blended:** Weighted average based on property values
- **Blended LTV:** (Total Max Gross Loan / Total Property Value) × 100
- Totals row displays aggregated values and blended rates

### 3. Rate Auto-Population with LTV Tier Matching
- Rates are auto-populated from the rate table based on:
  - Property Type
  - Sub Product
  - Charge Type
  - **LTV tier** (uses `min_ltv` and `max_ltv` range matching)
- Rate lookup finds rates where: `min_ltv < LTV <= max_ltv`
- When Max LTV is changed, rates are automatically re-looked up for the correct tier
- Users can manually override rates if needed

### 4. Action Buttons
- **Add Property:** Add new property row to the table
- **Use Blended Values:** Transfer totals and blended rates to Loan Details section

### 5. Max Loan Term
- Uses the selected loan term from Loan Details (not hardcoded to 18 months)
- Matches the behavior of standard bridging loans

---

## UI/UX Changes

### Table Styling
- Uses `professional-table` class from admin-tables.css
- Consistent with admin section table styling
- Sticky Actions column for horizontal scrolling
- Scrollable container (max-height: 400px) for vertical overflow
- Proper column widths to prevent text cropping

### Button Positioning
- "Add Property" and "Use Blended Values" buttons positioned above the Blended Rate Summary
- Removed the note text about rate auto-population

### Column Widths
| Column | Min Width |
|--------|-----------|
| Property Type | 120px |
| Charge Type | 110px |
| Sub Product Type | 180px |
| Property Address | 180px |
| Property Value | 130px |
| 1st Charge Value | 140px |
| Fixed Rate | 100px |
| Variable Rate | 110px |
| Max LTV | 90px |
| Max Gross Loan | 140px |
| Actions | 70px |

---

## Technical Implementation

### Files Modified

1. **MultiPropertyLoanSection.jsx**
   - Added admin-tables.css import
   - Updated table structure to use `professional-table` class
   - Reorganized button and summary section layout
   - Removed info note text
   - Added sticky actions column

2. **BridgingCalculator.jsx**
   - Updated synthetic rate objects to use selected `bridgingTerm` for `max_term` and `full_term`
   - Previously hardcoded to 18 months, now dynamic

### Key Code Changes

```jsx
// Synthetic rate max_term now uses selected loan term
const syntheticVariableRate = {
  ...
  max_term: parseNumber(bridgingTerm) || 18,
  full_term: parseNumber(bridgingTerm) || 18,
  ...
};

const syntheticFixedRate = {
  ...
  max_term: parseNumber(bridgingTerm) || 18,
  full_term: parseNumber(bridgingTerm) || 18,
  ...
};
```

---

## Database Schema

Uses existing `bridge_multi_property_details` table with POC columns:
- `sub_product` - Sub-product type
- `fixed_rate` - Fixed bridge rate (monthly %)
- `variable_rate` - Variable bridge rate (monthly %)
- `max_ltv` - Maximum LTV (%)
- `max_gross_loan` - Calculated max gross loan
- `is_multi_property_loan` - Boolean flag for Multi-Property Loan rows

---

## Warnings Display

Mixed portfolio warnings are shown for:
- **Mixed Property Types:** e.g., "Mixed Portfolio: Residential (60%) + Commercial (40%)"
- **Mixed Charge Types:** e.g., "Mixed Charges: 1st Charge (80%) + 2nd Charge (20%)"

---

## Future Enhancements (Phase 2)

1. PDF generation for Multi-Property Loan quotes
2. Extended property fields (postcode, title number, proprietor, purchase date/price)
3. Rate lookup optimization with caching
4. Portfolio-level validation rules

---

## Testing Checklist

- [ ] Add multiple properties with different types
- [ ] Verify blended rates calculate correctly
- [ ] Test 2nd charge visibility (residential only)
- [ ] Verify max loan term uses selected term
- [ ] Test "Use Blended Values" button
- [ ] Verify save/load quote with multi-property data
- [ ] Check table scrolling behavior
- [ ] Verify admin table styling matches

---

**Document End**
