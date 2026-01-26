# Multi-Property Portfolio & Blended Rate Calculator

## Business Requirements Document

**Document Version:** 1.0  
**Date:** 26 January 2026  
**Author:** Development Team  
**Status:** Pending Business Approval

---

## Executive Summary

This document outlines the proposed implementation of an enhanced Multi-Property section within the Bridging Calculator. The feature will enable brokers to input multiple properties in a portfolio deal and automatically calculate blended rates based on property values, LTV tiers, charge types, and property classifications.

---

## 1. Business Objectives

### Primary Goals
1. **Streamline Portfolio Deals** - Enable brokers to quickly calculate multi-property bridging loans
2. **Accurate Rate Blending** - Automatically calculate weighted average rates across mixed portfolios
3. **Regulatory Compliance** - Ensure correct rate application based on property type and charge position
4. **Reduced Manual Errors** - Eliminate manual rate calculations for complex portfolio scenarios

### Expected Benefits
- Faster quote turnaround for portfolio clients
- Consistent rate application across all deals
- Improved accuracy in multi-property scenarios
- Better visibility of per-property contributions to overall rate

---

## 2. Feature Overview

### Current State
- Multi-Property section exists but is hidden
- Basic fields only: Property Address, Property Type, Property Value, Charge Type, First Charge Amount
- Simple gross loan calculation based on LTV
- "Use Total Gross Loan" button pushes sum to Loan Details
- No per-property rate calculation
- No blended rate functionality

### Proposed State
- Fully visible Multi-Property section when "Multi Property Loan?" = Yes
- Extended property fields matching Excel spreadsheet
- Per-property rate lookup based on type, LTV, and charge position
- Automatic blended rate calculation for both Variable and Fixed rates
- Visual display of rate contributions
- Push blended rates to Results table

---

## 3. Detailed Scenarios

### Scenario 1: Single Property Type, Single Charge Type (Simple)

**Example:**
| Property | Value | Gross Loan | LTV | Charge | Type |
|----------|-------|------------|-----|--------|------|
| 123 High Street | £500,000 | £350,000 | 70% | 1st | Residential |
| 456 Oak Lane | £750,000 | £525,000 | 70% | 1st | Residential |
| 789 Elm Road | £250,000 | £175,000 | 70% | 1st | Residential |

**Calculation:**
- All properties use same rate column (Residential 1st Charge)
- All at 70% LTV = same rate tier
- Blended Rate = Single rate (no blending needed)

**Result:**
- Variable Rate: 0.50%
- Fixed Rate: 0.85%

---

### Scenario 2: Same Property Type, Different LTV Tiers

**Example:**
| Property | Value | Gross Loan | LTV | Charge | Type | Weight |
|----------|-------|------------|-----|--------|------|--------|
| Property A | £1,000,000 | £600,000 | 60% | 1st | Residential | 50% |
| Property B | £600,000 | £420,000 | 70% | 1st | Residential | 30% |
| Property C | £400,000 | £300,000 | 75% | 1st | Residential | 20% |

**Rate Lookup:**
| Property | LTV Tier | Variable Rate | Fixed Rate |
|----------|----------|---------------|------------|
| Property A | 60% | 0.40% | 0.75% |
| Property B | 70% | 0.50% | 0.85% |
| Property C | 75% | 0.60% | 0.95% |

**Blended Calculation:**
- Variable: (50% × 0.40%) + (30% × 0.50%) + (20% × 0.60%) = **0.47%**
- Fixed: (50% × 0.75%) + (30% × 0.85%) + (20% × 0.95%) = **0.82%**

---

### Scenario 3: Mixed Property Types (Residential + Commercial)

**Example:**
| Property | Value | Gross Loan | LTV | Charge | Type | Weight |
|----------|-------|------------|-----|--------|------|--------|
| Office Building | £2,000,000 | £1,200,000 | 60% | 1st | Commercial | 57% |
| Residential Flat | £1,500,000 | £1,050,000 | 70% | 1st | Residential | 43% |

**Rate Lookup (Different Columns):**
| Property | Type Column | LTV | Variable Rate | Fixed Rate |
|----------|-------------|-----|---------------|------------|
| Office Building | Commercial (H) | 60% | 0.45% | 0.80% |
| Residential Flat | Residential (C) | 70% | 0.50% | 0.85% |

**Blended Calculation:**
- Variable: (57% × 0.45%) + (43% × 0.50%) = **0.47%**
- Fixed: (57% × 0.80%) + (43% × 0.85%) = **0.82%**

**UI Indicator:**
> ⚠️ Mixed Portfolio: Residential (43%) + Commercial (57%)

---

### Scenario 4: Mixed Charge Types (1st + 2nd Charge)

**Example:**
| Property | Value | Gross Loan | LTV | Charge | Type | Weight |
|----------|-------|------------|-----|--------|------|--------|
| Main Property | £800,000 | £560,000 | 70% | 1st | Residential | 53% |
| Additional Security | £700,000 | £420,000 | 60% | 2nd | Residential | 47% |

**Rate Lookup:**
| Property | Rate Column | LTV | Variable Rate | Fixed Rate |
|----------|-------------|-----|---------------|------------|
| Main Property | Residential (C) | 70% | 0.50% | 0.85% |
| Additional Security | 2nd Charge (J) | 60% | 0.45% | 0.80% |

**Key Rule:** 2nd Charge uses dedicated rate column (J) regardless of property type

**Blended Calculation:**
- Variable: (53% × 0.50%) + (47% × 0.45%) = **0.48%**
- Fixed: (53% × 0.85%) + (47% × 0.80%) = **0.83%**

**UI Indicator:**
> ⚠️ Mixed Charges: 1st Charge (53%) + 2nd Charge (47%)

---

### Scenario 5: Fully Mixed Portfolio (Complex)

**Example:**
| Property | Value | Gross Loan | LTV | Charge | Type |
|----------|-------|------------|-----|--------|------|
| Residential House | £600,000 | £450,000 | 75% | 1st | Residential |
| Commercial Unit | £900,000 | £540,000 | 60% | 1st | Commercial |
| Residential Flat | £500,000 | £300,000 | 60% | 2nd | Residential |

**Weights:**
- Residential House: £600k / £2M = 30%
- Commercial Unit: £900k / £2M = 45%
- Residential Flat: £500k / £2M = 25%

**Rate Lookup:**
| Property | Rate Column Used | LTV | Variable | Fixed |
|----------|------------------|-----|----------|-------|
| Residential House | Residential (C) | 75% | 0.60% | 0.95% |
| Commercial Unit | Commercial (H) | 60% | 0.45% | 0.80% |
| Residential Flat | 2nd Charge (J) | 60% | 0.45% | 0.80% |

**Blended Calculation:**
- Variable: (30% × 0.60%) + (45% × 0.45%) + (25% × 0.45%) = **0.49%**
- Fixed: (30% × 0.95%) + (45% × 0.80%) + (25% × 0.80%) = **0.85%**

**UI Indicator:**
> ⚠️ Complex Portfolio:
> - Property Types: Residential (55%) + Commercial (45%)
> - Charge Types: 1st Charge (75%) + 2nd Charge (25%)

---

## 4. Rate Table Reference

### Variable Bridging Rates (Monthly)

| LTV Tier | Resi Single | Resi Large | Resi Portfolio | Dev Exit | Commercial | Commercial Large | 2nd Charge |
|----------|-------------|------------|----------------|----------|------------|------------------|------------|
| ≤60% | 0.40% | 0.50% | 0.45% | 0.45% | 0.45% | 0.50% | 0.45% |
| ≤70% | 0.50% | 0.60% | 0.55% | 0.55% | 0.55% | 0.60% | 0.55% |
| ≤75% | 0.60% | 0.70% | 0.65% | 0.65% | 0.65% | 0.70% | Override |

### Fixed Bridging Rates (Monthly)

| LTV Tier | Resi Single | Resi Large | Resi Portfolio | Dev Exit | Commercial | Commercial Large | 2nd Charge |
|----------|-------------|------------|----------------|----------|------------|------------------|------------|
| ≤60% | 0.75% | 0.85% | 0.80% | 0.80% | 0.80% | 0.85% | 0.80% |
| ≤70% | 0.85% | 0.95% | 0.90% | 0.90% | 0.90% | 0.95% | 0.90% |
| ≤75% | 0.95% | 1.05% | 1.00% | 1.00% | 1.00% | 1.05% | Override |

### Max LTV by Type

| Property Type | Max LTV (1st Charge) | Max LTV (2nd Charge) |
|---------------|---------------------|---------------------|
| Residential | 75% | 70% |
| Commercial | 70% | 65% |
| Semi-Commercial | 70% | 65% |

---

## 5. User Interface Design

### Multi-Property Table (Expanded View)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MULTI-PROPERTY DETAILS                                              [▼ Collapse]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ # │ Address      │ Type        │ Value     │ Charge │ LTV  │ Var  │ Fixed │    │
│  ├───┼──────────────┼─────────────┼───────────┼────────┼──────┼──────┼───────┤    │
│  │ 1 │ 123 High St  │ Residential │ £500,000  │ 1st    │ 70%  │0.50% │ 0.85% │    │
│  │ 2 │ 456 Oak Lane │ Commercial  │ £900,000  │ 1st    │ 60%  │0.45% │ 0.80% │    │
│  │ 3 │ 789 Elm Road │ Residential │ £600,000  │ 2nd    │ 60%  │0.45% │ 0.80% │    │
│  └───┴──────────────┴─────────────┴───────────┴────────┴──────┴──────┴───────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ TOTALS                                                                       │    │
│  │ Total Property Value:  £2,000,000                                           │    │
│  │ Total Gross Loan:      £1,310,000                                           │    │
│  │ Blended LTV:           65.5%                                                │    │
│  │ Blended Variable Rate: 0.47%                                                │    │
│  │ Blended Fixed Rate:    0.82%                                                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ⚠️ Mixed Portfolio: Residential (55%) + Commercial (45%)                           │
│  ⚠️ Mixed Charges: 1st Charge (70%) + 2nd Charge (30%)                              │
│                                                                                      │
│  [+ Add Property]  [Use Total Values]  [Use Blended Variable]  [Use Blended Fixed]  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Button Actions

| Button | Action |
|--------|--------|
| **Add Property** | Add new row to property table |
| **Use Total Values** | Push total Property Value, Gross Loan, First Charge to Loan Details |
| **Use Blended Variable** | Apply blended variable rate to Variable Bridge column in Results |
| **Use Blended Fixed** | Apply blended fixed rate to Fixed Bridge column in Results |

---

## 6. Business Rules

### Rule 1: Weight Calculation
- Weight = Property Value ÷ Total Portfolio Value
- Weight determines contribution to blended rate

### Rule 2: LTV Tier Selection
| LTV Range | Tier Used |
|-----------|-----------|
| 0% - 60% | 60% tier rates |
| 61% - 70% | 70% tier rates |
| 71% - 75% | 75% tier rates |
| > 75% | Error - exceeds max LTV |

### Rule 3: Rate Column Selection Priority
1. If Charge = "2nd Charge" → Use 2nd Charge column (J)
2. Else use Property Type column:
   - Residential → Column C (single) or D (large loan) or E (portfolio)
   - Commercial → Column H (standard) or I (large loan)
   - Semi-Commercial → Column H

### Rule 4: Large Loan Threshold
- Residential: > £4,000,000 per property
- Commercial: > £3,000,000 per property

### Rule 5: Max LTV Enforcement
- System should warn if any property exceeds max LTV for its type
- 2nd Charge properties have lower max LTV than 1st Charge

---

## 7. Data Fields

### Per-Property Fields (Required)

| Field | Type | Description |
|-------|------|-------------|
| Property Address | Text | Full property address |
| Property Type | Dropdown | Residential / Commercial / Semi-Commercial |
| Property Value | Currency | Market value of property |
| Charge Type | Dropdown | First Charge / Second Charge |
| First Charge Amount | Currency | Only for 2nd charge - existing 1st charge balance |

### Per-Property Fields (Auto-Calculated)

| Field | Calculation |
|-------|-------------|
| Gross Loan | Based on max LTV for type |
| LTV % | Gross Loan ÷ Property Value |
| Weight % | Property Value ÷ Total Value |
| Variable Rate | Lookup from rate table |
| Fixed Rate | Lookup from rate table |
| Variable Contribution | Weight × Variable Rate |
| Fixed Contribution | Weight × Fixed Rate |

### Optional Extended Fields (Phase 2)

| Field | Type | Purpose |
|-------|------|---------|
| Postcode | Text | For postcode lookup integration |
| Title Number | Text | Land Registry reference |
| Proprietor | Text | Property owner name |
| Purchase Date | Date | When property was acquired |
| Purchase Price | Currency | Original purchase price |
| Current Lender | Text | Existing lender name |
| To Be Discharged | Yes/No | Auto-calculated for 1st charges |

---

## 8. Integration Points

### Input to Calculator
| Multi-Property Field | → Calculator Field |
|---------------------|-------------------|
| Total Property Value | Property Value in Loan Details |
| Total Gross Loan | Gross Loan in Loan Details |
| Total 2nd Charge Outstanding | First Charge Value in Loan Details |
| Blended Variable Rate | Rate Override for Variable Bridge column |
| Blended Fixed Rate | Rate Override for Fixed Bridge column |

### Output to Documents
| Field | Quote PDF | DIP PDF |
|-------|-----------|---------|
| Property List | ✓ (summary) | ✓ (full details) |
| Blended Rate | ✓ | ✓ |
| Per-Property LTV | - | ✓ |
| Total Portfolio Value | ✓ | ✓ |

---

## 9. Edge Cases & Validation

### Validation Rules

| Rule | Error Message |
|------|---------------|
| Property Value ≤ 0 | "Property value must be greater than zero" |
| LTV > Max for type | "LTV of X% exceeds maximum Y% for [Type]" |
| No properties entered | "At least one property is required" |
| Negative First Charge | "First charge amount cannot be negative" |
| 1st charge with First Charge Amount | "First charge properties should not have existing charge" |

### Edge Cases

| Case | Handling |
|------|----------|
| Single property | Calculate as normal, no blending needed |
| All same LTV tier | Blended rate = tier rate (no variation) |
| 2nd charge at 75% LTV | Show warning - may require rate override |
| Property Value = 0 | Exclude from weight calculation |
| Duplicate properties | Allow - user may have multiple units at same address |

---

## 10. Implementation Phases

### Phase 1: Core Functionality (MVP)
- Unhide existing Multi-Property section
- Add LTV and Rate columns to table
- Implement blended rate calculation
- Add "Use Blended Rate" buttons
- Basic validation

**Estimated Effort:** 8-10 hours

### Phase 2: Extended Fields
- Add Postcode, Title Number, Proprietor fields
- Split Property Value into Client/Actual
- Add Purchase Date and Price
- Current Lender field

**Estimated Effort:** 4-5 hours

### Phase 3: Database & Persistence
- Update database schema for new fields
- Save/load multi-property data with quotes
- Migration script for existing quotes

**Estimated Effort:** 3-4 hours

### Phase 4: PDF Integration
- Update Quote PDF to show property list
- Update DIP PDF with full property details
- Per-property rate breakdown

**Estimated Effort:** 4-5 hours

### Phase 5: Advanced Features
- Postcode lookup integration
- Large loan auto-detection
- Rate override warnings
- Export to Excel

**Estimated Effort:** 6-8 hours

---

## 11. Questions for Business

1. **Rate Override for 75% LTV 2nd Charge** - The Excel shows "Use Rate Override" for this scenario. What rate should be used as default?

2. **Large Loan Thresholds** - Should we auto-detect large loans and switch rate columns, or should this be manual?

3. **Fusion Product** - Should blended rates also calculate for Fusion column, or only Variable/Fixed Bridge?

4. **Property Count Limit** - Is there a maximum number of properties per portfolio deal?

5. **PDF Detail Level** - How much property detail should appear on Quote PDF vs DIP PDF?

6. **Historical Rates** - If a quote is loaded from a past date, should we use historical rates or current rates for recalculation?

---

## 12. Approval Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Business Analyst | | | |
| Compliance | | | |
| Development Lead | | | |

---

**Document End**
