import React from 'react';
import Constants from '../components/Constants';
import CriteriaTable from '../components/CriteriaTable';
import RatesTable from '../components/RatesTable';
import BridgeFusionRates from '../components/BridgeFusionRates';

const AdminPage = ({ tab = 'constants' }) => {
  return (
    <div style={{ padding: '2rem' }}>
      {tab === 'constants' && (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Application Constants</h1>
          <Constants />
        </div>
      )}
      
      {tab === 'criteria' && (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>BTL Criteria Management</h1>
          <CriteriaTable />
        </div>
      )}
      
      {tab === 'btlRates' && (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>BTL Rate Management</h1>
          <RatesTable />
        </div>
      )}
      
      {tab === 'bridgingRates' && (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bridging Rate Management</h1>
          <BridgeFusionRates />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
