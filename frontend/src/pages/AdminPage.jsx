import React from 'react';
import Constants from '../components/Constants';
import CriteriaTable from '../components/CriteriaTable';
import RatesTable from '../components/RatesTable';
import BridgeFusionRates from '../components/BridgeFusionRates';
import GlobalSettings from '../components/GlobalSettings';

const AdminPage = ({ tab = 'constants' }) => {
  return (
    <div className="padding-2">
      {tab === 'constants' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">Application Constants</h1>
          <Constants />
        </div>
      )}
      
      {tab === 'criteria' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">BTL Criteria Management</h1>
          <CriteriaTable />
        </div>
      )}
      
      {tab === 'btlRates' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">BTL Rate Management</h1>
          <RatesTable />
        </div>
      )}
      
      {tab === 'bridgingRates' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">Bridging Rate Management</h1>
          <BridgeFusionRates />
        </div>
      )}
      
      {tab === 'globalSettings' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">Global Settings</h1>
          <p className="slds-text-body_regular slds-m-bottom_medium text-color-gray">
            Configure global application settings and control calculator results table visibility
          </p>
          <GlobalSettings />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
