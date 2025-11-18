/**
 * BTL Range Toggle Component
 * Toggles between Core and Specialist product ranges
 */

import React from 'react';
import '../../../styles/Calculator.scss';

export default function BTLRangeToggle({ 
  selectedRange, 
  onRangeChange, 
  isReadOnly = false 
}) {
  return (
    <div className="range-toggle-container">
      <div className="range-toggle-buttons">
        <button
          className={`range-button ${selectedRange === 'specialist' ? 'active' : ''}`}
          onClick={() => !isReadOnly && onRangeChange('specialist')}
          type="button"
          disabled={isReadOnly}
        >
          Specialist range
        </button>
        <button
          className={`range-button ${selectedRange === 'core' ? 'active' : ''}`}
          onClick={() => !isReadOnly && onRangeChange('core')}
          type="button"
          disabled={isReadOnly}
        >
          Core range
        </button>
      </div>
    </div>
  );
}
