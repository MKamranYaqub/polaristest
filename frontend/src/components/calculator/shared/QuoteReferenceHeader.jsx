import React from 'react';
import SalesforceIcon from '../../shared/SalesforceIcon';

/**
 * QuoteReferenceHeader - Displays the quote reference number badge
 * Used in both Bridging and BTL calculators
 */
export default function QuoteReferenceHeader({ reference }) {
  if (!reference) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reference);
  };

  return (
    <div className="display-flex justify-content-flex-start margin-bottom-1 padding-top-05">
      <div className="quote-reference-badge">
        <SalesforceIcon
          category="utility"
          name="file"
          size="small"
        />
        <div className="display-flex flex-direction-column flex-gap-2px">
          <span className="text-color-white-semi font-weight-400 font-size-075rem">
            Quote Reference
          </span>
          <span className="text-color-white font-weight-700 font-monospace font-size-1rem letter-spacing-05">
            {reference}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="quote-reference-copy-btn"
          title="Copy to clipboard"
        >
          <SalesforceIcon
            category="utility"
            name="copy"
            size="xx-small"
          />
        </button>
      </div>
    </div>
  );
}
