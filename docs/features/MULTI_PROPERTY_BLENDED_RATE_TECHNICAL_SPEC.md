# Multi-Property Blended Rate - Technical Implementation Guide

## Technical Specification Document

**Version:** 1.0  
**Date:** 26 January 2026  
**Status:** Ready for Implementation (Pending Business Approval)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow Diagram](#2-data-flow-diagram)
3. [Component Structure](#3-component-structure)
4. [Rate Lookup Implementation](#4-rate-lookup-implementation)
5. [Blended Rate Calculation](#5-blended-rate-calculation)
6. [Database Schema Changes](#6-database-schema-changes)
7. [UI Component Updates](#7-ui-component-updates)
8. [Integration with Results Table](#8-integration-with-results-table)
9. [Testing Scenarios](#9-testing-scenarios)
10. [File Change Summary](#10-file-change-summary)

---

## 1. Architecture Overview

### Current Architecture

```
BridgingCalculator.jsx
  ├── BridgingProductSection (criteria questions)
  ├── ClientDetailsSection
  ├── MultiPropertyDetailsSection (HIDDEN - basic fields only)
  ├── LoanDetailsSection
  └── Results Table
```

### Proposed Architecture

```
BridgingCalculator.jsx
  ├── BridgingProductSection (criteria questions)
  ├── ClientDetailsSection
  ├── MultiPropertyDetailsSection (ENHANCED)
  │     ├── PropertyTable
  │     │     ├── Per-property rows with all fields
  │     │     ├── Calculated columns (LTV, Weight, Rates)
  │     │     └── Totals row
  │     ├── BlendedRateSummary
  │     │     ├── Mixed portfolio warnings
  │     │     └── Blended rate display
  │     └── ActionButtons
  │           ├── Add Property
  │           ├── Use Total Values
  │           ├── Use Blended Variable
  │           └── Use Blended Fixed
  ├── LoanDetailsSection
  └── Results Table (with rate override support)
```

---

## 2. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Property 1: Address, Type, Value, Charge, First Charge Amount   │    │
│  │ Property 2: Address, Type, Value, Charge, First Charge Amount   │    │
│  │ Property N: ...                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PER-PROPERTY CALCULATIONS                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ For each property:                                               │    │
│  │   1. Calculate Gross Loan = Value × MaxLTV(type, charge)        │    │
│  │   2. Calculate LTV = GrossLoan / Value                          │    │
│  │   3. Determine Rate Column (type + charge)                       │    │
│  │   4. Lookup Variable Rate (column, LTV tier)                     │    │
│  │   5. Lookup Fixed Rate (column, LTV tier)                        │    │
│  │   6. Calculate Weight = Value / TotalValue                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLENDED RATE CALCULATION                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ BlendedVariable = Σ (Weight_i × VariableRate_i)                 │    │
│  │ BlendedFixed = Σ (Weight_i × FixedRate_i)                       │    │
│  │ BlendedLTV = Σ (Weight_i × LTV_i)                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Display:                                                         │    │
│  │   - Per-property table with rates                               │    │
│  │   - Totals and blended rates                                    │    │
│  │   - Mixed portfolio warnings                                     │    │
│  │                                                                  │    │
│  │ Push to Calculator:                                              │    │
│  │   - Total Property Value → Loan Details                         │    │
│  │   - Total Gross Loan → Loan Details                             │    │
│  │   - Blended Variable → Results Rate Override                     │    │
│  │   - Blended Fixed → Results Rate Override                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Structure

### 3.1 MultiPropertyDetailsSection.jsx (Enhanced)

```jsx
// Props interface
{
  expanded: boolean,
  onToggle: () => void,
  rows: PropertyRow[],
  onRowChange: (id, field, value) => void,
  onAddRow: () => void,
  onDeleteRow: (id) => void,
  totals: PropertyTotals,
  blendedRates: BlendedRates,
  rateTable: RateTable,
  onUseTotalValues: (totals) => void,
  onUseBlendedVariable: (rate) => void,
  onUseBlendedFixed: (rate) => void,
  isReadOnly: boolean,
}

// PropertyRow interface
{
  id: number,
  property_address: string,
  property_type: 'Residential' | 'Commercial' | 'Semi-Commercial',
  property_value: number,
  charge_type: 'First charge' | 'Second charge',
  first_charge_amount: number,
  // Calculated fields
  gross_loan: number,
  ltv: number,
  weight: number,
  variable_rate: number,
  fixed_rate: number,
  variable_contribution: number,
  fixed_contribution: number,
}

// BlendedRates interface
{
  blendedVariable: number,
  blendedFixed: number,
  blendedLtv: number,
  hasSecondCharge: boolean,
  hasMixedPropertyTypes: boolean,
  propertyTypeBreakdown: { [type: string]: number },  // percentage by type
  chargeTypeBreakdown: { [charge: string]: number },  // percentage by charge
}
```

### 3.2 New Utility: blendedRateCalculator.js

```javascript
// Location: frontend/src/utils/calculator/blendedRateCalculator.js

/**
 * Rate table structure from database
 */
const RATE_COLUMNS = {
  'Residential': {
    'First charge': { column: 'resi_btl_single', maxLtv: 0.75 },
    'Second charge': { column: '2nd_charge', maxLtv: 0.70 },
  },
  'Commercial': {
    'First charge': { column: 'semi_full_commercial', maxLtv: 0.70 },
    'Second charge': { column: '2nd_charge', maxLtv: 0.65 },
  },
  'Semi-Commercial': {
    'First charge': { column: 'semi_full_commercial', maxLtv: 0.70 },
    'Second charge': { column: '2nd_charge', maxLtv: 0.65 },
  },
};

const LTV_TIERS = [
  { max: 0.60, tier: '60' },
  { max: 0.70, tier: '70' },
  { max: 0.75, tier: '75' },
];

/**
 * Get the LTV tier for a given LTV value
 */
export const getLtvTier = (ltv) => {
  for (const { max, tier } of LTV_TIERS) {
    if (ltv <= max) return tier;
  }
  return '75'; // Default to highest tier
};

/**
 * Get the rate column configuration for a property
 */
export const getRateColumn = (propertyType, chargeType) => {
  return RATE_COLUMNS[propertyType]?.[chargeType] || RATE_COLUMNS['Residential']['First charge'];
};

/**
 * Get max LTV for a property type and charge type
 */
export const getMaxLtv = (propertyType, chargeType) => {
  return getRateColumn(propertyType, chargeType).maxLtv;
};

/**
 * Calculate gross loan based on property value and max LTV
 */
export const calculateGrossLoan = (propertyValue, propertyType, chargeType, firstChargeAmount = 0) => {
  const maxLtv = getMaxLtv(propertyType, chargeType);
  const maxGross = propertyValue * maxLtv;
  // For 2nd charge, subtract existing 1st charge
  const grossLoan = chargeType === 'Second charge' 
    ? Math.max(0, maxGross - firstChargeAmount)
    : maxGross;
  return grossLoan;
};

/**
 * Look up rate from rate table
 * @param {string} rateType - 'variable' or 'fixed'
 * @param {string} column - Rate column name from getRateColumn
 * @param {string} ltvTier - '60', '70', or '75'
 * @param {Array} rateTable - Rate data from database
 */
export const lookupRate = (rateType, column, ltvTier, rateTable) => {
  // Find matching rate in table
  const rate = rateTable.find(r => 
    r.rate_type?.toLowerCase() === rateType.toLowerCase() &&
    r.property_type?.toLowerCase().includes(column.replace(/_/g, ' ')) &&
    r.ltv_tier === ltvTier
  );
  return rate?.rate_value || 0;
};

/**
 * Calculate per-property rates and contributions
 */
export const calculatePropertyRates = (property, totalValue, rateTable) => {
  const { property_value, property_type, charge_type, gross_loan } = property;
  
  // Skip if no value
  if (!property_value || property_value <= 0) {
    return {
      ltv: 0,
      weight: 0,
      variable_rate: 0,
      fixed_rate: 0,
      variable_contribution: 0,
      fixed_contribution: 0,
    };
  }
  
  // Calculate LTV
  const ltv = gross_loan / property_value;
  const ltvTier = getLtvTier(ltv);
  
  // Get rate column
  const { column } = getRateColumn(property_type, charge_type);
  
  // Look up rates
  const variable_rate = lookupRate('variable', column, ltvTier, rateTable);
  const fixed_rate = lookupRate('fixed', column, ltvTier, rateTable);
  
  // Calculate weight
  const weight = property_value / totalValue;
  
  // Calculate contributions
  const variable_contribution = weight * variable_rate;
  const fixed_contribution = weight * fixed_rate;
  
  return {
    ltv,
    weight,
    variable_rate,
    fixed_rate,
    variable_contribution,
    fixed_contribution,
  };
};

/**
 * Calculate blended rates for entire portfolio
 */
export const calculateBlendedRates = (properties, rateTable) => {
  // Calculate total value
  const totalValue = properties.reduce((sum, p) => sum + (p.property_value || 0), 0);
  
  if (totalValue <= 0) {
    return {
      blendedVariable: 0,
      blendedFixed: 0,
      blendedLtv: 0,
      hasSecondCharge: false,
      hasMixedPropertyTypes: false,
      propertyTypeBreakdown: {},
      chargeTypeBreakdown: {},
      propertiesWithRates: [],
    };
  }
  
  // Calculate rates for each property
  const propertiesWithRates = properties.map(property => {
    const rates = calculatePropertyRates(property, totalValue, rateTable);
    return { ...property, ...rates };
  });
  
  // Sum contributions for blended rates
  const blendedVariable = propertiesWithRates.reduce((sum, p) => sum + p.variable_contribution, 0);
  const blendedFixed = propertiesWithRates.reduce((sum, p) => sum + p.fixed_contribution, 0);
  const blendedLtv = propertiesWithRates.reduce((sum, p) => sum + (p.weight * p.ltv), 0);
  
  // Analyze portfolio composition
  const propertyTypes = new Set(properties.map(p => p.property_type).filter(Boolean));
  const hasSecondCharge = properties.some(p => p.charge_type === 'Second charge');
  const hasMixedPropertyTypes = propertyTypes.size > 1;
  
  // Calculate breakdowns
  const propertyTypeBreakdown = {};
  const chargeTypeBreakdown = {};
  
  propertiesWithRates.forEach(p => {
    if (p.property_type) {
      propertyTypeBreakdown[p.property_type] = (propertyTypeBreakdown[p.property_type] || 0) + p.weight;
    }
    if (p.charge_type) {
      chargeTypeBreakdown[p.charge_type] = (chargeTypeBreakdown[p.charge_type] || 0) + p.weight;
    }
  });
  
  return {
    blendedVariable,
    blendedFixed,
    blendedLtv,
    hasSecondCharge,
    hasMixedPropertyTypes,
    propertyTypeBreakdown,
    chargeTypeBreakdown,
    propertiesWithRates,
  };
};
```

---

## 4. Rate Lookup Implementation

### 4.1 Rate Table Query

```javascript
// Fetch rate table for multi-property calculations
const fetchRateTable = async (supabase) => {
  const { data, error } = await supabase
    .from('bridge_fusion_rates')
    .select('*')
    .eq('status', 'Active')
    .in('product_type', ['Variable Bridging', 'Fixed Bridging']);
  
  if (error) throw error;
  return data;
};
```

### 4.2 Rate Column Mapping

```javascript
// Map property type and charge type to rate table columns
const COLUMN_MAPPING = {
  // Property Type → Rate Table property_type values
  'Residential': [
    'Resi BTL single unit',
    'Resi Large Loan',  // If loan > 4M
    'Resi Portfolio',   // If multi-property deal
  ],
  'Commercial': [
    'Semi & Full Commercial',
    'Semi & Full Commercial Large Loan',  // If loan > 3M
  ],
  'Semi-Commercial': [
    'Semi & Full Commercial',
  ],
  // 2nd Charge overrides property type
  '2nd Charge': [
    '2nd charge',
  ],
};

// LTV tier mapping
const LTV_TO_TIER = {
  '60': { min: 0, max: 0.60 },
  '70': { min: 0.60, max: 0.70 },
  '75': { min: 0.70, max: 0.75 },
};
```

---

## 5. Blended Rate Calculation

### 5.1 Core Algorithm

```javascript
/**
 * Master calculation function
 * Called whenever property data changes
 */
const recalculatePortfolio = (properties, rateTable) => {
  // Step 1: Calculate totals
  const totals = {
    property_value: 0,
    gross_loan: 0,
    first_charge_amount: 0,
  };
  
  properties.forEach(p => {
    totals.property_value += p.property_value || 0;
    totals.gross_loan += p.gross_loan || 0;
    totals.first_charge_amount += p.first_charge_amount || 0;
  });
  
  // Step 2: Calculate per-property rates with weights
  const blendedResults = calculateBlendedRates(properties, rateTable);
  
  // Step 3: Validate portfolio
  const warnings = validatePortfolio(blendedResults.propertiesWithRates);
  
  return {
    totals,
    blendedRates: blendedResults,
    warnings,
  };
};

/**
 * Validate portfolio for business rules
 */
const validatePortfolio = (properties) => {
  const warnings = [];
  
  properties.forEach((p, idx) => {
    // Check LTV exceeds max
    const maxLtv = getMaxLtv(p.property_type, p.charge_type);
    if (p.ltv > maxLtv) {
      warnings.push({
        type: 'error',
        property: idx + 1,
        message: `Property ${idx + 1}: LTV ${(p.ltv * 100).toFixed(1)}% exceeds maximum ${(maxLtv * 100).toFixed(0)}% for ${p.property_type} ${p.charge_type}`,
      });
    }
    
    // Check 2nd charge at 75% LTV (requires override)
    if (p.charge_type === 'Second charge' && p.ltv > 0.70) {
      warnings.push({
        type: 'warning',
        property: idx + 1,
        message: `Property ${idx + 1}: 2nd charge at ${(p.ltv * 100).toFixed(1)}% LTV may require rate override`,
      });
    }
  });
  
  return warnings;
};
```

### 5.2 Integration with BridgingCalculator.jsx

```javascript
// Add to BridgingCalculator.jsx

// State for blended rates
const [blendedRates, setBlendedRates] = useState(null);
const [portfolioWarnings, setPortfolioWarnings] = useState([]);

// Recalculate when properties change
useEffect(() => {
  if (isMultiProperty && multiPropertyRows.length > 0 && rates.length > 0) {
    const { totals, blendedRates, warnings } = recalculatePortfolio(multiPropertyRows, rates);
    setBlendedRates(blendedRates);
    setPortfolioWarnings(warnings);
  }
}, [isMultiProperty, multiPropertyRows, rates]);

// Handler for "Use Blended Variable" button
const handleUseBlendedVariable = () => {
  if (blendedRates?.blendedVariable) {
    const rateStr = `${(blendedRates.blendedVariable * 100).toFixed(2)}%`;
    setRatesOverrides(prev => ({
      ...prev,
      'Variable Bridge': rateStr,
    }));
    showToast('success', `Applied blended variable rate: ${rateStr}`);
  }
};

// Handler for "Use Blended Fixed" button
const handleUseBlendedFixed = () => {
  if (blendedRates?.blendedFixed) {
    const rateStr = `${(blendedRates.blendedFixed * 100).toFixed(2)}%`;
    setRatesOverrides(prev => ({
      ...prev,
      'Fixed Bridge': rateStr,
    }));
    showToast('success', `Applied blended fixed rate: ${rateStr}`);
  }
};

// Handler for "Use Total Values" button
const handleUseTotalValues = () => {
  setPropertyValue(formatCurrencyInput(multiPropertyTotals.property_value));
  setGrossLoan(formatCurrencyInput(multiPropertyTotals.gross_loan));
  setFirstChargeValue(formatCurrencyInput(multiPropertyTotals.first_charge_amount));
  showToast('success', 'Applied total portfolio values to Loan Details');
};
```

---

## 6. Database Schema Changes

### 6.1 Migration: Update bridge_multi_property_details

```sql
-- Migration: 030_update_bridge_multi_property_details.sql

-- Add new columns for rate calculation
ALTER TABLE bridge_multi_property_details
ADD COLUMN IF NOT EXISTS ltv NUMERIC(5, 4),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 4),
ADD COLUMN IF NOT EXISTS variable_rate NUMERIC(6, 4),
ADD COLUMN IF NOT EXISTS fixed_rate NUMERIC(6, 4);

-- Add optional extended fields (Phase 2)
ALTER TABLE bridge_multi_property_details
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS title_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS proprietor VARCHAR(255),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS current_lender VARCHAR(255);

-- Add blended rate columns to bridge_quotes
ALTER TABLE bridge_quotes
ADD COLUMN IF NOT EXISTS is_multi_property BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blended_variable_rate NUMERIC(6, 4),
ADD COLUMN IF NOT EXISTS blended_fixed_rate NUMERIC(6, 4),
ADD COLUMN IF NOT EXISTS blended_ltv NUMERIC(5, 4);

-- Add index for multi-property queries
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_multi_property 
ON bridge_quotes(is_multi_property) WHERE is_multi_property = TRUE;

COMMENT ON COLUMN bridge_multi_property_details.ltv IS 'Calculated LTV for this property';
COMMENT ON COLUMN bridge_multi_property_details.weight IS 'Weight of this property in portfolio (value / total)';
COMMENT ON COLUMN bridge_multi_property_details.variable_rate IS 'Variable rate for this property based on LTV and type';
COMMENT ON COLUMN bridge_multi_property_details.fixed_rate IS 'Fixed rate for this property based on LTV and type';
```

---

## 7. UI Component Updates

### 7.1 Enhanced MultiPropertyDetailsSection.jsx

```jsx
// Key changes to MultiPropertyDetailsSection.jsx

// Remove the hidden wrapper div
// OLD: <div className="multi-property-details-hidden">
// NEW: Remove this wrapper entirely

// Add new columns to table header
<thead>
  <tr>
    <th>Address</th>
    <th>Type</th>
    <th>Value</th>
    <th>Charge</th>
    <th>1st Charge Amt</th>
    <th>Gross Loan</th>
    <th>LTV</th>
    <th>Weight</th>
    <th>Variable</th>
    <th>Fixed</th>
    <th>Actions</th>
  </tr>
</thead>

// Add calculated columns to each row
<td className="text-align-right font-monospace">
  {(row.ltv * 100).toFixed(1)}%
</td>
<td className="text-align-right font-monospace">
  {(row.weight * 100).toFixed(1)}%
</td>
<td className="text-align-right font-monospace">
  {(row.variable_rate * 100).toFixed(2)}%
</td>
<td className="text-align-right font-monospace">
  {(row.fixed_rate * 100).toFixed(2)}%
</td>

// Add blended rate summary section
{blendedRates && (
  <div className="blended-rate-summary">
    <div className="summary-grid">
      <div className="summary-item">
        <label>Blended Variable Rate</label>
        <span className="rate-value">
          {(blendedRates.blendedVariable * 100).toFixed(2)}%
        </span>
      </div>
      <div className="summary-item">
        <label>Blended Fixed Rate</label>
        <span className="rate-value">
          {(blendedRates.blendedFixed * 100).toFixed(2)}%
        </span>
      </div>
      <div className="summary-item">
        <label>Blended LTV</label>
        <span className="rate-value">
          {(blendedRates.blendedLtv * 100).toFixed(1)}%
        </span>
      </div>
    </div>
    
    {/* Portfolio warnings */}
    {blendedRates.hasMixedPropertyTypes && (
      <div className="portfolio-warning">
        ⚠️ Mixed Portfolio: {Object.entries(blendedRates.propertyTypeBreakdown)
          .map(([type, pct]) => `${type} (${(pct * 100).toFixed(0)}%)`)
          .join(' + ')}
      </div>
    )}
    
    {blendedRates.hasSecondCharge && (
      <div className="portfolio-warning">
        ⚠️ Mixed Charges: {Object.entries(blendedRates.chargeTypeBreakdown)
          .map(([charge, pct]) => `${charge} (${(pct * 100).toFixed(0)}%)`)
          .join(' + ')}
      </div>
    )}
  </div>
)}

// Add action buttons
<div className="action-buttons">
  <button onClick={onAddRow}>+ Add Property</button>
  <button onClick={() => onUseTotalValues(totals)}>Use Total Values</button>
  <button onClick={() => onUseBlendedVariable(blendedRates?.blendedVariable)}>
    Use Blended Variable
  </button>
  <button onClick={() => onUseBlendedFixed(blendedRates?.blendedFixed)}>
    Use Blended Fixed
  </button>
</div>
```

### 7.2 CSS Styles

```scss
// Add to Calculator.scss

.blended-rate-summary {
  margin-top: var(--token-spacing-medium);
  padding: var(--token-spacing-medium);
  background-color: var(--token-layer-surface-alt);
  border-radius: var(--token-border-radius-medium);
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--token-spacing-medium);
  }
  
  .summary-item {
    text-align: center;
    
    label {
      display: block;
      font-size: var(--token-font-size-small);
      color: var(--token-text-secondary);
      margin-bottom: var(--token-spacing-xsmall);
    }
    
    .rate-value {
      font-size: var(--token-font-size-xlarge);
      font-weight: var(--token-font-weight-bold);
      color: var(--token-text-primary);
      font-family: var(--token-font-family-mono);
    }
  }
  
  .portfolio-warning {
    margin-top: var(--token-spacing-small);
    padding: var(--token-spacing-small);
    background-color: var(--token-status-warning-background);
    color: var(--token-status-warning-text);
    border-radius: var(--token-border-radius-small);
    font-size: var(--token-font-size-small);
  }
}

.action-buttons {
  display: flex;
  gap: var(--token-spacing-small);
  margin-top: var(--token-spacing-medium);
  flex-wrap: wrap;
}
```

---

## 8. Integration with Results Table

### 8.1 Rate Override Flow

```javascript
// When blended rate is applied, it sets a rate override
// The Results table already supports rate overrides via ratesOverrides state

// This connects to the existing EditableResultRow component
// which displays the rate and allows editing

// The blended rate becomes the "applied" rate that overrides
// the default single-LTV rate lookup
```

### 8.2 Indicator in Results

```jsx
// Add indicator when using blended rate
{ratesOverrides['Variable Bridge'] && isMultiProperty && (
  <span className="rate-source-indicator" title="Using blended rate from multi-property portfolio">
    📊 Blended
  </span>
)}
```

---

## 9. Testing Scenarios

### 9.1 Unit Tests

```javascript
// tests/blendedRateCalculator.test.js

describe('Blended Rate Calculator', () => {
  describe('getLtvTier', () => {
    test('returns 60 for LTV <= 60%', () => {
      expect(getLtvTier(0.55)).toBe('60');
      expect(getLtvTier(0.60)).toBe('60');
    });
    
    test('returns 70 for LTV 61-70%', () => {
      expect(getLtvTier(0.65)).toBe('70');
      expect(getLtvTier(0.70)).toBe('70');
    });
    
    test('returns 75 for LTV 71-75%', () => {
      expect(getLtvTier(0.72)).toBe('75');
      expect(getLtvTier(0.75)).toBe('75');
    });
  });
  
  describe('calculateBlendedRates', () => {
    const mockRateTable = [
      { rate_type: 'variable', property_type: 'resi btl single unit', ltv_tier: '60', rate_value: 0.004 },
      { rate_type: 'variable', property_type: 'resi btl single unit', ltv_tier: '70', rate_value: 0.005 },
      { rate_type: 'fixed', property_type: 'resi btl single unit', ltv_tier: '60', rate_value: 0.0075 },
      { rate_type: 'fixed', property_type: 'resi btl single unit', ltv_tier: '70', rate_value: 0.0085 },
    ];
    
    test('calculates blended rate for single property', () => {
      const properties = [{
        property_value: 500000,
        property_type: 'Residential',
        charge_type: 'First charge',
        gross_loan: 350000,
      }];
      
      const result = calculateBlendedRates(properties, mockRateTable);
      expect(result.blendedVariable).toBeCloseTo(0.005); // 70% LTV tier
    });
    
    test('calculates weighted blend for multiple properties', () => {
      const properties = [
        { property_value: 500000, property_type: 'Residential', charge_type: 'First charge', gross_loan: 300000 }, // 60% LTV
        { property_value: 500000, property_type: 'Residential', charge_type: 'First charge', gross_loan: 350000 }, // 70% LTV
      ];
      
      const result = calculateBlendedRates(properties, mockRateTable);
      // Expected: (50% × 0.004) + (50% × 0.005) = 0.0045
      expect(result.blendedVariable).toBeCloseTo(0.0045);
    });
  });
});
```

### 9.2 Integration Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| IT-001 | Single residential, 1st charge, 70% LTV | Uses Resi column, 70% tier rate |
| IT-002 | Single commercial, 1st charge, 60% LTV | Uses Commercial column, 60% tier rate |
| IT-003 | Mixed resi/commercial, 1st charge | Weighted blend of both type rates |
| IT-004 | Single residential, 2nd charge, 65% LTV | Uses 2nd Charge column, 70% tier rate |
| IT-005 | Mixed 1st/2nd charge | Weighted blend with 2nd charge using J column |
| IT-006 | All properties same LTV | Blended rate equals tier rate |
| IT-007 | Property exceeds max LTV | Warning displayed, calculation continues |
| IT-008 | Empty property value | Property excluded from calculation |
| IT-009 | Push blended variable | Variable Bridge column updated |
| IT-010 | Push blended fixed | Fixed Bridge column updated |

---

## 10. File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/utils/calculator/blendedRateCalculator.js` | Core calculation logic |
| `database/migrations/030_update_bridge_multi_property_details.sql` | Schema updates |
| `frontend/src/__tests__/blendedRateCalculator.test.js` | Unit tests |

### Modified Files

| File | Changes |
|------|---------|
| `frontend/src/components/calculator/bridging/MultiPropertyDetailsSection.jsx` | Add columns, blended rate display, action buttons |
| `frontend/src/components/calculators/BridgingCalculator.jsx` | Add blended rate state, handlers, integration |
| `frontend/src/styles/Calculator.scss` | Add blended rate styling |
| `backend/routes/quotes.js` | Save/load blended rate fields |

### Estimated Lines of Code

| Component | Lines |
|-----------|-------|
| blendedRateCalculator.js | ~250 |
| MultiPropertyDetailsSection updates | ~150 |
| BridgingCalculator updates | ~80 |
| CSS updates | ~60 |
| Migration | ~25 |
| Tests | ~150 |
| **Total** | **~715** |

---

## Implementation Checklist

- [ ] Create `blendedRateCalculator.js` utility
- [ ] Write unit tests for calculation logic
- [ ] Update `MultiPropertyDetailsSection.jsx` UI
- [ ] Add blended rate state to `BridgingCalculator.jsx`
- [ ] Implement rate lookup from existing rate table
- [ ] Add "Use Blended Rate" button handlers
- [ ] Create database migration
- [ ] Update quote save/load to include blended rate fields
- [ ] Add CSS styling for blended rate display
- [ ] Run integration tests
- [ ] Update PDF generation (Phase 2)

---

**Document End**

**Ready for implementation upon business approval of MULTI_PROPERTY_BLENDED_RATE_BUSINESS_PLAN.md**
