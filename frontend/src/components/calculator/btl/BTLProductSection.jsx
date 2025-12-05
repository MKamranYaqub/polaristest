import React from 'react';
import '../../../styles/Calculator.scss';

/**
 * BTLProductSection - Product configuration section for BTL Calculator
 * Contains product type, buttons, and product criteria grid
 */
const BTLProductSection = ({ 
  productScope,
  onProductScopeChange,
  retentionChoice,
  onRetentionChoiceChange,
  retentionLtv,
  onRetentionLtvChange,
  currentTier,
  availableScopes,
  quoteId,
  onIssueDip,
  onIssueQuote,
  saveQuoteButton,
  onCancelQuote,
  onNewQuote,
  isReadOnly = false
}) => {
  return (
    <div className="product-config-section">
      {/* Row 1: Product Type and Action Buttons */}
      <div className="product-section-row-1">
        <div className="product-type-label">
          <span style={{ color: 'var(--token-text-primary)' }}>Product Type: </span>
          <span style={{ marginLeft: '0.5rem', color: 'var(--token-text-primary)' }}>Buy to Let</span>
        </div>
        <div className="product-actions">
          {quoteId && (
            <>
              <button 
                className="slds-button slds-button_neutral"
                onClick={onIssueDip}
                disabled={isReadOnly}
              >
                Issue DIP
              </button>
              <button 
                className="slds-button slds-button_brand"
                onClick={onIssueQuote}
                disabled={isReadOnly}
              >
                Issue Quote
              </button>
            </>
          )}
          {saveQuoteButton}
        </div>
      </div>

      {/* Row 2: 4-column grid for Product Scope, Retention, Retention LTV, Tier */}
      <div className="product-criteria-grid">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>What type of quote is this for?
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={productScope} 
              onChange={(e) => onProductScopeChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Select...</option>
              {availableScopes.map((scope) => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Is this a Retention quote?
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={retentionChoice} 
              onChange={(e) => onRetentionChoiceChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            Retention LTV
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={retentionLtv} 
              onChange={(e) => onRetentionLtvChange(e.target.value)}
              disabled={isReadOnly || retentionChoice === 'No'}
            >
              <option value="75">75%</option>
              <option value="65">65%</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label" style={{ 
            fontSize: 'var(--token-font-size-sm)',
            color: 'var(--token-text-secondary)'
          }}>
            Based on the criteria:
          </label>
          <div className="slds-form-element__control">
            <div style={{ 
              padding: 'var(--token-spacing-sm)',
              fontWeight: 'var(--token-font-weight-bold)',
              fontSize: 'var(--token-font-size-md)',
              color: 'var(--token-text-primary)'
            }}>
              Tier {currentTier}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BTLProductSection;
