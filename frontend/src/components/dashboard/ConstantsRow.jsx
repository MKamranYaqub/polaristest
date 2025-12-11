import React from 'react';
import { MARKET_RATES } from '../../config/constants';

const ConstantsRow = () => {
  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  // Try to get constants from localStorage (if overridden in admin)
  const getConstants = () => {
    try {
      const stored = localStorage.getItem('app.constants.override.v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.MARKET_RATES || MARKET_RATES;
      }
    } catch (e) {
      console.warn('Failed to load constants from localStorage:', e);
    }
    return MARKET_RATES;
  };

  const constants = getConstants();

  return (
    <div className="constants-section">
      <h2 className="constants-title">Constants</h2>
      <div className="constants-grid">
        <div className="constant-item">
          <span className="constant-label">BBR</span>
          <span className="constant-value">{toPercent(constants.STANDARD_BBR)}</span>
        </div>
        <div className="constant-item">
          <span className="constant-label">Stressed BBR</span>
          <span className="constant-value">{toPercent(constants.STRESS_BBR)}</span>
        </div>
        <div className="constant-item">
          <span className="constant-label">MVR</span>
          <span className="constant-value">{toPercent(constants.CURRENT_MVR)}</span>
        </div>
      </div>
    </div>
  );
};

export default ConstantsRow;
