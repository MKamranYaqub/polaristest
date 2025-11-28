import React from 'react';
import ModernSwitch from '../../common/ModernSwitch';
import '../../../styles/Calculator.scss';

/**
 * BridgingProductSection - Product configuration section for Bridging Calculator
 * Contains product type, buttons, and criteria fields
 */
const BridgingProductSection = ({ 
  productScope,
  onProductScopeChange,
  availableScopes = [],
  questions,
  answers,
  onAnswerChange,
  allCriteria,
  chargeType,
  subProductLimits = {},
  quoteId,
  onIssueDip,
  onIssueQuote,
  saveQuoteButton,
  onCancelQuote,
  onNewQuote,
  isReadOnly = false
}) => {
  const handleAnswerChange = (key, index) => {
    onAnswerChange(key, index);
  };

  // Extract sub-product info for the info box
  let subProductInfo = { loanSize: null, ltv: null };
  const subProductQuestion = Object.keys(questions).find(qk => {
    const q = questions[qk];
    return /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(q.label || qk || '');
  });
  
  if (subProductQuestion) {
    const q = questions[subProductQuestion];
    const selectedIndex = q.options.findIndex(opt => {
      const a = answers[subProductQuestion];
      if (!a) return false;
      if (opt.id && a.id) return opt.id === a.id;
      return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
    });
    const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const opt = q.options[safeIndex];
    const labelRaw = (opt && opt.option_label) ? opt.option_label.toString().trim() : '';
    
    // Determine the appropriate limits based on charge type
    const isSecondCharge = chargeType && chargeType.toLowerCase().includes('second');
    const label = labelRaw.toLowerCase();
    const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let labelKey = normalizeKey(label);
    
    // For second charge, try to find a key that includes "second" or "2nd"
    if (isSecondCharge) {
      const secondChargeKey = Object.keys(subProductLimits).find(k => 
        k.includes('second') || k.includes('2nd') || k.includes(labelKey)
      );
      if (secondChargeKey) {
        labelKey = secondChargeKey;
      }
    }
    
    let lim = subProductLimits[labelKey];
    if (!lim) {
      const foundKey = Object.keys(subProductLimits).find(k => k.includes(labelKey) || labelKey.includes(k));
      if (foundKey) lim = subProductLimits[foundKey];
    }
    if (lim) {
      if (lim.minLoan !== null || lim.maxLoan !== null) {
        const min = lim.minLoan ? `£${Number(lim.minLoan).toLocaleString()}` : '—';
        const max = lim.maxLoan ? `£${Number(lim.maxLoan).toLocaleString()}` : '—';
        subProductInfo.loanSize = `Loan size: ${min} – ${max}`;
      }
      if (lim.minLtv !== null || lim.maxLtv !== null) {
        const min = lim.minLtv != null ? `${lim.minLtv}%` : '—';
        const max = lim.maxLtv != null ? `${lim.maxLtv}%` : '—';
        subProductInfo.ltv = `Loan to Value: ${min} – ${max}`;
      }
    }
  }

  return (
    <div style={{ 
      marginBottom: 'var(--token-spacing-lg)',
      backgroundColor: 'white',
      padding: 'var(--token-spacing-md)',
      borderRadius: 'var(--token-radius-sm)',
      boxShadow: 'var(--token-shadow-card)'
    }}>
      {/* Row 1: Product Type and All Action Buttons */}
      <div className="product-section-row-1" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        gap: 'var(--token-spacing-md)', 
        marginBottom: 'var(--token-spacing-md)',
        alignItems: 'center'
      }}>
        <div style={{
          fontWeight: 'var(--token-font-weight-semibold)',
          fontSize: 'var(--token-font-size-md)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ color: 'var(--token-text-primary)' }}>Product type: </span>
          <span style={{ marginLeft: '0.5rem', color: 'var(--token-text-primary)' }}>Bridge & Fusion</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--token-spacing-sm)', alignItems: 'center' }}>
          {quoteId && (
            <>
              <button 
                className="slds-button"
                onClick={onNewQuote}
                title="Start a new quote"
                style={{
                  backgroundColor: '#00a89d',
                  color: 'white',
                  fontWeight: '600',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 168, 157, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#008c82'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00a89d'}
              >
                + New Quote
              </button>
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

      {/* Row 2: Product Scope + Criteria fields grid (4 columns) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 'var(--token-form-field-gap)'
      }}>
        {/* Product Scope - First field */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Product Scope
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={productScope} 
              onChange={(e) => onProductScopeChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Select...</option>
              {availableScopes.map(scope => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Criteria Questions */}
        {Object.keys(questions).length === 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div>No criteria found for Bridge & Fusion.</div>
            <div className="margin-top-05 text-color-gray">
              Try checking Manage Criteria — available product scopes: {Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean))).join(', ') || 'none'}.
            </div>
          </div>
        )}
        {Object.keys(questions).sort((a,b) => (questions[a].displayOrder || 0) - (questions[b].displayOrder || 0)).map((qk) => {
          const q = questions[qk];
          const selectedIndex = q.options.findIndex(opt => {
            const a = answers[qk];
            if (!a) return false;
            if (opt.id && a.id) return opt.id === a.id;
            return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
          });
          const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
          
          const isSubQuestion = /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(q.label || qk || '');
          const hideForSecond = isSubQuestion && ((chargeType || '').toString().toLowerCase() === 'second');
          
          const isChargeTypeQuestion = /charge[-_ ]?type|chargetype/i.test(q.label || qk || '');
          const isNonResidential = productScope && productScope.toLowerCase() !== 'residential';
          
          if (hideForSecond) return null;
          
          let effectiveIndex = safeIndex;
          let isDisabled = isReadOnly;
          if (isChargeTypeQuestion && isNonResidential) {
            const firstChargeIndex = q.options.findIndex(opt => 
              (opt.option_label || '').toString().toLowerCase().includes('first')
            );
            if (firstChargeIndex >= 0) {
              effectiveIndex = firstChargeIndex;
              if (safeIndex !== firstChargeIndex) {
                handleAnswerChange(qk, firstChargeIndex);
              }
            }
            isDisabled = true;
          }
          
          return (
            <div key={qk} className="slds-form-element">
              <label className="slds-form-element__label">
                <span className="required-asterisk">*</span>{q.label}
              </label>
              <div className="slds-form-element__control">
                {q.type === 'toggle' ? (
                  <ModernSwitch
                    checked={safeIndex === 1}
                    onToggle={(val) => {
                      const idx = val ? 1 : 0;
                      handleAnswerChange(qk, idx);
                    }}
                    disabled={isDisabled}
                  />
                ) : (
                  <select
                    className="slds-select"
                    value={effectiveIndex}
                    onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}
                    disabled={isDisabled}
                  >
                    {q.options.map((opt, idx) => (
                      <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}

        {/* Info Box - 4th column */}
        {(subProductInfo.loanSize || subProductInfo.ltv) && (
          <div className="loan-info-box" style={{
            padding: 'var(--token-spacing-xs)',
            backgroundColor: 'var(--token-info-bg)',
            border: '1px solid var(--token-info-border, #b3d4fc)',
            borderRadius: 'var(--token-radius-sm)',
            display: 'flex',
            gap: 'var(--token-spacing-xs)',
            alignItems: 'center',
            fontSize: 'var(--token-font-size-sm)',
            lineHeight: 'var(--token-line-height-tight)',
            color: 'var(--token-text-secondary)'
          }}>
            <svg style={{ width: '20px', height: '20px', flexShrink: 0, fill: 'var(--token-interactive)' }} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div style={{ width: '100%' }}>
              {subProductInfo.loanSize && <div style={{ marginBottom: '4px' }}>{subProductInfo.loanSize}</div>}
              {subProductInfo.ltv && <div>{subProductInfo.ltv}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgingProductSection;
