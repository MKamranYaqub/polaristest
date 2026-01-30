import { getMarketRates } from '../../config/constants';

const ConstantsRow = () => {
  const constants = getMarketRates();
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  return (
    <div className="constants-section">
      <h4 className="constants-title">Constants</h4>

      <div className="constants-grid">
        <div className="constant-item">
          <span className="constant-label">BBR</span>
          <span className="constant-value">
            {toPercent(constants.STANDARD_BBR)}
          </span>
        </div>

        <div className="constant-item">
          <span className="constant-label">Stressed BBR</span>
          <span className="constant-value">
            {toPercent(constants.STRESS_BBR)}
          </span>
        </div>

        <div className="constant-item">
          <span className="constant-label">MVR</span>
          <span className="constant-value">
            {toPercent(constants.CURRENT_MVR)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConstantsRow;
