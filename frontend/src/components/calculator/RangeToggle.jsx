import React from 'react';

/**
 * RangeToggle - Toggle between Core and Specialist product ranges
 * Reusable component for BTL and other calculators
 * 
 * @param {string} selectedRange - Currently selected range ('core' or 'specialist')
 * @param {function} onRangeChange - Handler for range selection changes
 * @param {object} rangeLabels - Optional custom labels { core: string, specialist: string }
 */
export default function RangeToggle({
  selectedRange,
  onRangeChange,
  rangeLabels = { core: 'Core range', specialist: 'Specialist range' }
}) {
  return (
    <div className="range-toggle-container">
      <div className="range-toggle-buttons">
        <button
          className={`range-button ${selectedRange === 'specialist' ? 'active' : ''}`}
          onClick={() => onRangeChange('specialist')}
          type="button"
        >
          {rangeLabels.specialist}
        </button>
        <button
          className={`range-button ${selectedRange === 'core' ? 'active' : ''}`}
          onClick={() => onRangeChange('core')}
          type="button"
        >
          {rangeLabels.core}
        </button>
      </div>
    </div>
  );
}
