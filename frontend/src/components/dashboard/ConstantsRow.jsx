
import React from 'react';
import { getMarketRates } from '../../config/constants';

import { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";

const ConstantsRow = () => {
  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);

  useEffect(() => {
    // Canvas Previewer sometimes sends signed_request as query param
    const params = new URLSearchParams(window.location.search);
    const signedRequest = params.get("signed_request");

    if (!signedRequest) {
      console.error("No signed_request found");
      return;
    }

      const decoded = jwtDecode(signedRequest.split(".")[1]);

      const canvasParams =
        decoded?.context?.environment?.parameters;

      setRecordId(canvasParams?.recordId);
      setAction(canvasParams?.action);
  }, []);

  return (
    <div className="constants-section">
      <h4 className="constants-title">Constants</h4>
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
      <div>
        <h2>Canvas App (React)</h2>
        <p><b>Record Id:</b> {recordId}</p>
        <p><b>Action:</b> {action}</p>
      </div>

    </div>
  );
};

export default ConstantsRow;


