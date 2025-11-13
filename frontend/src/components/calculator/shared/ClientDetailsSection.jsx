import React from 'react';
import ModernSwitch from '../../common/ModernSwitch';
import CollapsibleSection from '../CollapsibleSection';
import '../../../styles/Calculator.scss';

/**
 * Client Details Section Component
 * Handles client information form for both Direct and Broker types
 * Includes broker-specific fields like commission, route, and additional fees
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
 * @param {number} props.brokerCommissionPercent - Broker commission percentage
 * @param {Function} props.handleBrokerCommissionChange - Commission change handler
 * @param {Function} props.getBrokerRoutesAndDefaults - Function to get broker config from localStorage
 * @param {boolean} props.addFeesToggle - Whether additional fees are enabled
 * @param {Function} props.setAddFeesToggle - Additional fees toggle setter
 * @param {string} props.feeCalculationType - 'pound' or 'percentage'
 * @param {Function} props.setFeeCalculationType - Fee calculation type setter
 * @param {string} props.additionalFeeAmount - Additional fee amount
 * @param {Function} props.setAdditionalFeeAmount - Fee amount setter
 * @param {boolean} props.expanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle handler
 * @param {boolean} props.isReadOnly - Whether form fields are read-only
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
  brokerCommissionPercent,
  handleBrokerCommissionChange,
  getBrokerRoutesAndDefaults,
  addFeesToggle,
  setAddFeesToggle,
  feeCalculationType,
  setFeeCalculationType,
  additionalFeeAmount,
  setAdditionalFeeAmount,
  expanded = true,
  onToggle,
  isReadOnly = false
}) {
  return (
    <CollapsibleSection 
      title="Client details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="slds-grid slds-gutters align-items-stretch margin-bottom-05">
        <div className="slds-col width-100">
          <div className="slds-button-group display-flex width-100" role="group">
            <button 
              type="button" 
              className={`slds-button flex-1 display-flex align-items-center justify-content-center ${clientType === 'Direct' ? 'slds-button_brand' : 'slds-button_neutral'}`} 
              onClick={() => setClientType('Direct')}
            >
              Direct Client
            </button>
            <button 
              type="button" 
              className={`slds-button flex-1 display-flex align-items-center justify-content-center ${clientType === 'Broker' ? 'slds-button_brand' : 'slds-button_neutral'}`} 
              onClick={() => setClientType('Broker')}
            >
              Broker
            </button>
          </div>
        </div>
      </div>

      <div className="loan-details-grid">
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">Company name</label>
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
        <div className="slds-form-element">
          <label className="slds-form-element__label">First name</label>
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
          <label className="slds-form-element__label">Last name</label>
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
          <label className="slds-form-element__label">Email</label>
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
          <label className="slds-form-element__label">Contact number</label>
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

      {clientType === 'Broker' && (
        <div className="loan-details-grid margin-top-05">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Broker route</label>
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

          <div className="slds-form-element">
            <label className="slds-form-element__label">Broker commission (%)</label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                type="number" 
                step="0.1"
                value={brokerCommissionPercent} 
                onChange={handleBrokerCommissionChange}
                disabled={isReadOnly}
                title={`Allowed range: ${(getBrokerRoutesAndDefaults().defaults[brokerRoute] - getBrokerRoutesAndDefaults().tolerance).toFixed(1)}% to ${(getBrokerRoutesAndDefaults().defaults[brokerRoute] + getBrokerRoutesAndDefaults().tolerance).toFixed(1)}%`}
              />
            </div>
            <div className="slds-form-element__help font-size-075rem text-color-gray margin-top-025">
              Adjustable within ±{getBrokerRoutesAndDefaults().tolerance}% of default ({getBrokerRoutesAndDefaults().defaults[brokerRoute]}%)
            </div>
          </div>
          
          <div className="slds-form-element grid-column-span-2">
            <ModernSwitch
              label="Will you/the broker be adding any additional fees?"
              ariaLabel="Will you/the broker be adding any additional fees?"
              checked={addFeesToggle}
              onToggle={setAddFeesToggle}
              className="display-flex align-items-center height-100"
            />
          </div>

          {addFeesToggle && (
            <>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Fee calculated as</label>
                <div className="slds-form-element__control">
                  <select 
                    className="slds-select" 
                    value={feeCalculationType} 
                    onChange={(e) => setFeeCalculationType(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="pound">Pound value</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Additional fee amount</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    value={additionalFeeAmount}
                    onChange={(e) => setAdditionalFeeAmount(e.target.value)}
                    placeholder={feeCalculationType === 'pound' ? '£' : 'e.g. 1.5'}
                    aria-label="Additional fee amount"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
