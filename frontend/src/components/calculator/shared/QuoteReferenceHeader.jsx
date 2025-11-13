import React from 'react';

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">  
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
