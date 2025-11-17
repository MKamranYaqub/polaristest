import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import { formatCurrencyInput } from '../../../utils/calculator/numberFormatting';

/**
 * LoanDetailsSection - Handles loan input fields for Bridging calculator
 * Property value, gross loan, first charge value (for second charge), term, etc.
 */
const LoanDetailsSection = ({ 
  expanded, 
  onToggle,
  propertyValue,
  onPropertyValueChange,
  grossLoan,
  onGrossLoanChange,
  chargeType,
  firstChargeValue,
  onFirstChargeValueChange,
  monthlyRent,
  onMonthlyRentChange,
  topSlicing,
  onTopSlicingChange,
  useSpecificNet,
  onUseSpecificNetChange,
  specificNetLoan,
  onSpecificNetLoanChange,
  term,
  onTermChange,
  commitmentFee,
  onCommitmentFeeChange,
  exitFeePercent,
  onExitFeePercentChange,
  termRange = { min: 1, max: 24 },
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
          <label className="slds-form-element__label">Property Value</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={propertyValue} 
              onChange={(e) => onPropertyValueChange(formatCurrencyInput(e.target.value))} 
              placeholder="£1,200,000" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Gross loan</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={grossLoan} 
              onChange={(e) => onGrossLoanChange(formatCurrencyInput(e.target.value))} 
              placeholder="£550,000" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        {chargeType === 'Second' && (
          <div className="slds-form-element first-charge-warning">
            <label className="slds-form-element__label first-charge-label">
              First charge value
              <span className="first-charge-hint"></span>
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input first-charge-input" 
                value={firstChargeValue} 
                onChange={(e) => onFirstChargeValueChange(formatCurrencyInput(e.target.value))} 
                placeholder="£0" 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        )}

        <div className="slds-form-element">
          <label className="slds-form-element__label">Monthly rent</label>
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

        {/* Force new row by adding a full-width spacer */}
        <div className="grid-column-1-end height-0"></div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Use specific net loan?</label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={useSpecificNet} 
              onChange={(e) => onUseSpecificNetChange(e.target.value)} 
              disabled={isReadOnly}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {useSpecificNet === 'Yes' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">Specific net loan</label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificNetLoan} 
                onChange={(e) => onSpecificNetLoanChange(e.target.value)} 
                placeholder="£" 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        )}

        <div className="slds-form-element">
          <label className="slds-form-element__label">Bridging loan term (months)</label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={term} 
              onChange={(e) => onTermChange(e.target.value)} 
              disabled={isReadOnly}
            >
              <option value="">Select months</option>
              {Array.from({ length: termRange.max - termRange.min + 1 }, (_, i) => termRange.min + i).map((m) => (
                <option key={m} value={String(m)}>{m} months</option>
              ))}
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Commitment Fee £</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={commitmentFee} 
              onChange={(e) => onCommitmentFeeChange(formatCurrencyInput(e.target.value))} 
              placeholder="£0" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Exit Fee %</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={exitFeePercent} 
              onChange={(e) => onExitFeePercentChange(e.target.value)} 
              placeholder="e.g. 1.5" 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        
        {/*
          Sub-product type and Charge type are driven from the Criteria section.
          We derive `subProduct` and `chargeType` from the selected answers there so
          users pick these via Criteria controls instead of separate Loan details fields.
        */}
      </div>
    </CollapsibleSection>
  );
};

export default LoanDetailsSection;
