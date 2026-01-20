import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getMarketRates } from "../../config/constants";

const ConstantsRow = () => {
  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);

  useEffect(() => {
    try {
      // Canvas Previewer sometimes sends signed_request as query param
      const params = new URLSearchParams(window.location.search);
      const signedRequest = params.get("signed_request");

      if (!signedRequest) {
        console.error("No signed_request found");
        return;
      }

      // Decode JWT payload
      const decoded = jwtDecode(signedRequest.split(".")[1]);

      // ✅ Correct Canvas context locations
      const recordIdFromContext = decoded?.context?.record?.Id;
      const displayLocation = decoded?.context?.environment?.displayLocation;

      setRecordId(recordIdFromContext || null);
      setAction(displayLocation || null);
    } catch (error) {
      console.error("Error decoding signed_request", error);
    }
  }, []);

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
