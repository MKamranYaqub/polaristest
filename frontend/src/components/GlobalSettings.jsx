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
    'Broker Commission (Proc Fee %)',
    'Broker Commission (Proc Fee £)',
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
          // Merge with defaults to ensure all fields are present
          const mergedBtl = { ...DEFAULT_BTL_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}), ...settings.btl };
          setBtlVisibleRows(mergedBtl);
        }
        if (settings.bridge) {
          // Merge with defaults to ensure all fields are present
          const mergedBridge = { ...DEFAULT_BRIDGE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}), ...settings.bridge };
          setBridgeVisibleRows(mergedBridge);
        }
        if (settings.core) {
          // Merge with defaults to ensure all fields are present
          const mergedCore = { ...DEFAULT_CORE_ROWS.reduce((acc, row) => ({ ...acc, [row]: true }), {}), ...settings.core };
          setCoreVisibleRows(mergedCore);
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
          // Filter to only include valid fields from defaults, then add any missing ones
          const validFields = settings.btl.filter(row => DEFAULT_BTL_ROWS.includes(row));
          const missingBtlFields = DEFAULT_BTL_ROWS.filter(row => !validFields.includes(row));
          setBtlRowOrder([...validFields, ...missingBtlFields]);
        }
        if (settings.bridge && Array.isArray(settings.bridge)) {
          // Filter to only include valid fields from defaults, then add any missing ones
          const validFields = settings.bridge.filter(row => DEFAULT_BRIDGE_ROWS.includes(row));
          const missingBridgeFields = DEFAULT_BRIDGE_ROWS.filter(row => !validFields.includes(row));
          setBridgeRowOrder([...validFields, ...missingBridgeFields]);
        }
        if (settings.core && Array.isArray(settings.core)) {
          // Filter to only include valid fields from defaults, then add any missing ones
          const validFields = settings.core.filter(row => DEFAULT_CORE_ROWS.includes(row));
          const missingCoreFields = DEFAULT_CORE_ROWS.filter(row => !validFields.includes(row));
          setCoreRowOrder([...validFields, ...missingCoreFields]);
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

  // Helper function to render visibility checkboxes
  const renderVisibilitySection = (rows, visibleRows, toggleHandler, selectAllHandler, deselectAllHandler) => (
    <div className="slds-m-bottom_x-large">
      <div className="slds-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 className="slds-text-heading_small" style={{ fontWeight: '600', margin: 0 }}>
            Row Visibility
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="slds-button slds-button_brand"
              onClick={selectAllHandler}
              disabled={saving}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
            >
              Select All
            </button>
            <button
              className="slds-button slds-button_neutral"
              onClick={deselectAllHandler}
              disabled={saving}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
            >
              Deselect All
            </button>
          </div>
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
            {rows.map(row => (
              <div key={row} className="slds-checkbox">
                <input
                  type="checkbox"
                  id={`${activeTab}-${row}`}
                  checked={visibleRows[row] || false}
                  onChange={() => toggleHandler(row)}
                  disabled={saving}
                />
                <label className="slds-checkbox__label" htmlFor={`${activeTab}-${row}`}>
                  <span className="slds-checkbox_faux" style={{ marginRight: '0.5rem' }}></span>
                  <span className="slds-form-element__label" style={{ fontSize: '0.8125rem' }}>{row}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
<br />
  // Helper function to render row order section
  const renderRowOrderSection = (rowOrder, visibleRows, type) => (
    <div className="slds-m-bottom_x-large">
      <br />
      <div className="slds-box">
        <h4 className="slds-text-heading_small slds-m-bottom_medium" style={{ fontWeight: '600' }}>
          Row Display Order
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
          {rowOrder.map((row, index) => (
            <div 
              key={row} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                marginBottom: '0.25rem',
                backgroundColor: visibleRows[row] === false ? '#f3f2f2' : 'white',
                border: '1px solid #dddbda',
                borderRadius: '0.25rem',
                transition: 'all 0.1s ease'
              }}
            >
              <span style={{ 
                flex: 1,
                color: visibleRows[row] === false ? '#999' : '#080707',
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
                {visibleRows[row] === false && (
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
                  onClick={() => handleMoveRowUp(index, type)}
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
                  onClick={() => handleMoveRowDown(index, type)}
                  disabled={saving || index === rowOrder.length - 1}
                  title="Move down"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    opacity: index === rowOrder.length - 1 ? 0.4 : 1
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
  );

  if (loading) {
    return (
      <div className="slds-p-around_medium" style={{ textAlign: 'center' }}>
        <InlineLoading description="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="slds-p-around_medium">
      <h4 className="slds-text-heading_large slds-m-bottom_medium">Results Table Configuration</h4>
      
      {/* Tab Buttons */}
      <div className="slds-m-bottom_large" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e5e5', paddingBottom: '0.5rem' }}>
        <button
          className={`slds-button ${activeTab === 'btl' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => setActiveTab('btl')}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          BTL Calculator
        </button>
        <button
          className={`slds-button ${activeTab === 'bridge' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => setActiveTab('bridge')}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Bridging Calculator
        </button>
        <button
          className={`slds-button ${activeTab === 'core' ? 'slds-button_brand' : 'slds-button_neutral'}`}
          onClick={() => setActiveTab('core')}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Core Range
        </button>
      </div>

      {/* BTL Tab Content */}
      {activeTab === 'btl' && (
        <>
          {renderVisibilitySection(DEFAULT_BTL_ROWS, btlVisibleRows, handleToggleBtlRow, handleSelectAllBtl, handleDeselectAllBtl)}
          {renderRowOrderSection(btlRowOrder, btlVisibleRows, 'btl')}
        </>
      )}

      {/* Bridge Tab Content */}
      {activeTab === 'bridge' && (
        <>
          {renderVisibilitySection(DEFAULT_BRIDGE_ROWS, bridgeVisibleRows, handleToggleBridgeRow, handleSelectAllBridge, handleDeselectAllBridge)}
          {renderRowOrderSection(bridgeRowOrder, bridgeVisibleRows, 'bridge')}
        </>
      )}

      {/* Core Tab Content */}
      {activeTab === 'core' && (
        <>
          {renderVisibilitySection(DEFAULT_CORE_ROWS, coreVisibleRows, handleToggleCoreRow, handleSelectAllCore, handleDeselectAllCore)}
          {renderRowOrderSection(coreRowOrder, coreVisibleRows, 'core')}
        </>
      )}

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
