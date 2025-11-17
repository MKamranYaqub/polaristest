import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import NotificationModal from './NotificationModal';
import { InlineLoading } from '@carbon/react';

/**
 * GlobalSettings Component
 * Allows admins to control which rows are visible in the calculator results tables
 * and their display order
 */
export default function GlobalSettings() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const [activeTab, setActiveTab] = useState('btl'); // 'btl', 'bridge', or 'core'
  
  // Default rows for BTL Calculator
  const DEFAULT_BTL_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
    'Deferred Interest %',
    'Deferred Interest £',
    'Direct Debit',
    'ERC',
    'Exit Fee',
    'Gross Loan',
    'ICR',
    'LTV',
    'Monthly Interest Cost',
    'NBP',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Rolled Months',
    'Rolled Months Interest',
    'Serviced Interest',
    'Title Insurance Cost',
    'Total Cost to Borrower',
    'Total Loan Term'
  ];

  // Default rows for Bridging Calculator
  const DEFAULT_BRIDGE_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Comission (Proc Fee %)',
    'Broker Comission (Proc Fee £)',
    'Commitment Fee £',
    'Deferred Interest %',
    'Deferred Interest £',
    'Direct Debit',
    'ERC 1 £',
    'ERC 2 £',
    'Exit Fee',
    'Full Int BBR £',
    'Full Int Coupon £',
    'Gross Loan',
    'ICR',
    'LTV',
    'Monthly Interest Cost',
    'NBP',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Rolled Months',
    'Rolled Months Interest',
    'Serviced Interest',
    'Title Insurance Cost',
    'Total Interest',
    'Total Loan Term'
  ];

  // Default rows for Core Range Calculator
  const DEFAULT_CORE_ROWS = [
    'APRC',
    'Admin Fee',
    'Broker Client Fee',
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
    'Direct Debit',
    'ERC',
    'Exit Fee',
    'Gross Loan',
    'ICR',
    'LTV',
    'Monthly Interest Cost',
    'Net Loan',
    'Net LTV',
    'Pay Rate',
    'Product Fee %',
    'Product Fee £',
    'Revert Rate',
    'Revert Rate DD',
    'Title Insurance Cost',
    'Total Loan Term'
  ];

  const [btlVisibleRows, setBtlVisibleRows] = useState(() => 
    DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );
  
  const [bridgeVisibleRows, setBridgeVisibleRows] = useState(() => 
    DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );

  const [coreVisibleRows, setCoreVisibleRows] = useState(() => 
    DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {})
  );

  const [btlRowOrder, setBtlRowOrder] = useState([...DEFAULT_BTL_ROWS]);
  const [bridgeRowOrder, setBridgeRowOrder] = useState([...DEFAULT_BRIDGE_ROWS]);
  const [coreRowOrder, setCoreRowOrder] = useState([...DEFAULT_CORE_ROWS]);

  // Load settings from Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async() => {
    try {
      setLoading(true);
      
      // Load visibility settings
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('app_constants')
        .select('*')
        .eq('key', 'results_table_visibility')
        .maybeSingle();

      if (visibilityError && visibilityError.code !== 'PGRST116') {
        throw visibilityError;
      }

      if (visibilityData && visibilityData.value) {
        const settings = typeof visibilityData.value === 'string' ? JSON.parse(visibilityData.value) : visibilityData.value;
        
        if (settings.btl) {
          setBtlVisibleRows(settings.btl);
        }
        if (settings.bridge) {
          setBridgeVisibleRows(settings.bridge);
        }
        if (settings.core) {
          setCoreVisibleRows(settings.core);
        }
      }

      // Load row order settings
      const { data: orderData, error: orderError } = await supabase
        .from('app_constants')
        .select('*')
        .eq('key', 'results_table_row_order')
        .maybeSingle();

      if (orderError && orderError.code !== 'PGRST116') {
        throw orderError;
      }

      if (orderData && orderData.results_row_order) {
        const settings = typeof orderData.results_row_order === 'string' 
          ? JSON.parse(orderData.results_row_order) 
          : orderData.results_row_order;
        
        if (settings.btl && Array.isArray(settings.btl)) {
          setBtlRowOrder(settings.btl);
        }
        if (settings.bridge && Array.isArray(settings.bridge)) {
          setBridgeRowOrder(settings.bridge);
        }
        if (settings.core && Array.isArray(settings.core)) {
          setCoreRowOrder(settings.core);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to load settings: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save visibility settings
      const visibilitySettings = {
        btl: btlVisibleRows,
        bridge: bridgeVisibleRows,
        core: coreVisibleRows
      };

      const { error: visibilityError } = await supabase
        .from('app_constants')
        .upsert({
          key: 'results_table_visibility',
          value: visibilitySettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (visibilityError) throw visibilityError;

      // Save row order settings
      const orderSettings = {
        btl: btlRowOrder,
        bridge: bridgeRowOrder,
        core: coreRowOrder
      };

      const { error: orderError } = await supabase
        .from('app_constants')
        .upsert({
          key: 'results_table_row_order',
          results_row_order: orderSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (orderError) throw orderError;

      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: 'Results table settings saved successfully!'
      });

      // Save to localStorage for immediate effect
      localStorage.setItem('results_table_visibility', JSON.stringify(visibilitySettings));
      localStorage.setItem('results_table_row_order', JSON.stringify(orderSettings));
      
      // Dispatch storage events to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'results_table_visibility',
        newValue: JSON.stringify(visibilitySettings)
      }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'results_table_row_order',
        newValue: JSON.stringify(orderSettings)
      }));
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save settings: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBtlRow = (row) => {
    setBtlVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleToggleBridgeRow = (row) => {
    setBridgeVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleToggleCoreRow = (row) => {
    setCoreVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };

  const handleMoveRowUp = (index, type) => {
    if (index === 0) return;
    
    if (type === 'btl') {
      const newOrder = [...btlRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setBtlRowOrder(newOrder);
    } else if (type === 'bridge') {
      const newOrder = [...bridgeRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setBridgeRowOrder(newOrder);
    } else if (type === 'core') {
      const newOrder = [...coreRowOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setCoreRowOrder(newOrder);
    }
  };

  const handleMoveRowDown = (index, type) => {
    const maxIndex = type === 'btl' ? btlRowOrder.length - 1 : 
                     type === 'bridge' ? bridgeRowOrder.length - 1 : 
                     coreRowOrder.length - 1;
    if (index === maxIndex) return;
    
    if (type === 'btl') {
      const newOrder = [...btlRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setBtlRowOrder(newOrder);
    } else if (type === 'bridge') {
      const newOrder = [...bridgeRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setBridgeRowOrder(newOrder);
    } else if (type === 'core') {
      const newOrder = [...coreRowOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setCoreRowOrder(newOrder);
    }
  };

  const handleSelectAllBtl = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllBtl = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleSelectAllBridge = () => {
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllBridge = () => {
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleSelectAllCore = () => {
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
  };

  const handleDeselectAllCore = () => {
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: false }), {}));
  };

  const handleReset = () => {
    setBtlVisibleRows(DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setBridgeVisibleRows(DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setCoreVisibleRows(DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}));
    setBtlRowOrder([...DEFAULT_BTL_ROWS]);
    setBridgeRowOrder([...DEFAULT_BRIDGE_ROWS]);
    setCoreRowOrder([...DEFAULT_CORE_ROWS]);
  };

  if (loading) {
    return (
      <div className="slds-spinner_container">
        <div className="slds-spinner slds-spinner_medium">
          <div className="slds-spinner__dot-a"></div>
          <div className="slds-spinner__dot-b"></div>
        </div>
        <div className="slds-text-heading_small slds-m-top_medium">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="slds-p-around_medium">
      <h4 className="slds-text-heading_large slds-m-bottom_small">Results Table Configuration</h4>
      <p className="slds-text-body_regular slds-m-bottom_large" style={{ color: '#706e6b' }}>
        Control which rows are visible in the calculator results tables and their display order
      </p>
      
      {/* Tabs */}
      <div className="slds-tabs_default slds-m-bottom_medium">
        <ul className="slds-tabs_default__nav" role="tablist">
          <li className={`slds-tabs_default__item ${activeTab === 'btl' ? 'slds-is-active' : ''}`} role="presentation">
            <a 
              className="slds-tabs_default__link" 
              role="tab" 
              onClick={() => setActiveTab('btl')}
              style={{ cursor: 'pointer' }}
            >
              BTL Calculator
            </a>
          </li>
          <li className={`slds-tabs_default__item ${activeTab === 'bridge' ? 'slds-is-active' : ''}`} role="presentation">
            <a 
              className="slds-tabs_default__link" 
              role="tab" 
              onClick={() => setActiveTab('bridge')}
              style={{ cursor: 'pointer' }}
            >
              Bridging Calculator
            </a>
          </li>
          <li className={`slds-tabs_default__item ${activeTab === 'core' ? 'slds-is-active' : ''}`} role="presentation">
            <a 
              className="slds-tabs_default__link" 
              role="tab" 
              onClick={() => setActiveTab('core')}
              style={{ cursor: 'pointer' }}
            >
              Core Range
            </a>
          </li>
        </ul>
      </div>

      {/* BTL Tab Content */}
      {activeTab === 'btl' && (
        <>
          {/* Row Visibility Section */}
          <div className="slds-m-bottom_x-large">
            <div className="slds-box">
              <h4 className="slds-text-heading_x-small slds-m-bottom_small" style={{ fontWeight: '600' }}>
                Row Visibility
              </h4>
            
              <div className="slds-m-bottom_small" style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="slds-button slds-button_neutral"
                  onClick={handleSelectAllBtl}
                  disabled={saving}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  Select All
                </button>
                <button
                  className="slds-button slds-button_neutral"
                onClick={handleDeselectAllBtl}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Deselect All
              </button>
            </div>

            <div 
              style={{ 
                maxHeight: '350px', 
                overflowY: 'auto',
                border: '1px solid #c9c7c5',
                borderRadius: '0.25rem',
                padding: '0.75rem',
                backgroundColor: '#fafafa'
              }}
            >
              <div 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem'
                }}
              >
                {DEFAULT_BTL_ROWS.map(row => (
                  <div key={row} className="slds-checkbox">
                    <input
                      type="checkbox"
                      id={`btl-${row}`}
                      checked={btlVisibleRows[row] || false}
                      onChange={() => handleToggleBtlRow(row)}
                      disabled={saving}
                    />
                    <label className="slds-checkbox__label" htmlFor={`btl-${row}`}>
                      <span className="slds-checkbox_faux" style={{ marginRight: '0.5rem' }}></span>
                      <span className="slds-form-element__label" style={{ fontSize: '0.8125rem' }}>{row}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bridging Calculator Settings */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="slds-box">
            <h4 className="slds-text-heading_x-small slds-m-bottom_small" style={{ fontWeight: '600' }}>
                Bridging Calculator
              </h4>

            <div className="slds-m-bottom_small" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="slds-button slds-button_neutral"
                onClick={handleSelectAllBridge}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Select All
              </button>
              <button
                className="slds-button slds-button_neutral"
                onClick={handleDeselectAllBridge}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Deselect All
              </button>
            </div>

            <div 
              style={{ 
                maxHeight: '350px', 
                overflowY: 'auto',
                border: '1px solid #c9c7c5',
                borderRadius: '0.25rem',
                padding: '0.75rem',
                backgroundColor: '#fafafa'
              }}
            >
              <div 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem'
                }}
              >
                {DEFAULT_BRIDGE_ROWS.map(row => (
                  <div key={row} className="slds-checkbox">
                    <input
                      type="checkbox"
                      id={`bridge-${row}`}
                      checked={bridgeVisibleRows[row] || false}
                      onChange={() => handleToggleBridgeRow(row)}
                      disabled={saving}
                    />
                    <label className="slds-checkbox__label" htmlFor={`bridge-${row}`}>
                      <span className="slds-checkbox_faux" style={{ marginRight: '0.5rem' }}></span>
                      <span className="slds-form-element__label" style={{ fontSize: '0.8125rem' }}>{row}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row Display Order Section */}
      <div className="slds-m-bottom_x-large" style={{ marginTop: '3rem' }}>
        <h3 className="slds-text-heading_small slds-m-bottom_x-small">
          Row Display Order
        </h3>
        <p className="slds-text-body_small slds-m-bottom_medium" style={{ color: '#706e6b' }}>
          Configure the order in which rows appear in the results tables
        </p>
        
        <div className="slds-grid slds-wrap" style={{ gap: '1.5rem' }}>
          {/* BTL Row Order */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div className="slds-box" style={{ height: '100%' }}>
              <h4 className="slds-text-heading_x-small slds-m-bottom_small" style={{ fontWeight: '600' }}>
                BTL Calculator
              </h4>
              <div 
                style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto',
                  border: '1px solid #dddbda',
                  borderRadius: '0.25rem',
                  padding: '0.5rem',
                  backgroundColor: '#fafaf9'
                }}
              >
                {btlRowOrder.map((row, index) => (
                  <div 
                    key={row} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.25rem',
                      backgroundColor: btlVisibleRows[row] === false ? '#f3f2f2' : 'white',
                      border: '1px solid #dddbda',
                      borderRadius: '0.25rem',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <span style={{ 
                      flex: 1,
                      color: btlVisibleRows[row] === false ? '#999' : '#080707',
                      fontSize: '0.8125rem',
                      fontWeight: '400'
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        width: '2rem',
                        color: '#706e6b',
                        fontWeight: '500'
                      }}>
                        {index + 1}.
                      </span>
                      {row}
                      {btlVisibleRows[row] === false && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem',
                          color: '#999',
                          fontStyle: 'italic'
                        }}>
                          (Hidden)
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleMoveRowUp(index, 'btl')}
                        disabled={saving || index === 0}
                        title="Move up"
                        style={{
                          width: '2rem',
                          height: '2rem',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          opacity: index === 0 ? 0.4 : 1
                        }}
                      >
                        ▲
                      </button>
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleMoveRowDown(index, 'btl')}
                        disabled={saving || index === btlRowOrder.length - 1}
                        title="Move down"
                        style={{
                          width: '2rem',
                          height: '2rem',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          opacity: index === btlRowOrder.length - 1 ? 0.4 : 1
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bridge Row Order */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div className="slds-box" style={{ height: '100%' }}>
              <h4 className="slds-text-heading_x-small slds-m-bottom_small" style={{ fontWeight: '600' }}>
                Bridging Calculator
              </h4>
              <div 
                style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto',
                  border: '1px solid #dddbda',
                  borderRadius: '0.25rem',
                  padding: '0.5rem',
                  backgroundColor: '#fafaf9'
                }}
              >
                {bridgeRowOrder.map((row, index) => (
                  <div 
                    key={row} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.25rem',
                      backgroundColor: bridgeVisibleRows[row] === false ? '#f3f2f2' : 'white',
                      border: '1px solid #dddbda',
                      borderRadius: '0.25rem',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <span style={{ 
                      flex: 1,
                      color: bridgeVisibleRows[row] === false ? '#999' : '#080707',
                      fontSize: '0.8125rem',
                      fontWeight: '400'
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        width: '2rem',
                        color: '#706e6b',
                        fontWeight: '500'
                      }}>
                        {index + 1}.
                      </span>
                      {row}
                      {bridgeVisibleRows[row] === false && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem',
                          color: '#999',
                          fontStyle: 'italic'
                        }}>
                          (Hidden)
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleMoveRowUp(index, 'bridge')}
                        disabled={saving || index === 0}
                        title="Move up"
                        style={{
                          width: '2rem',
                          height: '2rem',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          opacity: index === 0 ? 0.4 : 1
                        }}
                      >
                        ▲
                      </button>
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleMoveRowDown(index, 'bridge')}
                        disabled={saving || index === bridgeRowOrder.length - 1}
                        title="Move down"
                        style={{
                          width: '2rem',
                          height: '2rem',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          opacity: index === bridgeRowOrder.length - 1 ? 0.4 : 1
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="slds-grid slds-gutters slds-m-top_medium">
        <div className="slds-col slds-size_1-of-1">
          <button
            className="slds-button slds-button_brand slds-m-right_small"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <InlineLoading description="Saving..." />
              </>
            ) : (
              'Save Settings'
            )}
          </button>
          <button
            className="slds-button slds-button_neutral"
            onClick={handleReset}
            disabled={saving}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
