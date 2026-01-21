/*import React, { useEffect, useState } from 'react';
import { getMarketRates } from '../../config/constants';

const ConstantsRow = () => {
  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);

  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  useEffect(() => {
    if (!window.Sfdc || !window.Sfdc.canvas) {
      console.error('Salesforce Canvas SDK not available');
      return;
    }

    window.Sfdc.canvas.client.ctx((context) => {
      const params = context?.environment?.parameters || {};
      setRecordId(params.recordId || null);
      setAction(params.action || null);
    });
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
        <p><b>Record Id:</b> {recordId || 'N/A'}</p>
        <p><b>Action:</b> {action || 'N/A'}</p>
      </div>
    </div>
  );
};

export default ConstantsRow;*/

import React, { useEffect, useState } from 'react';
import { getMarketRates } from '../../config/constants';
//import '@salesforce/canvas-js-sdk';

import '@salesforce/canvas-js-sdk';

Sfdc.canvas(function () {
  const ctx = Sfdc.canvas.context();
  console.log("Canvas parameters:", ctx.environment.parameters);
  const params = ctx.environment.parameters;

});

const ConstantsRow = () => {
  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);

  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  useEffect(() => {
    if (!window.Sfdc || !window.Sfdc.canvas) {
      console.error('Salesforce Canvas SDK not available');
      return;
    }

    window.Sfdc.canvas.client.ctx((context) => {
      const params = context?.environment?.parameters || {};
      setRecordId(params.recordId || null);
      setAction(params.action || null);
    });
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
        <p><b>Record Id:</b> {recordId || 'N/A'}</p>
        <p><b>Action:</b> {action || 'N/A'}</p>
        <p><b>Record Id1:</b> {params.recordId}</p>
        <p><b>Action1:</b> {params.action}</p>
      </div>
    </div>
  );
};

export default ConstantsRow;



