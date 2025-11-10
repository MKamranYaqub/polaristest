import React, { useState, useEffect } from 'react';
import ModalShell from './ModalShell';
import NotificationModal from './NotificationModal';

const DEFAULT_ASSUMPTIONS = [
  'The borrower has a clean credit history.',
  'The borrower is not a first-time buyer or first-time landlord.',
  'The borrower is a UK national or a UK limited company.',
  'The property is a residential unit intended for occupancy by a single household.',
  'The valuation reflects the 180-day Vacant Possession market value or the 180-day Open Market value (whichever is lower) in its current condition.',
];

export default function IssueQuoteModal({
  isOpen,
  onClose,
  quoteId,
  calculatorType, // 'BTL' or 'Bridging'
  availableFeeRanges = [],
  existingQuoteData = {},
  onSave,
  onCreatePDF,
}) {
  const [selectedFeeRanges, setSelectedFeeRanges] = useState([]);
  const [assumptions, setAssumptions] = useState([...DEFAULT_ASSUMPTIONS]);
  const [borrowerName, setBorrowerName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingQuoteData && Object.keys(existingQuoteData).length > 0) {
        // Load existing data
        if (existingQuoteData.quote_selected_fee_ranges) {
          setSelectedFeeRanges(existingQuoteData.quote_selected_fee_ranges);
        } else {
          setSelectedFeeRanges([]);
        }
        
        if (existingQuoteData.quote_assumptions) {
          setAssumptions(existingQuoteData.quote_assumptions);
        } else {
          setAssumptions([...DEFAULT_ASSUMPTIONS]);
        }
        
        if (existingQuoteData.quote_borrower_name) {
          setBorrowerName(existingQuoteData.quote_borrower_name);
        } else if (existingQuoteData.borrower_name) {
          setBorrowerName(existingQuoteData.borrower_name);
        } else {
          setBorrowerName('');
        }
        
        if (existingQuoteData.quote_additional_notes) {
          setAdditionalNotes(existingQuoteData.quote_additional_notes);
        } else {
          setAdditionalNotes('');
        }
      } else {
        // Reset to defaults for new quote
        setSelectedFeeRanges([]);
        setAssumptions([...DEFAULT_ASSUMPTIONS]);
        setBorrowerName('');
        setAdditionalNotes('');
      }
    }
  }, [isOpen, existingQuoteData]);

  const handleFeeRangeToggle = (feeRange) => {
    setSelectedFeeRanges(prev => {
      if (prev.includes(feeRange)) {
        return prev.filter(f => f !== feeRange);
      } else {
        return [...prev, feeRange];
      }
    });
  };

  const handleAssumptionChange = (index, value) => {
    setAssumptions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddAssumption = () => {
    setAssumptions(prev => [...prev, '']);
  };

  const handleDeleteAssumption = (index) => {
    setAssumptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!quoteId) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please save the quote first before issuing a quote.' });
      return;
    }

    if (selectedFeeRanges.length === 0) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one fee range.' });
      return;
    }

    if (!borrowerName.trim()) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please enter the borrower name.' });
      return;
    }

    setIsSaving(true);
    try {
      const quoteData = {
        quote_selected_fee_ranges: selectedFeeRanges,
        quote_assumptions: assumptions.filter(a => a.trim() !== ''),
        quote_borrower_name: borrowerName.trim(),
        quote_additional_notes: additionalNotes.trim(),
        quote_issued_at: new Date().toISOString(),
        quote_status: 'Issued',
      };

      await onSave(quoteId, quoteData);
      setNotification({ show: true, type: 'success', title: 'Success', message: 'Quote data saved successfully!' });
    } catch (err) {
      console.error('Error saving quote data:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to save quote data: ' + (err.message || String(err)) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePDF = async () => {
    if (!quoteId) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please save the quote first.' });
      return;
    }

    if (selectedFeeRanges.length === 0) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one fee range.' });
      return;
    }

    if (!borrowerName.trim()) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please enter the borrower name before creating PDF.' });
      return;
    }

    setIsSaving(true);

    try {
      // Save first
      console.log('Saving quote data before generating PDF...');
      await handleSave();
      
      // Then generate PDF
      console.log('Generating Quote PDF...');
      await onCreatePDF(quoteId);
      setNotification({ show: true, type: 'success', title: 'Success', message: 'Quote data saved and PDF created successfully!' });
    } catch (err) {
      console.error('Error creating quote PDF:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to create quote PDF: ' + (err.message || String(err)) });
    } finally {
      setIsSaving(false);
    }
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onClose}>
        Cancel
      </button>
      <button
        className="slds-button slds-button_neutral"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Quote Data'}
      </button>
      <button
        className="slds-button slds-button_brand"
        onClick={handleCreatePDF}
        disabled={isSaving}
      >
        Create Quote PDF
      </button>
    </>
  );

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title={`Issue ${calculatorType} Quote`} footer={footerButtons}>
      {/* Borrower Name */}
      <div className="slds-form-element" style={{ marginBottom: '1.5rem' }}>
        <label className="slds-form-element__label">
          <span style={{ color: 'red' }}>*</span> Borrower Name
        </label>
        <div className="slds-form-element__control">
          <input
            className="slds-input"
            type="text"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="Enter borrower name"
          />
        </div>
      </div>

      {/* Fee Range Selection */}
      <div className="slds-form-element" style={{ marginBottom: '1.5rem' }}>
        <label className="slds-form-element__label">
          <span style={{ color: 'red' }}>*</span> Select Fee Ranges to Include in Quote
        </label>
        <div className="slds-form-element__control">
          {availableFeeRanges.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No fee ranges available</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {availableFeeRanges.map((feeRange) => (
                <label key={feeRange} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                          type="checkbox"
                          checked={selectedFeeRanges.includes(feeRange)}
                          onChange={() => handleFeeRangeToggle(feeRange)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span>{feeRange}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assumptions */}
            <div className="slds-form-element" style={{ marginBottom: '1.5rem' }}>
              <label className="slds-form-element__label">Assumptions</label>
              <div className="slds-form-element__control">
                {assumptions.map((assumption, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      className="slds-input"
                      type="text"
                      value={assumption}
                      onChange={(e) => handleAssumptionChange(index, e.target.value)}
                      placeholder="Enter assumption"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="slds-button slds-button_destructive"
                      onClick={() => handleDeleteAssumption(index)}
                      type="button"
                      style={{ minWidth: '80px' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  className="slds-button slds-button_neutral"
                  onClick={handleAddAssumption}
                  type="button"
                  style={{ marginTop: '0.5rem' }}
                >
                  + Add Assumption
                </button>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="slds-form-element">
              <label className="slds-form-element__label">Additional Notes</label>
              <div className="slds-form-element__control">
                <textarea
                  className="slds-textarea"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Add any additional notes here..."
                  rows="4"
                />
              </div>
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
