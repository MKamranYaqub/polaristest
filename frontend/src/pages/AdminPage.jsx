import React, { useState } from 'react';
import Constants from '../components/Constants';
import CriteriaTable from '../components/CriteriaTable';
import RatesTable from '../components/RatesTable';
import BridgeFusionRates from '../components/BridgeFusionRates';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('constants');

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e0e0e0' }}>
        <button 
          onClick={() => setActiveTab('constants')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'constants' ? '#0f62fe' : 'transparent',
            color: activeTab === 'constants' ? 'white' : '#161616',
            cursor: 'pointer',
            fontWeight: activeTab === 'constants' ? 'bold' : 'normal',
          }}
        >
          Constants
        </button>
        <button 
          onClick={() => setActiveTab('criteria')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'criteria' ? '#0f62fe' : 'transparent',
            color: activeTab === 'criteria' ? 'white' : '#161616',
            cursor: 'pointer',
            fontWeight: activeTab === 'criteria' ? 'bold' : 'normal',
          }}
        >
          BTL Criteria
        </button>
        <button 
          onClick={() => setActiveTab('btlRates')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'btlRates' ? '#0f62fe' : 'transparent',
            color: activeTab === 'btlRates' ? 'white' : '#161616',
            cursor: 'pointer',
            fontWeight: activeTab === 'btlRates' ? 'bold' : 'normal',
          }}
        >
          BTL Rates
        </button>
        <button 
          onClick={() => setActiveTab('bridgingRates')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'bridgingRates' ? '#0f62fe' : 'transparent',
            color: activeTab === 'bridgingRates' ? 'white' : '#161616',
            cursor: 'pointer',
            fontWeight: activeTab === 'bridgingRates' ? 'bold' : 'normal',
          }}
        >
          Bridging Rates
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {activeTab === 'constants' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Application Constants</h2>
            <Constants />
          </div>
        )}
        
        {activeTab === 'criteria' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>BTL Criteria Management</h2>
            <CriteriaTable />
          </div>
        )}
        
        {activeTab === 'btlRates' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>BTL Rate Management</h2>
            <RatesTable />
          </div>
        )}
        
        {activeTab === 'bridgingRates' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bridging Rate Management</h2>
            <BridgeFusionRates />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
