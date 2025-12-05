import React from 'react';
import Constants from '../components/admin/Constants';
import CriteriaTable from '../components/admin/CriteriaTable';
import RatesTable from '../components/admin/RatesTable';
import BridgeFusionRates from '../components/admin/BridgeFusionRates';
import GlobalSettings from '../components/admin/GlobalSettings';
import UWRequirementsAdmin from '../components/admin/UWRequirementsAdmin';

const AdminPage = ({ tab = 'constants' }) => {
  return (
    <div className="padding-0">
      {tab === 'constants' && (
        <div>
          <h1 className="font-size-2rem font-weight-bold margin-bottom-1">Application Constants</h1>
          <Constants />
        </div>
      )}
      
      {tab === 'criteria' && (
        <div>
          <CriteriaTable />
        </div>
      )}
      
      {tab === 'btlRates' && (
        <div>
          <RatesTable />
        </div>
      )}
      
      {tab === 'bridgingRates' && (
        <div>
          <BridgeFusionRates />
        </div>
      )}
      
      {tab === 'globalSettings' && (
        <div>
         <GlobalSettings />
        </div>
      )}
      
      {tab === 'uwRequirements' && (
        <div>
          <UWRequirementsAdmin />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
