import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import { formatCurrencyInput } from '../../../utils/calculator/numberFormatting';

/**
 * BTLLoanDetailsSection - Handles loan calculation inputs for BTL Calculator
 * Property value, monthly rent, top slicing, loan type, and conditional inputs
 */
const BTLLoanDetailsSection = ({ 
  expanded, 
  onToggle,
  propertyValue,
  onPropertyValueChange,
  monthlyRent,
  onMonthlyRentChange,
  topSlicing,
  onTopSlicingChange,
  loanType,
  onLoanTypeChange,
  productSelectControl,
  // Conditional fields based on loanType
  specificNetLoan,
  onSpecificNetLoanChange,
  maxLtvInput,
  onMaxLtvInputChange,
  ltvMin,
  ltvMax,
  ltvPercent,
  specificGrossLoan,
  onSpecificGrossLoanChange,
  isReadOnly = false
}) => {
  return (
    <CollapsibleSection 
      title="Loan details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="loan-details-grid">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Property value
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={propertyValue} 
              onChange={(e) => onPropertyValueChange(formatCurrencyInput(e.target.value))} 
              placeholder="£1,200,000"
              disabled={isReadOnly}
            />
            <div className="helper-text">Subject to valuation</div>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Monthly rent
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={monthlyRent} 
              onChange={(e) => onMonthlyRentChange(formatCurrencyInput(e.target.value))} 
              placeholder="£3,000"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Top slicing</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={topSlicing} 
              onChange={(e) => onTopSlicingChange(e.target.value)} 
              placeholder="e.g. 600"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Loan calculation requested
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={loanType} 
              onChange={(e) => onLoanTypeChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Max gross loan">Max Gross Loan</option>
              <option value="Net loan required">Net loan required</option>
              <option value="Specific LTV required">Specific LTV Required</option>
              <option value="Specific gross loan">Specific Gross Loan</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Select your product
          </label>
          <div className="slds-form-element__control">
            {productSelectControl}
            <div className="helper-text">Default is first product for the selected product scope</div>
          </div>
        </div>

        {loanType === 'Net loan required' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Net loan required
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificNetLoan} 
                onChange={(e) => onSpecificNetLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£425,000"
                disabled={isReadOnly}
              />
              <div className="helper-text">Maximum GLA £9,000,000</div>
            </div>
          </div>
        )}

        {loanType === 'Specific LTV required' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Target LTV (%)
            </label>
            <div className="slds-form-element__control">
              <input
                type="range"
                min={ltvMin}
                max={ltvMax}
                value={maxLtvInput}
                onChange={(e) => onMaxLtvInputChange(Number(e.target.value))}
                disabled={isReadOnly}
                aria-valuemin={ltvMin}
                aria-valuemax={ltvMax}
                aria-valuenow={maxLtvInput}
                className="ltv-slider"
                style={{ background: `linear-gradient(90deg, #0176d3 ${ltvPercent}%, #e9eef5 ${ltvPercent}%)` }}
              />
              <div className="helper-text">
                Selected: <strong>{maxLtvInput}%</strong> (Max available: <strong>{ltvMax}%</strong>)
              </div>
            </div>
          </div>
        )}

        {loanType === 'Specific gross loan' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Specific gross loan
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificGrossLoan} 
                onChange={(e) => onSpecificGrossLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£550,000"
                disabled={isReadOnly}
              />
              <div className="helper-text">Enter desired gross loan amount</div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default BTLLoanDetailsSection;
