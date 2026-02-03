import { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from '../CollapsibleSection';
import SalesforceIcon from '../../shared/SalesforceIcon';
import { formatCurrencyInput, parseNumber } from '../../../utils/calculator/numberFormatting';
import '../../../styles/admin-tables.css';

/**
 * MultiPropertyLoanSection - Enhanced multi-property loan management for portfolio bridging loans
 * POC Version - February 2026
 * 
 * Features:
 * - Property Type dropdown (Residential, Commercial, Semi-Commercial)
 * - Sub Product Type dropdown (based on property type)
 * - Property Address, Property Value, Charge Type
 * - 1st Charge Value (visible only when charge type is 2nd)
 * - Fixed Bridge Rate and Variable Bridge Rate (auto-populated, editable)
 * - Max LTV (editable, from rate table)
 * - Max Gross Loan (calculated: Property Value × Max LTV)
 * - Blended rate calculations with weighted averages
 */

// Property Type options (excluding Multi-Property Loan)
const PROPERTY_TYPE_OPTIONS = [
  'Residential',
  'Commercial',
  'Semi-Commercial'
];

// Sub Product options per Property Type (matching rate table `product` field)
const SUB_PRODUCT_OPTIONS = {
  'Residential': [
    'BTL Single Property Investment',
    'Large Single Property Investment',
    'BTL Portfolio Investment',
    'Developer Exit Bridge (Multiple Units)',
    'Permitted & Light Development Finance'
  ],
  'Commercial': [
    'Commercial',
    'Commercial Large Loan',
    'Developer Exit Bridge (Multiple Units)',
    'Permitted & Light Development Finance'
  ],
  'Semi-Commercial': [
    'Semi-Commercial',
    'Semi-Commercial Large Loan',
    'Developer Exit Bridge (Multiple Units)',
    'Permitted & Light Development Finance'
  ]
};

// Default Max LTV by Property Type and Charge Type
const DEFAULT_MAX_LTV = {
  'Residential': { 'First charge': 75, 'Second charge': 70 },
  'Commercial': { 'First charge': 70, 'Second charge': 65 },
  'Semi-Commercial': { 'First charge': 70, 'Second charge': 65 }
};

// Default rates (will be overridden by rate table lookup)
const DEFAULT_RATES = {
  'Residential': { fixedRate: 0.85, variableRate: 0.50 },
  'Commercial': { fixedRate: 0.90, variableRate: 0.55 },
  'Semi-Commercial': { fixedRate: 0.90, variableRate: 0.55 }
};

const MultiPropertyLoanSection = ({ 
  expanded, 
  onToggle,
  rows,
  onRowChange,
  onRowBatchChange,
  onAddRow,
  onDeleteRow,
  rates = [],
  onUseBlendedValues,
  isReadOnly = false
}) => {
  
  // Calculate Max Gross Loan for a property row
  const calculateMaxGrossLoan = useCallback((propertyValue, maxLtv, firstChargeAmount, chargeType) => {
    const pv = parseNumber(propertyValue) || 0;
    const ltv = parseNumber(maxLtv) || 0;
    const fca = chargeType === 'Second charge' ? (parseNumber(firstChargeAmount) || 0) : 0;
    
    // Max Gross Loan = (Property Value × Max LTV%) - First Charge Amount (for 2nd charge)
    const maxGrossLoan = (pv * (ltv / 100)) - fca;
    return maxGrossLoan > 0 ? maxGrossLoan : 0;
  }, []);

  // Look up rates from rate table based on property type, sub product, and LTV tier
  const lookupRates = useCallback((propertyType, subProduct, ltv, chargeType) => {
    // Default fallback
    let fixedRate = DEFAULT_RATES[propertyType]?.fixedRate || 0.85;
    let variableRate = DEFAULT_RATES[propertyType]?.variableRate || 0.50;
    let maxLtv = DEFAULT_MAX_LTV[propertyType]?.[chargeType] || 70;
    
    if (!rates || rates.length === 0) {
      return { fixedRate, variableRate, maxLtv };
    }
    
    // Determine LTV value for filtering
    const ltvValue = parseNumber(ltv) || 0;
    
    // Normalize strings for comparison
    const normalizeStr = (s) => (s || '').toString().toLowerCase().trim();
    const propertyNorm = normalizeStr(propertyType);
    const subProductNorm = normalizeStr(subProduct);
    
    // Filter rates by property type, sub-product (product field), and charge type
    // Then find rates where LTV falls within the min_ltv to max_ltv range
    const matchingRates = rates.filter(r => {
      const rateProperty = normalizeStr(r.property || r.property_type);
      const rateProduct = normalizeStr(r.product || r.subproduct || r.sub_product);
      const rateChargeType = normalizeStr(r.charge_type);
      const rateMinLtv = parseNumber(r.min_ltv) || 0;
      const rateMaxLtv = parseNumber(r.max_ltv) || 100;
      
      // Check if LTV falls within this rate's tier (min_ltv < ltvValue <= max_ltv)
      const ltvInRange = ltvValue > rateMinLtv && ltvValue <= rateMaxLtv;
      
      // For 2nd charge, look for second charge rates
      if (chargeType === 'Second charge') {
        const isSecondCharge = rateChargeType.includes('second') || rateProduct.includes('second charge');
        const propertyMatch = rateProperty === propertyNorm || rateProperty.includes(propertyNorm.substring(0, 4));
        return isSecondCharge && propertyMatch && ltvInRange;
      }
      
      // For 1st charge, match by property type AND sub-product (product field)
      const isFirstCharge = rateChargeType.includes('first') || !rateChargeType.includes('second');
      const propertyMatch = rateProperty === propertyNorm || rateProperty.includes(propertyNorm.substring(0, 4));
      const productMatch = subProductNorm && rateProduct === subProductNorm;
      
      return isFirstCharge && propertyMatch && productMatch && ltvInRange;
    });
    
    if (matchingRates.length > 0) {
      // Find Fixed Bridge rate - prefer exact LTV tier match
      const fixedRates = matchingRates.filter(r => {
        const type = normalizeStr(r.type || r.rate_type || r.set_key);
        return type.includes('fixed') && !type.includes('fusion');
      });
      
      if (fixedRates.length > 0) {
        // Sort by max_ltv ascending to get the tightest matching tier
        fixedRates.sort((a, b) => (parseNumber(a.max_ltv) || 0) - (parseNumber(b.max_ltv) || 0));
        const fixedMatch = fixedRates[0];
        fixedRate = parseNumber(fixedMatch.rate) || fixedRate;
        maxLtv = parseNumber(fixedMatch.max_ltv) || maxLtv;
      }
      
      // Find Variable Bridge rate - prefer exact LTV tier match
      const variableRates = matchingRates.filter(r => {
        const type = normalizeStr(r.type || r.rate_type || r.set_key);
        return type.includes('variable') && !type.includes('fusion');
      });
      
      if (variableRates.length > 0) {
        // Sort by max_ltv ascending to get the tightest matching tier
        variableRates.sort((a, b) => (parseNumber(a.max_ltv) || 0) - (parseNumber(b.max_ltv) || 0));
        const variableMatch = variableRates[0];
        variableRate = parseNumber(variableMatch.rate) || variableRate;
      }
    }
    
    return { fixedRate, variableRate, maxLtv };
  }, [rates]);

  // Handle row field change with auto-calculations
  const handleFieldChange = useCallback((id, field, value) => {
    // Find the current row to get context for calculations
    const currentRow = rows.find(r => r.id === id);
    if (!currentRow) {
      onRowChange(id, field, value);
      return;
    }
    
    // Create updated row with new value
    const updatedRow = { ...currentRow, [field]: value };
    
    // Batch updates object - we'll collect all changes and apply at once
    const updates = { [field]: value };
    
    // Auto-update dependent fields
    if (field === 'property_type') {
      // Update sub-product options and reset sub-product
      const newSubProducts = SUB_PRODUCT_OPTIONS[value] || [];
      updates.sub_product = newSubProducts[0] || '';
      
      // Reset charge type to First charge if switching away from Residential (2nd charge only for Resi)
      if (value !== 'Residential' && currentRow.charge_type === 'Second charge') {
        updates.charge_type = 'First charge';
        updates.first_charge_amount = '';
      }
      
      // Update max LTV based on new property type and current charge type
      const chargeType = value !== 'Residential' ? 'First charge' : (updates.charge_type || updatedRow.charge_type);
      const defaultLtv = DEFAULT_MAX_LTV[value]?.[chargeType] || 70;
      updates.max_ltv = defaultLtv;
      
      // Lookup and update rates
      const { fixedRate, variableRate } = lookupRates(value, updates.sub_product, defaultLtv, chargeType);
      updates.fixed_rate = fixedRate;
      updates.variable_rate = variableRate;
    }
    
    if (field === 'sub_product') {
      // Lookup and update rates when sub product changes
      const { fixedRate, variableRate } = lookupRates(updatedRow.property_type, value, updatedRow.max_ltv, updatedRow.charge_type);
      updates.fixed_rate = fixedRate;
      updates.variable_rate = variableRate;
    }
    
    if (field === 'charge_type') {
      // Update max LTV based on charge type
      const defaultLtv = DEFAULT_MAX_LTV[updatedRow.property_type]?.[value] || 70;
      updates.max_ltv = defaultLtv;
      
      // Auto-set sub product to "Second Charge" when 2nd charge is selected
      if (value === 'Second charge') {
        updates.sub_product = 'Second Charge';
      } else {
        // Reset to first sub product option for the property type
        const newSubProducts = SUB_PRODUCT_OPTIONS[updatedRow.property_type] || [];
        updates.sub_product = newSubProducts[0] || '';
        updates.first_charge_amount = '';
      }
      
      // Update rates based on charge type and new sub product
      const subProduct = value === 'Second charge' ? 'Second Charge' : (SUB_PRODUCT_OPTIONS[updatedRow.property_type]?.[0] || '');
      const { fixedRate, variableRate } = lookupRates(updatedRow.property_type, subProduct, defaultLtv, value);
      updates.fixed_rate = fixedRate;
      updates.variable_rate = variableRate;
    }
    
    if (field === 'max_ltv') {
      // Re-lookup rates based on new LTV tier
      const newLtv = parseNumber(value) || 0;
      const { fixedRate, variableRate } = lookupRates(updatedRow.property_type, updatedRow.sub_product, newLtv, updatedRow.charge_type);
      updates.fixed_rate = fixedRate;
      updates.variable_rate = variableRate;
    }
    
    // Apply all updates in a single batch call if we have batch support
    if (onRowBatchChange && Object.keys(updates).length > 1) {
      onRowBatchChange(id, updates);
    } else {
      // Fallback to individual updates
      Object.entries(updates).forEach(([key, val]) => {
        onRowChange(id, key, val);
      });
    }
  }, [rows, onRowChange, onRowBatchChange, lookupRates, calculateMaxGrossLoan]);

  // Calculate totals and blended rates
  const { totals, blendedRates, warnings } = useMemo(() => {
    const totals = {
      property_value: 0,
      first_charge_amount: 0,
      max_gross_loan: 0
    };
    
    let weightedFixedSum = 0;
    let weightedVariableSum = 0;
    let totalWeight = 0;
    
    const propertyTypeCounts = {};
    const chargeTypeCounts = {};
    
    rows.forEach(row => {
      const pv = parseNumber(row.property_value) || 0;
      const fca = parseNumber(row.first_charge_amount) || 0;
      const mgl = parseNumber(row.max_gross_loan) || 0;
      const fixedRate = parseNumber(row.fixed_rate) || 0;
      const variableRate = parseNumber(row.variable_rate) || 0;
      
      totals.property_value += pv;
      totals.first_charge_amount += fca;
      totals.max_gross_loan += mgl;
      
      // Calculate weight based on property value
      if (pv > 0) {
        weightedFixedSum += pv * fixedRate;
        weightedVariableSum += pv * variableRate;
        totalWeight += pv;
      }
      
      // Track property types and charge types for warnings
      if (row.property_type) {
        propertyTypeCounts[row.property_type] = (propertyTypeCounts[row.property_type] || 0) + pv;
      }
      if (row.charge_type) {
        chargeTypeCounts[row.charge_type] = (chargeTypeCounts[row.charge_type] || 0) + pv;
      }
    });
    
    // Calculate blended rates (weighted average)
    const blendedRates = {
      fixedRate: totalWeight > 0 ? weightedFixedSum / totalWeight : 0,
      variableRate: totalWeight > 0 ? weightedVariableSum / totalWeight : 0,
      blendedLtv: totals.property_value > 0 
        ? (totals.max_gross_loan / totals.property_value) * 100 
        : 0
    };
    
    // Generate warnings for mixed portfolios
    const warnings = [];
    const propTypes = Object.keys(propertyTypeCounts);
    if (propTypes.length > 1) {
      const parts = propTypes.map(t => {
        const pct = ((propertyTypeCounts[t] / totals.property_value) * 100).toFixed(0);
        return `${t} (${pct}%)`;
      });
      warnings.push(`Mixed Portfolio: ${parts.join(' + ')}`);
    }
    
    const chargeTypes = Object.keys(chargeTypeCounts);
    if (chargeTypes.length > 1) {
      const parts = chargeTypes.map(t => {
        const pct = ((chargeTypeCounts[t] / totals.property_value) * 100).toFixed(0);
        return `${t} (${pct}%)`;
      });
      warnings.push(`Mixed Charges: ${parts.join(' + ')}`);
    }
    
    return { totals, blendedRates, warnings };
  }, [rows]);

  const handleUseBlendedValues = () => {
    const hasSecondCharge = rows.some(r => r.charge_type === 'Second charge');
    onUseBlendedValues({
      totalPropertyValue: totals.property_value,
      totalFirstChargeAmount: totals.first_charge_amount,
      totalMaxGrossLoan: totals.max_gross_loan,
      blendedFixedRate: blendedRates.fixedRate,
      blendedVariableRate: blendedRates.variableRate,
      blendedLtv: blendedRates.blendedLtv,
      hasSecondCharge
    });
  };

  return (
    <CollapsibleSection 
      title="Multi-Property Loan Details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="professional-table">
          <thead>
            <tr>
              <th style={{ minWidth: '120px' }}>Property Type</th>
              <th style={{ minWidth: '110px' }}>Charge Type</th>
              <th style={{ minWidth: '180px' }}>Sub Product Type</th>
              <th style={{ minWidth: '180px' }}>Property Address</th>
              <th style={{ minWidth: '130px' }}>Property Value (£)</th>
              <th style={{ minWidth: '140px' }}>1st Charge Value (£)</th>
              <th style={{ minWidth: '100px' }}>Fixed Rate (%)</th>
              <th style={{ minWidth: '110px' }}>Variable Rate (%)</th>
              <th style={{ minWidth: '90px' }}>Max LTV (%)</th>
              <th style={{ minWidth: '140px' }}>Max Gross Loan (£)</th>
              <th style={{ minWidth: '70px' }} className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              // Get sub product options - add "Second Charge" when 2nd charge is selected
              const baseSubProducts = SUB_PRODUCT_OPTIONS[row.property_type] || [];
              const subProductOptions = row.charge_type === 'Second charge' 
                ? ['Second Charge'] 
                : baseSubProducts;
              const isSecondCharge = row.charge_type === 'Second charge';
              
              return (
                <tr key={row.id}>
                  {/* Property Type */}
                  <td>
                    <select
                      className="slds-select"
                      value={row.property_type || 'Residential'}
                      onChange={(e) => handleFieldChange(row.id, 'property_type', e.target.value)}
                      disabled={isReadOnly}
                    >
                      {PROPERTY_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Charge Type - 2nd Charge only available for Residential */}
                  <td>
                    <select
                      className="slds-select"
                      value={row.charge_type || 'First charge'}
                      onChange={(e) => handleFieldChange(row.id, 'charge_type', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="First charge">1st Charge</option>
                      {row.property_type === 'Residential' && (
                        <option value="Second charge">2nd Charge</option>
                      )}
                    </select>
                  </td>
                  
                  {/* Sub Product Type */}
                  <td>
                    <select
                      className="slds-select"
                      value={row.sub_product || ''}
                      onChange={(e) => handleFieldChange(row.id, 'sub_product', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">Please select</option>
                      {subProductOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Property Address */}
                  <td>
                    <input
                      className="slds-input"
                      type="text"
                      value={row.property_address || ''}
                      onChange={(e) => handleFieldChange(row.id, 'property_address', e.target.value)}
                      placeholder="Enter address"
                      disabled={isReadOnly}
                    />
                  </td>
                  
                  {/* Property Value */}
                  <td>
                    <input
                      className="slds-input"
                      type="text"
                      value={formatCurrencyInput(row.property_value)}
                      onChange={(e) => handleFieldChange(row.id, 'property_value', e.target.value)}
                      placeholder="£0"
                      disabled={isReadOnly}
                    />
                  </td>
                  
                  {/* 1st Charge Value (only visible for 2nd charge) */}
                  <td>
                    <input
                      className={`slds-input ${!isSecondCharge ? 'background-disabled' : ''}`}
                      type="text"
                      value={isSecondCharge ? formatCurrencyInput(row.first_charge_amount) : ''}
                      onChange={(e) => handleFieldChange(row.id, 'first_charge_amount', e.target.value)}
                      placeholder={isSecondCharge ? '£0' : 'N/A'}
                      disabled={!isSecondCharge || isReadOnly}
                    />
                  </td>
                  
                  {/* Fixed Bridge Rate */}
                  <td>
                    <input
                      className="slds-input"
                      type="number"
                      step="0.01"
                      value={row.fixed_rate || ''}
                      onChange={(e) => handleFieldChange(row.id, 'fixed_rate', e.target.value)}
                      placeholder="0.00"
                      disabled={isReadOnly}
                    />
                  </td>
                  
                  {/* Variable Bridge Rate */}
                  <td>
                    <input
                      className="slds-input"
                      type="number"
                      step="0.01"
                      value={row.variable_rate || ''}
                      onChange={(e) => handleFieldChange(row.id, 'variable_rate', e.target.value)}
                      placeholder="0.00"
                      disabled={isReadOnly}
                    />
                  </td>
                  
                  {/* Max LTV */}
                  <td>
                    <input
                      className="slds-input"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={row.max_ltv || ''}
                      onChange={(e) => handleFieldChange(row.id, 'max_ltv', e.target.value)}
                      placeholder="75"
                      disabled={isReadOnly}
                    />
                  </td>
                  
                  {/* Max Gross Loan (calculated) */}
                  <td>
                    <div className="padding-05 font-weight-600 font-monospace background-disabled border-radius-sm">
                      £{Number(row.max_gross_loan || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="sticky-action text-center">
                    <button
                      className={`slds-button slds-button_destructive ${rows.length <= 1 ? 'slds-button_disabled' : ''}`}
                      onClick={() => onDeleteRow(row.id)}
                      disabled={rows.length <= 1 || isReadOnly}
                      title="Delete property"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr style={{ background: 'var(--token-layer-hover)', fontWeight: 'var(--token-font-weight-semibold)' }}>
              <td colSpan="4" className="text-right">
                <strong>Totals:</strong>
              </td>
              <td>
                £{totals.property_value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td>
                £{totals.first_charge_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{ color: 'var(--token-success)' }}>
                {blendedRates.fixedRate.toFixed(2)}%
              </td>
              <td style={{ color: 'var(--token-success)' }}>
                {blendedRates.variableRate.toFixed(2)}%
              </td>
              <td>
                {blendedRates.blendedLtv.toFixed(1)}%
              </td>
              <td>
                £{totals.max_gross_loan.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="sticky-action"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Action Buttons */}
      <div className="margin-top-1 display-flex flex-gap-075 align-items-center flex-wrap">
        <button
          className="slds-button slds-button_neutral"
          onClick={onAddRow}
          disabled={isReadOnly}
        >
          <SalesforceIcon
            category="utility"
            name="add"
            size="x-small"
            className="slds-button__icon slds-button__icon_left"
          />
          Add Property
        </button>
        <button
          className="slds-button slds-button_brand"
          onClick={handleUseBlendedValues}
          title="Transfer totals and blended rates to Loan Details"
          disabled={isReadOnly || totals.property_value === 0}
        >
          <SalesforceIcon
            category="utility"
            name="forward"
            size="x-small"
            className="slds-button__icon slds-button__icon_left"
          />
          Use Blended Values
        </button>
      </div>

      {/* Blended Rate Summary */}
      <div className="margin-top-1 padding-1 background-gray-light border-radius-medium">
        <div className="display-flex flex-gap-2 align-items-center flex-wrap">
          <div>
            <span className="font-weight-600">Blended Fixed Rate:</span>{' '}
            <span className="font-monospace text-color-success font-size-large">{blendedRates.fixedRate.toFixed(2)}%</span>
          </div>
          <div>
            <span className="font-weight-600">Blended Variable Rate:</span>{' '}
            <span className="font-monospace text-color-success font-size-large">{blendedRates.variableRate.toFixed(2)}%</span>
          </div>
          <div>
            <span className="font-weight-600">Blended LTV:</span>{' '}
            <span className="font-monospace">{blendedRates.blendedLtv.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="margin-top-075">
            {warnings.map((warning, idx) => (
              <div key={idx} className="display-flex align-items-center flex-gap-05 text-color-warning">
                <SalesforceIcon category="utility" name="warning" size="x-small" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

MultiPropertyLoanSection.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    property_type: PropTypes.string,
    sub_product: PropTypes.string,
    property_address: PropTypes.string,
    property_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    charge_type: PropTypes.string,
    first_charge_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fixed_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    variable_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    max_ltv: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    max_gross_loan: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })).isRequired,
  onRowChange: PropTypes.func.isRequired,
  onRowBatchChange: PropTypes.func,
  onAddRow: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
  rates: PropTypes.array,
  onUseBlendedValues: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool
};

export default MultiPropertyLoanSection;
