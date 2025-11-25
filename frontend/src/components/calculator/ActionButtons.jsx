import React from 'react';
import SaveQuoteButton from '../calculators/SaveQuoteButton';

/**
 * ActionButtons - Reusable button group for calculator actions
 * Displays Issue DIP, Issue Quote, and Save Quote buttons
 * 
 * @param {string} calculatorType - Type of calculator ('BTL', 'Bridge', etc.)
 * @param {object} calculationData - Data to save with the quote
 * @param {string|null} quoteId - Current quote ID (null if not saved)
 * @param {function} onIssueDip - Handler for Issue DIP button
 * @param {function} onIssueQuote - Handler for Issue Quote button
 * @param {function} onQuoteSaved - Callback after quote is saved
 * @param {function} onQuoteUpdated - Callback after quote is updated
 */
export default function ActionButtons({
  calculatorType,
  calculationData,
  quoteId,
  onIssueDip,
  onIssueQuote,
  onQuoteSaved,
  onQuoteUpdated
}) {
  return (
    <div className="flex gap-sm" style={{ marginLeft: 'auto', alignItems: 'center' }}>
      {quoteId && (
        <>
          <button 
            className="slds-button slds-button_neutral"
            onClick={onIssueDip}
          >
            Issue DIP
          </button>
          <button 
            className="slds-button slds-button_brand"
            onClick={onIssueQuote}
          >
            Issue Quote
          </button>
        </>
      )}
      <SaveQuoteButton
        calculatorType={calculatorType}
        calculationData={calculationData}
        quoteId={quoteId}
        onQuoteSaved={onQuoteSaved}
        onQuoteUpdated={onQuoteUpdated}
      />
    </div>
  );
}
