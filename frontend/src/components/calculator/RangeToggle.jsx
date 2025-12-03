import React from 'react';

/**
 * RangeToggle - Toggle between Core and Specialist product ranges
 * Uses SLDS tabs design with underline indicator
 * Can wrap children content to create a unified tab + content card
 * 
 * @param {string} selectedRange - Currently selected range ('core' or 'specialist')
 * @param {function} onRangeChange - Handler for range selection changes
 * @param {object} rangeLabels - Optional custom labels { core: string, specialist: string }
 * @param {string} size - Tab size variant: 'default', 'medium', 'large'
 * @param {React.ReactNode} children - Optional content to render below tabs (creates unified card)
 */
export default function RangeToggle({
  selectedRange,
  onRangeChange,
  rangeLabels = { core: 'Core range', specialist: 'Specialist range' },
  size = 'medium',
  children
}) {
  const sizeClass = size === 'large' ? 'slds-tabs_default_large' : size === 'medium' ? 'slds-tabs_default_medium' : '';
  
  // If children provided, wrap in a card-like container
  if (children) {
    return (
      <div className="slds-tabs_card slds-tabs_card--underline">
        <div className={`slds-tabs_default ${sizeClass}`}>
          <ul className="slds-tabs_default__nav" role="tablist">
            <li 
              className={`slds-tabs_default__item ${selectedRange === 'specialist' ? 'slds-is-active' : ''}`}
              role="presentation"
            >
              <button
                className="slds-tabs_default__link"
                onClick={() => onRangeChange('specialist')}
                role="tab"
                aria-selected={selectedRange === 'specialist'}
                type="button"
              >
                {rangeLabels.specialist}
              </button>
            </li>
            <li 
              className={`slds-tabs_default__item ${selectedRange === 'core' ? 'slds-is-active' : ''}`}
              role="presentation"
            >
              <button
                className="slds-tabs_default__link"
                onClick={() => onRangeChange('core')}
                role="tab"
                aria-selected={selectedRange === 'core'}
                type="button"
              >
                {rangeLabels.core}
              </button>
            </li>
          </ul>
        </div>
        <div className="slds-tabs_card__content">
          {children}
        </div>
      </div>
    );
  }
  
  // Without children, just render tabs
  return (
    <div className={`slds-tabs_default ${sizeClass}`}>
      <ul className="slds-tabs_default__nav" role="tablist">
        <li 
          className={`slds-tabs_default__item ${selectedRange === 'specialist' ? 'slds-is-active' : ''}`}
          role="presentation"
        >
          <button
            className="slds-tabs_default__link"
            onClick={() => onRangeChange('specialist')}
            role="tab"
            aria-selected={selectedRange === 'specialist'}
            type="button"
          >
            {rangeLabels.specialist}
          </button>
        </li>
        <li 
          className={`slds-tabs_default__item ${selectedRange === 'core' ? 'slds-is-active' : ''}`}
          role="presentation"
        >
          <button
            className="slds-tabs_default__link"
            onClick={() => onRangeChange('core')}
            role="tab"
            aria-selected={selectedRange === 'core'}
            type="button"
          >
            {rangeLabels.core}
          </button>
        </li>
      </ul>
    </div>
  );
}
