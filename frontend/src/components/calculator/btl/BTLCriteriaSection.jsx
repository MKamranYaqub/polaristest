import React from 'react';
import CollapsibleSection from '../CollapsibleSection';

/**
 * BTLCriteriaSection - Handles criteria questions/answers for BTL Calculator
 * Displays dynamic questions with info tooltips
 */
const BTLCriteriaSection = ({ 
  expanded, 
  onToggle,
  loading,
  error,
  questions,
  answers,
  orderedQuestionKeys,
  onAnswerChange,
  hoveredTip,
  onTipHover,
  onTipLeave,
  onTipClick,
  isReadOnly = false
}) => {
  return (
    <CollapsibleSection 
      title="Criteria" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      {loading && <div>Loading criteria…</div>}
      {error && <div className="slds-text-color_error">{error}</div>}
      {!loading && !error && (
        <div className="criteria-grid">
          {Object.keys(questions).length === 0 && <div>No criteria found for this set/scope.</div>}
          {orderedQuestionKeys.map((qk) => {
            const q = questions[qk];
            return (
              <div key={qk} className="slds-form-element">
                <div className="display-flex align-items-center flex-gap-8">
                  <label className="slds-form-element__label margin-0">
                    <span className="required-asterisk">*</span>{q.label}
                  </label>
                  {q.infoTip && (
                    <div className="info-icon-wrapper">
                      <button
                        type="button"
                        className="info-icon-button"
                        onClick={() => onTipClick(q.infoTip)}
                        onMouseEnter={() => onTipHover(qk)}
                        onMouseLeave={() => onTipLeave()}
                        aria-label={`Info: ${q.label}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="9" stroke="#0176d3" strokeWidth="1.6" fill="#ffffff" />
                          <rect x="11" y="10" width="2" height="6" rx="1" fill="#0176d3" />
                          <rect x="11" y="7" width="2" height="2" rx="1" fill="#0176d3" />
                        </svg>
                      </button>
                      <span className={`info-tooltip ${hoveredTip === qk ? 'visible' : ''}`} role="tooltip">
                        {q.infoTip}
                      </span>
                    </div>
                  )}
                </div>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    value={(() => {
                      const selectedIndex = q.options.findIndex(opt => {
                        const a = answers[qk];
                        if (!a) return false;
                        if (opt.id && a.id) return opt.id === a.id;
                        return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
                      });
                      return selectedIndex >= 0 ? selectedIndex : 0;
                    })()}
                    onChange={(e) => onAnswerChange(qk, Number(e.target.value))}
                    disabled={isReadOnly}
                  >
                    {q.options.map((opt, idx) => (
                      <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default BTLCriteriaSection;
