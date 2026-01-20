import { getMarketRates } from "../../config/constants";
import { useSalesforceCanvas } from "../../contexts/SalesforceCanvasContext";

const ConstantsRow = () => {
  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  // Use the existing Salesforce Canvas context to get record ID and action
  const { canvasContext } = useSalesforceCanvas();
  
  // Extract parameters from Canvas context
  const canvasParams = canvasContext?.environment?.parameters;
  const recordId = canvasParams?.recordId || null;
  const action = canvasParams?.action || null;

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

      <div>
        <h2>Canvas App (React)</h2>
        <p><b>Record Id:</b> {recordId}</p>
        <p><b>Action:</b> {action}</p>
      </div>
    </div>
  );
};

export default ConstantsRow;
