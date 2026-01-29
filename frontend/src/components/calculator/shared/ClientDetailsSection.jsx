import React from 'react';
import ModernSwitch from '../../common/ModernSwitch';
import CollapsibleSection from '../CollapsibleSection';
import '../../../styles/Calculator.scss';

/**
 * Client Details Section Component
 * Handles client information form for both Direct and Broker types
 * Includes broker-specific fields like proc fees, route, and additional fees
 * Designed to work with useBrokerSettings hook
 * 
 * @param {Object} props - Component props
 * @param {string} props.clientType - 'Direct' or 'Broker'
 * @param {Function} props.setClientType - Client type setter
 * @param {string} props.clientFirstName - Client first name
 * @param {Function} props.setClientFirstName - First name setter
 * @param {string} props.clientLastName - Client last name
 * @param {Function} props.setClientLastName - Last name setter
 * @param {string} props.clientEmail - Client email
 * @param {Function} props.setClientEmail - Email setter
 * @param {string} props.clientContact - Client contact number
 * @param {Function} props.setClientContact - Contact setter
 * @param {string} props.brokerCompanyName - Broker company name
 * @param {Function} props.setBrokerCompanyName - Company name setter
 * @param {string} props.brokerRoute - Selected broker route
 * @param {Function} props.setBrokerRoute - Broker route setter
 * @param {number} props.procFeeSpecialistPercent - Proc fee percentage for BTL Specialist (or general proc fee for Bridge)
 * @param {Function} props.handleProcFeeSpecialistChange - Specialist proc fee change handler
 * @param {number} props.procFeeCorePercent - Proc fee percentage for BTL Core (BTL only)
 * @param {Function} props.handleProcFeeCoreChange - Core proc fee change handler (BTL only)
 * @param {Function} props.getBrokerRoutesAndDefaults - Function to get broker config from localStorage
 * @param {string} props.calculatorType - 'btl', 'core', or 'bridge' to determine which proc fee to use
 * @param {boolean} props.addFeesToggle - Whether additional fees are enabled
 * @param {Function} props.setAddFeesToggle - Additional fees toggle setter
 * @param {string} props.feeCalculationType - 'pound' or 'percentage'
 * @param {Function} props.setFeeCalculationType - Fee calculation type setter
 * @param {string} props.additionalFeeAmount - Additional fee amount
 * @param {Function} props.setAdditionalFeeAmount - Fee amount setter
 * @param {boolean} props.expanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle handler
 * @param {boolean} props.isReadOnly - Whether form fields are read-only
 * @param {boolean} props.isBTLCalculator - Whether this is a BTL calculator (shows separate Specialist/Core fields)
 */
export default function ClientDetailsSection({
  clientType,
  setClientType,
  clientFirstName,
  setClientFirstName,
  clientLastName,
  setClientLastName,
  clientEmail,
  setClientEmail,
  clientContact,
  setClientContact,
  brokerCompanyName,
  setBrokerCompanyName,
  brokerRoute,
  setBrokerRoute,
  // Legacy prop names for backwards compatibility
  brokerCommissionPercent,
  handleBrokerCommissionChange,
  // New prop names for clarity
  procFeeSpecialistPercent,
  handleProcFeeSpecialistChange,
  procFeeCorePercent,
  handleProcFeeCoreChange,
  getBrokerRoutesAndDefaults,
  calculatorType = 'btl',
  addFeesToggle,
  setAddFeesToggle,
  feeCalculationType,
  setFeeCalculationType,
  additionalFeeAmount,
  setAdditionalFeeAmount,
  handleAdditionalFeeAmountChange,
  expanded = true,
  onToggle,
  isReadOnly = false,
  isBTLCalculator = false
}) {
  // Use new prop names if provided, fall back to legacy names for backwards compatibility
  const specialistPercent = procFeeSpecialistPercent ?? brokerCommissionPercent;
  const handleSpecialistChange = handleProcFeeSpecialistChange ?? handleBrokerCommissionChange;
  
  return (
    <CollapsibleSection 
      title="Client details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="slds-grid slds-gutters align-items-stretch margin-bottom-05">
        <div className="slds-col width-100">
          <div className="slds-button-group_toggle" role="group">
            <button 
              type="button" 
              className={`slds-button ${clientType === 'Broker' ? 'slds-is-selected' : ''}`} 
              onClick={() => setClientType('Broker')}
            >
              Broker
            </button>
            <button 
              type="button" 
              className={`slds-button ${clientType === 'Direct' ? 'slds-is-selected' : ''}`} 
              onClick={() => setClientType('Direct')}
            >
              Direct Client
            </button>
          </div>
        </div>
      </div>

      <div className="loan-details-grid">
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label"><span className="slds-required">* </span>Broker company</label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={brokerCompanyName} 
                onChange={(e) => setBrokerCompanyName(e.target.value)} 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        )}
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label"><span className="slds-required">* </span>Broker route</label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={brokerRoute} 
                onChange={(e) => setBrokerRoute(e.target.value)} 
                disabled={isReadOnly}
              >
                {Object.values(getBrokerRoutesAndDefaults().routes).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* BTL Calculator: Show separate Specialist and Core proc fee fields */}
        {clientType === 'Broker' && isBTLCalculator && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="slds-required">* </span>Proc Fee Specialist (%){' '}
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                type="number" 
                step="0.1"
                value={specialistPercent} 
                onChange={handleSpecialistChange}
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}
        {clientType === 'Broker' && isBTLCalculator && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="slds-required">* </span>Proc Fee Core (%){' '}
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                type="number" 
                step="0.1"
                value={procFeeCorePercent ?? ''} 
                onChange={handleProcFeeCoreChange}
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}
        
        {/* Bridge Calculator: Show single proc fee field */}
        {clientType === 'Broker' && !isBTLCalculator && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="slds-required">* </span>Proc Fee (%){' '}
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                type="number" 
                step="0.1"
                value={specialistPercent} 
                onChange={handleSpecialistChange}
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}
      </div>

      {clientType === 'Broker' && (
        <div className="loan-details-grid margin-top-05">
          <div className="slds-form-element">
            <ModernSwitch
              label="Any additional fees to be added?"
              ariaLabel="Any additional fees to be added?"
              checked={addFeesToggle}
              onToggle={setAddFeesToggle}
              className="display-flex align-items-center height-100"
            />
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Fee calculated as</label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={feeCalculationType} 
                onChange={(e) => setFeeCalculationType(e.target.value)}
                disabled={isReadOnly || !addFeesToggle}
              >
                <option value="">Please select...</option>
                <option value="percentage">Percent %</option>
                <option value="pound">GBP £</option>
              </select>
            </div>
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Additional fee amount (£)</label>
            <div className="slds-form-element__control">
              <input
                className="slds-input"
                type="number"
                step="0.01"
                value={feeCalculationType === 'pound' ? additionalFeeAmount : ''}
                onChange={(e) => handleAdditionalFeeAmountChange ? handleAdditionalFeeAmountChange(e, 'pound') : setAdditionalFeeAmount(e.target.value)}
                placeholder="£0.00"
                aria-label="Additional fee amount in pounds"
                disabled={isReadOnly || !addFeesToggle || feeCalculationType !== 'pound'}
              />
            </div>
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Additional fee amount (%) <span className="slds-text-body_small slds-text-color_weak">(max 1.5%)</span></label>
            <div className="slds-form-element__control">
              <input
                className="slds-input"
                type="number"
                step="0.1"
                max="1.5"
                value={feeCalculationType === 'percentage' ? additionalFeeAmount : ''}
                onChange={(e) => handleAdditionalFeeAmountChange ? handleAdditionalFeeAmountChange(e, 'percentage') : setAdditionalFeeAmount(e.target.value)}
                placeholder="0%"
                aria-label="Additional fee amount in percentage"
                disabled={isReadOnly || !addFeesToggle || feeCalculationType !== 'percentage'}
              />
            </div>
          </div>
        </div>
      )}

      <div className="loan-details-grid margin-top-05">
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>First name</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientFirstName} 
              onChange={(e) => setClientFirstName(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Last name</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientLastName} 
              onChange={(e) => setClientLastName(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Email</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              type="email" 
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Telephone</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientContact} 
              onChange={(e) => setClientContact(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
