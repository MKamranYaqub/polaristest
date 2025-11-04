import React, { useState } from 'react';
import BTLcalculator from './BTL_Calculator';
import BridgingCalculator from './BridgingCalculator';
import '../styles/Calculator.scss';

export default function Calculator() {
  const [active, setActive] = useState('BTL');

  return (
    <div className="calculator-shell slds-p-around_medium">
      <div className="slds-button-group" role="tablist" aria-label="Calculator tabs">
        <button
          type="button"
          className={`slds-button ${active === 'BTL' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => setActive('BTL')}
        >
          BTL Calculator
        </button>
        <button
          type="button"
          className={`slds-button ${active === 'BRIDGING' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => setActive('BRIDGING')}
        >
          Bridging Calculator
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {active === 'BTL' ? <BTLcalculator /> : <BridgingCalculator />}
      </div>
    </div>
  );
}
 
