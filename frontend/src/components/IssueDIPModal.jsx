import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import NotificationModal from './NotificationModal';

export default function IssueDIPModal({ 
  isOpen, 
  onClose, 
  quoteId, 
  calculatorType,
  existingDipData = {},
  availableFeeTypes = [], // For BTL: array of fee percentages, For Bridge: ['Fusion', 'Variable Bridge', 'Fixed Bridge']
  allRates = [], // All relevant rates for filtering
  showProductRangeSelection = false, // Show product range selection for BTL
  onSave,
  onCreatePDF,
  onFeeTypeSelected // Callback when fee type is selected to filter rates
}) {
  // Calculate default dates
  const getDefaultDates = () => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + 14);
    
    return {
      dipDate: today.toISOString().split('T')[0],
      dipExpiryDate: expiryDate.toISOString().split('T')[0]
    };
  };

  const defaults = getDefaultDates();

  const [formData, setFormData] = useState({
    commercial_or_main_residence: existingDipData.commercial_or_main_residence || '',
    dip_date: existingDipData.dip_date || defaults.dipDate,
    dip_expiry_date: existingDipData.dip_expiry_date || defaults.dipExpiryDate,
    guarantor_name: existingDipData.guarantor_name || '',
    lender_legal_fee: existingDipData.lender_legal_fee || '',
    number_of_applicants: existingDipData.number_of_applicants || '1',
    overpayments_percent: existingDipData.overpayments_percent || '10',
    paying_network_club: existingDipData.paying_network_club || '',
    fee_type_selection: existingDipData.fee_type_selection || '',
    product_range: existingDipData.product_range || 'specialist' // Core or Specialist
  });

  const [securityProperties, setSecurityProperties] = useState(
    existingDipData.security_properties || [{ street: '', city: '', postcode: '' }]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  
  // Postcode lookup state
  const [addressLookup, setAddressLookup] = useState({});
  const [loadingAddresses, setLoadingAddresses] = useState({});

  // Update form data when existingDipData changes (when loading a saved quote)
  useEffect(() => {
    if (existingDipData && Object.keys(existingDipData).length > 0) {
      setFormData({
        commercial_or_main_residence: existingDipData.commercial_or_main_residence || '',
        dip_date: existingDipData.dip_date || defaults.dipDate,
        dip_expiry_date: existingDipData.dip_expiry_date || defaults.dipExpiryDate,
        guarantor_name: existingDipData.guarantor_name || '',
        lender_legal_fee: existingDipData.lender_legal_fee || '',
        number_of_applicants: existingDipData.number_of_applicants ? String(existingDipData.number_of_applicants) : '1',
        overpayments_percent: existingDipData.overpayments_percent ? String(existingDipData.overpayments_percent) : '10',
        paying_network_club: existingDipData.paying_network_club || '',
        fee_type_selection: existingDipData.fee_type_selection || '',
        product_range: existingDipData.product_range || 'specialist'
      });

      if (existingDipData.security_properties && Array.isArray(existingDipData.security_properties) && existingDipData.security_properties.length > 0) {
        setSecurityProperties(existingDipData.security_properties);
      }
    }
  }, [existingDipData]);

  // Auto-calculate expiry date when DIP date changes
  useEffect(() => {
    if (formData.dip_date) {
      const dipDate = new Date(formData.dip_date);
      const expiryDate = new Date(dipDate);
      expiryDate.setDate(expiryDate.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        dip_expiry_date: expiryDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.dip_date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If fee type is selected, trigger callback to filter rates
    if (name === 'fee_type_selection' && onFeeTypeSelected) {
      onFeeTypeSelected(value);
    }
  };

  const handlePropertyChange = (index, field, value) => {
    const updatedProperties = [...securityProperties];
    updatedProperties[index][field] = value;
    setSecurityProperties(updatedProperties);
  };

  const addSecurityProperty = () => {
    setSecurityProperties([...securityProperties, { street: '', city: '', postcode: '' }]);
  };

  const removeSecurityProperty = (index) => {
    if (securityProperties.length > 1) {
      setSecurityProperties(securityProperties.filter((_, i) => i !== index));
    }
  };

  // Postcode lookup using ideal-postcodes.co.uk API (free tier)
  const handlePostcodeLookup = async (index) => {
    const postcode = securityProperties[index].postcode.trim();
    if (!postcode) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please enter a postcode first' });
      return;
    }

    setLoadingAddresses({ ...loadingAddresses, [index]: true });
    
    try {
      // Use ideal-postcodes.co.uk free API (no key required for lookups)
      const response = await fetch(`https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(postcode)}?api_key=iddqd`);
      
      if (!response.ok) {
        throw new Error('Postcode not found');
      }
      
      const data = await response.json();
      
      if (!data.result || data.result.length === 0) {
        throw new Error('No addresses found for this postcode');
      }

      // Map the addresses to our format
      const suggestions = data.result.map((addr, idx) => {
        // Build the full address line for display
        const addressParts = [
          addr.line_1,
          addr.line_2,
          addr.line_3
        ].filter(part => part && part.trim() !== '');
        
        // For street field, combine all address lines except post_town
        const streetAddress = addressParts.join(', ');
        
        return {
          display: addressParts.join(', '),
          street: streetAddress,  // Full street address with all lines
          city: addr.post_town || '',
          postcode: addr.postcode
        };
      });

      setAddressLookup({ ...addressLookup, [index]: suggestions });
      
    } catch (err) {
      console.error('Postcode lookup error:', err);
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Could not find addresses for this postcode. Please check the postcode and try again.' 
      });
      setAddressLookup({ ...addressLookup, [index]: [] });
    } finally {
      setLoadingAddresses({ ...loadingAddresses, [index]: false });
    }
  };

  const handleAddressSelect = (index, address) => {
    const updatedProperties = [...securityProperties];
    updatedProperties[index] = {
      street: address.street,
      city: address.city,
      postcode: address.postcode
    };
    setSecurityProperties(updatedProperties);
    // Clear the lookup results after selection
    setAddressLookup({ ...addressLookup, [index]: [] });
  };

  const validateForm = () => {
    if (!formData.commercial_or_main_residence) {
      setError('Please select residence type');
      return false;
    }
    if (!formData.dip_date) {
      setError('Please enter DIP date');
      return false;
    }
    if (!formData.dip_expiry_date) {
      setError('Please enter DIP expiry date');
      return false;
    }
    if (!formData.number_of_applicants) {
      setError('Please select number of applicants');
      return false;
    }
    
    // Check if at least one security property is filled
    const hasValidProperty = securityProperties.some(
      prop => prop.street.trim() || prop.city.trim() || prop.postcode.trim()
    );
    if (!hasValidProperty) {
      setError('Please enter at least one security property');
      return false;
    }

    setError('');
    return true;
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const dipData = {
        ...formData,
        security_properties: securityProperties,
        dip_status: 'Issued'
      };

      await onSave(quoteId, dipData);
      setNotification({ show: true, type: 'success', title: 'Success', message: 'DIP data saved successfully!' });
    } catch (err) {
      console.error('Error saving DIP data:', err);
      setError(err.message || 'Failed to save DIP data');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePDF = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      // First save the data
      console.log('Saving DIP data before generating PDF...');
      const dipData = {
        ...formData,
        security_properties: securityProperties,
        dip_status: 'Issued'
      };

      await onSave(quoteId, dipData);
      console.log('DIP data saved successfully, now generating PDF...');
      
      // Then generate PDF
      await onCreatePDF(quoteId);
      
      setNotification({ show: true, type: 'success', title: 'Success', message: 'DIP data saved and PDF created successfully!' });
    } catch (err) {
      console.error('Error creating DIP PDF:', err);
      setError(err.message || 'Failed to create DIP PDF');
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to create DIP PDF: ' + (err.message || 'Unknown error') });
    } finally {
      setSaving(false);
    }
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button
        className="slds-button slds-button_brand"
        onClick={handleSaveData}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Data'}
      </button>
      <button
        className="slds-button slds-button_success"
        onClick={handleCreatePDF}
        disabled={saving}
      >
        {saving ? 'Creating...' : 'Create PDF'}
      </button>
    </>
  );

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="Issue DIP (Decision in Principle)" footer={footerButtons}>
      {error && <div className="slds-notify slds-notify_alert slds-theme_error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Residence Type */}
      <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
        <label className="slds-form-element__label">
          <abbr className="slds-required" title="required">*</abbr> Commercial or Main Residence
        </label>
        <div className="slds-form-element__control">
          <select 
            className="slds-select" 
            name="commercial_or_main_residence"
            value={formData.commercial_or_main_residence}
            onChange={handleInputChange}
          >
            <option value="">Select...</option>
            <option value="Commercial">Commercial</option>
            <option value="Main Residence">Main Residence</option>
          </select>
        </div>
      </div>

      {/* DIP Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr> DIP Date
          </label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              name="dip_date"
              value={formData.dip_date}
              onChange={handleInputChange}
            />
          </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">
                <abbr className="slds-required" title="required">*</abbr> DIP Expiry Date
              </label>
              <div className="slds-form-element__control">
                <input 
                  type="date" 
                  className="slds-input" 
                  name="dip_expiry_date"
                  value={formData.dip_expiry_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Guarantor Name */}
          <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
            <label className="slds-form-element__label">Guarantor Name</label>
            <div className="slds-form-element__control">
              <input 
                type="text" 
                className="slds-input" 
                name="guarantor_name"
                value={formData.guarantor_name}
                onChange={handleInputChange}
                placeholder="Enter guarantor name"
              />
            </div>
          </div>

          {/* Lender Legal Fee and Number of Applicants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="slds-form-element">
              <label className="slds-form-element__label">Lender Legal Fee (£)</label>
              <div className="slds-form-element__control">
                <input 
                  type="number" 
                  className="slds-input" 
                  name="lender_legal_fee"
                  value={formData.lender_legal_fee}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">
                <abbr className="slds-required" title="required">*</abbr> Number of Applicants
              </label>
              <div className="slds-form-element__control">
                <select 
                  className="slds-select" 
                  name="number_of_applicants"
                  value={formData.number_of_applicants}
                  onChange={handleInputChange}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overpayments % and Paying Network/Club */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="slds-form-element">
              <label className="slds-form-element__label">Overpayments %</label>
              <div className="slds-form-element__control">
                <input 
                  type="number" 
                  className="slds-input" 
                  name="overpayments_percent"
                  value={formData.overpayments_percent}
                  onChange={handleInputChange}
                  placeholder="10"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Paying Network / Club?</label>
              <div className="slds-form-element__control">
                <select 
                  className="slds-select" 
                  name="paying_network_club"
                  value={formData.paying_network_club}
                  onChange={handleInputChange}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Range Selection - Only for BTL when both ranges available */}
          {showProductRangeSelection && calculatorType === 'BTL' && (
            <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
              <label className="slds-form-element__label">
                Product Range for DIP
              </label>
              <div className="slds-form-element__control">
                <select 
                  className="slds-select" 
                  name="product_range"
                  value={formData.product_range}
                  onChange={handleInputChange}
                >
                  <option value="specialist">Specialist</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <div className="slds-form-element__help" style={{ fontSize: '0.875rem', color: '#706e6b', marginTop: '0.25rem' }}>
                Select which product range to use for this DIP
              </div>
            </div>
          )}

          {/* Fee Type Selection */}
          <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
            <label className="slds-form-element__label">
              {calculatorType === 'BTL' ? 'Choose Fee Type' : 'Choose Product Type'}
            </label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                name="fee_type_selection"
                value={formData.fee_type_selection}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                {availableFeeTypes.map((feeType, idx) => (
                  <option key={idx} value={feeType}>{feeType}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Security Properties */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="slds-form-element__label">
              <abbr className="slds-required" title="required">*</abbr> Security Property Address
            </label>
            
            {securityProperties.map((property, index) => (
              <div key={index} style={{ 
                border: '1px solid #d8dde6', 
                padding: '1rem', 
                marginBottom: '0.5rem', 
                borderRadius: '4px',
                position: 'relative'
              }}>
                {securityProperties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSecurityProperty(index)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#c23934',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Remove
                  </button>
                )}
                
                {/* Postcode field FIRST with Find Address button */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>
                    <abbr className="slds-required" title="required">*</abbr> Postcode
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="slds-input" 
                      value={property.postcode}
                      onChange={(e) => handlePropertyChange(index, 'postcode', e.target.value.toUpperCase())}
                      placeholder="e.g. KT3 4NY"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="slds-button"
                      onClick={() => handlePostcodeLookup(index)}
                      disabled={loadingAddresses[index] || !property.postcode}
                      style={{ 
                        whiteSpace: 'nowrap',
                        backgroundColor: '#2e5aac',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '500'
                      }}
                    >
                      {loadingAddresses[index] ? 'Loading...' : 'Find Address'}
                    </button>
                  </div>
                </div>

                {/* Address selection dropdown */}
                {addressLookup[index] && addressLookup[index].length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Select Address</label>
                    <select
                      className="slds-select"
                      onChange={(e) => {
                        const selectedAddress = addressLookup[index][e.target.value];
                        if (selectedAddress) {
                          handleAddressSelect(index, selectedAddress);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Choose an address --</option>
                      {addressLookup[index].map((addr, addrIndex) => (
                        <option key={addrIndex} value={addrIndex}>
                          {addr.display}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Street</label>
                  <input 
                    type="text" 
                    className="slds-input" 
                    value={property.street}
                    onChange={(e) => handlePropertyChange(index, 'street', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>City</label>
                  <input 
                    type="text" 
                    className="slds-input" 
                    value={property.city}
                    onChange={(e) => handlePropertyChange(index, 'city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              className="slds-button slds-button_neutral" 
              onClick={addSecurityProperty}
              style={{ marginTop: '0.5rem' }}
            >
              + Add Another Property
            </button>
          </div>
    </ModalShell>
    
    <NotificationModal
      isOpen={notification.show}
      onClose={() => setNotification({ ...notification, show: false })}
      type={notification.type}
      title={notification.title}
      message={notification.message}
    />
    </>
  );
}
