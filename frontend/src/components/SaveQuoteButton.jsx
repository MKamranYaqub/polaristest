import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { saveQuote, updateQuote } from '../utils/quotes';
import { useAuth } from '../contexts/AuthContext';
import ModalShell from './ModalShell';

// SaveQuoteButton shows a small modal to collect { name, borrowerName, applicantNames, notes }
// If `existingQuote` prop provided (object with id), the button will perform an update instead of create.
export default function SaveQuoteButton({
  calculatorType = 'BTL',
  calculationData = {},
  allColumnData = [],
  bestSummary = null,
  existingQuote = null,
  showProductRangeSelection = false,
  onSaved = null,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [borrowerType, setBorrowerType] = useState('Personal');
  const [borrowerName, setBorrowerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [productRange, setProductRange] = useState('specialist'); // Core or Specialist
  const getUserName = () => user?.name || 'Unknown User';
  
  // Success modal state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ refNumber: '', timestamp: '', date: '' });

  useEffect(() => {
    if (existingQuote) {
      setName(existingQuote.name || '');
      // Read borrower info from the new flat structure
      setBorrowerType(existingQuote.borrower_type || 'Personal');
      setBorrowerName(existingQuote.borrower_name || '');
      setCompanyName(existingQuote.company_name || '');
      setNotes(existingQuote.notes || '');
      setProductRange(existingQuote.selected_range || calculationData.selectedRange || 'specialist');
    } else {
      // For new quotes, default to current selectedRange from calculationData
      setProductRange(calculationData.selectedRange || 'specialist');
      
      // For new quotes, ensure name is empty initially, rather than auto-populating
      if (!existingQuote) {
        setName('');
      }
    }
  }, [existingQuote, calculationData.selectedRange]);

  const openForm = () => setOpen(true);
  const closeForm = () => setOpen(false);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setError(null);
    if (!name || name.trim().length === 0) {
      setError('Please provide a name for the quote');
      return;
    }
    setSaving(true);
    try {
      // Helper to parse numeric values from formatted strings
      const parseNumeric = (val) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : null;
      };

      const normalizedCalculatorType = (calculatorType || '').toString().toLowerCase();

      const sanitizeValue = (value) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value : undefined;
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }
        if (typeof value === 'boolean') {
          return value;
        }
        return value;
      };

      const sanitizeObject = (input) => {
        if (Array.isArray(input)) {
          const sanitizedArray = input
            .map(item => (typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeValue(item)))
            .filter(item => {
              if (item === undefined) return false;
              if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) return false;
              return true;
            });
          return sanitizedArray.length > 0 ? sanitizedArray : undefined;
        }

        if (input && typeof input === 'object') {
          return Object.entries(input).reduce((acc, [key, value]) => {
            const sanitized = Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof Date))
              ? sanitizeObject(value)
              : sanitizeValue(value);

            if (sanitized !== undefined) {
              acc[key] = sanitized;
            }
            return acc;
          }, {});
        }

        return sanitizeValue(input);
      };

      // Map calculator fields to database columns
      const quoteData = {
        name,
        calculator_type: normalizedCalculatorType,
        status: 'draft',
        // Client details (from calculators)
        client_type: calculationData.clientType || null, // 'Direct' or 'Broker'
        client_first_name: calculationData.clientFirstName || null,
        client_last_name: calculationData.clientLastName || null,
        client_email: calculationData.clientEmail || null,
        client_contact_number: calculationData.clientContact || null,
        broker_company_name: calculationData.brokerCompanyName || null,
        broker_route: calculationData.brokerRoute || null, // Direct Broker | Mortgage club | Network | Packager
        broker_commission_percent: calculationData.brokerCommissionPercent != null ? Number(calculationData.brokerCommissionPercent) : null,
        borrower_type: borrowerType,
        borrower_name: borrowerType === 'Personal' ? borrowerName : null,
        company_name: borrowerType === 'Company' ? companyName : null,
        notes: notes || null,
        created_by: user?.name || 'Unknown User', // Get name from authenticated user
        created_by_id: user?.id || null, // Store user ID for tracking
      };

      // Debug: Log user info being saved
      console.log('💾 Saving quote with user info:', {
        created_by: quoteData.created_by,
        created_by_id: quoteData.created_by_id,
        user: user
      });

      // Add BTL-specific fields
      if (normalizedCalculatorType === 'btl') {
        quoteData.product_scope = calculationData.productScope || null;
        quoteData.retention_choice = calculationData.retentionChoice || null;
        quoteData.retention_ltv = calculationData.retentionLtv ? Number(calculationData.retentionLtv) : null;
        quoteData.tier = calculationData.tier ? Number(calculationData.tier) : null;
        quoteData.property_value = parseNumeric(calculationData.propertyValue);
        quoteData.monthly_rent = parseNumeric(calculationData.monthlyRent);
        quoteData.top_slicing = parseNumeric(calculationData.topSlicing);
        quoteData.loan_calculation_requested = calculationData.loanType || null;
        quoteData.specific_gross_loan = parseNumeric(calculationData.specificGrossLoan);
        quoteData.specific_net_loan = parseNumeric(calculationData.specificNetLoan);
        quoteData.target_ltv = calculationData.targetLtv ? Number(calculationData.targetLtv) : null;
        quoteData.product_type = calculationData.productType || null;
        quoteData.add_fees_toggle = calculationData.addFeesToggle || false;
        quoteData.fee_calculation_type = calculationData.feeCalculationType || null;
        quoteData.additional_fee_amount = parseNumeric(calculationData.additionalFeeAmount);
        quoteData.selected_range = productRange; // Use the selected product range from UI
        // Serialize criteria answers as JSON string
        quoteData.criteria_answers = calculationData.answers ? JSON.stringify(calculationData.answers) : null;
        
        // Filter rates by selected product range before saving
        let ratesToSave = calculationData.relevantRates || [];
        if (showProductRangeSelection && ratesToSave.length > 0) {
          ratesToSave = ratesToSave.filter(rate => {
            const rateType = (rate.rate_type || rate.type || '').toString().toLowerCase();
            if (productRange === 'core') {
              return rateType === 'core' || rateType.includes('core');
            } else {
              return rateType === 'specialist' || rateType.includes('specialist') || !rateType || rateType === '';
            }
          });
        }
        
        quoteData.rates_and_products = ratesToSave ? JSON.stringify(ratesToSave) : null;
        
        // Prepare all rate results for saving to quote_results table (filtered by product range)
        if (ratesToSave && Array.isArray(ratesToSave)) {
          quoteData.results = ratesToSave.map(rate => ({
            fee_column: rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== '' 
              ? String(rate.product_fee) 
              : null,
            gross_loan: parseNumeric(rate.gross_loan),
            net_loan: parseNumeric(rate.net_loan),
            ltv_percentage: parseNumeric(rate.ltv),
            net_ltv: parseNumeric(rate.net_ltv),
            property_value: parseNumeric(rate.property_value),
            icr: parseNumeric(rate.icr),
            initial_rate: parseNumeric(rate.initial_rate || rate.rate),
            pay_rate: parseNumeric(rate.pay_rate),
            revert_rate: parseNumeric(rate.revert_rate),
            revert_rate_dd: parseNumeric(rate.revert_rate_dd),
            full_rate: parseNumeric(rate.full_rate),
            aprc: parseNumeric(rate.aprc),
            product_fee_percent: parseNumeric(rate.product_fee_percent || rate.product_fee),
            product_fee_pounds: parseNumeric(rate.product_fee_pounds),
            admin_fee: parseNumeric(rate.admin_fee),
            broker_client_fee: parseNumeric(rate.broker_client_fee),
            broker_commission_proc_fee_percent: parseNumeric(rate.broker_commission_proc_fee_percent),
            broker_commission_proc_fee_pounds: parseNumeric(rate.broker_commission_proc_fee_pounds),
            commitment_fee_pounds: parseNumeric(rate.commitment_fee_pounds),
            exit_fee: parseNumeric(rate.exit_fee),
            monthly_interest_cost: parseNumeric(rate.monthly_interest_cost),
            rolled_months: parseNumeric(rate.rolled_months),
            rolled_months_interest: parseNumeric(rate.rolled_months_interest),
            deferred_interest_percent: parseNumeric(rate.deferred_interest_percent),
            deferred_interest_pounds: parseNumeric(rate.deferred_interest_pounds),
            serviced_interest: parseNumeric(rate.serviced_interest),
            direct_debit: rate.direct_debit || null,
            erc: rate.erc || null,
            rent: parseNumeric(rate.rent),
            top_slicing: parseNumeric(rate.top_slicing),
            nbp: parseNumeric(rate.nbp),
            total_cost_to_borrower: parseNumeric(rate.total_cost_to_borrower),
            total_loan_term: parseNumeric(rate.total_loan_term),
            product_name: rate.product_name || rate.product || null,
          }));
        }
      }

      // Add Bridging-specific fields
      if (normalizedCalculatorType === 'bridging' || normalizedCalculatorType === 'bridge') {
        quoteData.product_scope = calculationData.productScope || null;
        quoteData.property_value = parseNumeric(calculationData.propertyValue);
        quoteData.gross_loan = parseNumeric(calculationData.grossLoan);
        quoteData.first_charge_value = parseNumeric(calculationData.firstChargeValue);
        quoteData.monthly_rent = parseNumeric(calculationData.monthlyRent);
        quoteData.top_slicing = parseNumeric(calculationData.topSlicing);
        quoteData.use_specific_net_loan = calculationData.useSpecificNet === 'Yes' || calculationData.useSpecificNet === true;
        quoteData.specific_net_loan = parseNumeric(calculationData.specificNetLoan);
        quoteData.bridging_loan_term = calculationData.bridgingTerm ? Number(calculationData.bridgingTerm) : null;
        quoteData.charge_type = calculationData.chargeType || null;
        quoteData.sub_product = calculationData.subProduct || null;
        // Serialize criteria answers as JSON string
        quoteData.criteria_answers = calculationData.answers ? JSON.stringify(calculationData.answers) : null;
        
        // Prepare all rate results for saving to bridge_quote_results table
        if (calculationData.results && Array.isArray(calculationData.results)) {
          console.log('SaveQuoteButton - Bridging results count:', calculationData.results.length);
          
          quoteData.results = calculationData.results.map(rate => ({
            fee_column: rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== '' 
              ? String(rate.product_fee) 
              : null,
            gross_loan: parseNumeric(rate.gross_loan),
            net_loan: parseNumeric(rate.net_loan),
            ltv_percentage: parseNumeric(rate.ltv || rate.ltv_percentage),
            net_ltv: parseNumeric(rate.net_ltv),
            property_value: parseNumeric(rate.property_value),
            icr: parseNumeric(rate.icr),
            initial_rate: parseNumeric(rate.initial_rate || rate.rate),
            pay_rate: parseNumeric(rate.pay_rate),
            revert_rate: parseNumeric(rate.revert_rate),
            revert_rate_dd: parseNumeric(rate.revert_rate_dd),
            full_rate: parseNumeric(rate.full_rate),
            aprc: parseNumeric(rate.aprc),
            product_fee_percent: parseNumeric(rate.product_fee_percent || rate.product_fee),
            product_fee_pounds: parseNumeric(rate.product_fee_pounds),
            admin_fee: parseNumeric(rate.admin_fee),
            broker_client_fee: parseNumeric(rate.broker_client_fee),
            broker_commission_proc_fee_percent: parseNumeric(rate.broker_commission_proc_fee_percent),
            broker_commission_proc_fee_pounds: parseNumeric(rate.broker_commission_proc_fee_pounds),
            commitment_fee_pounds: parseNumeric(rate.commitment_fee_pounds),
            exit_fee: parseNumeric(rate.exit_fee),
            monthly_interest_cost: parseNumeric(rate.monthly_interest_cost),
            rolled_months: parseNumeric(rate.rolled_months),
            rolled_months_interest: parseNumeric(rate.rolled_months_interest || rate.rolled_interest),
            deferred_interest_percent: parseNumeric(rate.deferred_interest_percent),
            deferred_interest_pounds: parseNumeric(rate.deferred_interest_pounds || rate.deferred_interest),
            deferred_rate: parseNumeric(rate.deferred_rate),
            serviced_interest: parseNumeric(rate.serviced_interest),
            direct_debit: rate.direct_debit || null,
            erc: rate.erc || null,
            erc_fusion_only: rate.erc_fusion_only || null,
            rent: parseNumeric(rate.rent),
            top_slicing: parseNumeric(rate.top_slicing),
            nbp: parseNumeric(rate.nbp),
            total_cost_to_borrower: parseNumeric(rate.total_cost_to_borrower),
            total_loan_term: parseNumeric(rate.total_loan_term),
            product_name: rate.product_name || rate.product || null,
          }));
        }
      }

      const sanitizedQuoteData = sanitizeObject(quoteData);

      // The backend will handle which table to save to based on calculator_type
      let res;
      if (existingQuote) {
        // Update existing quote - add updated_by fields
        res = await updateQuote(existingQuote.id, { 
          ...sanitizedQuoteData, 
          updated_by: getUserName(),
          updated_by_id: user?.id || null
        });
      } else {
        // Create new quote
        res = await saveQuote(sanitizedQuoteData);
      }

      setSaving(false);
      setOpen(false);
      if (onSaved) onSaved(res.quote || res);
      
      // Display reference number and timestamp in success modal
      const quote = res.quote || res;
      const refNumber = quote.reference_number || 'N/A';
      const timestamp = existingQuote ? 'updated' : 'created';
      const date = new Date(quote.updated_at || quote.created_at).toLocaleString();
      
      setSuccessMessage({ refNumber, timestamp, date });
      setShowSuccess(true);
    } catch (e) {
      console.error('Save failed', e);
      setError(e.message || String(e));
      setSaving(false);
    }
  };

  return (
    <div className="display-inline-block">
      <button className="slds-button slds-button_brand" onClick={openForm} disabled={saving}>{saving ? 'Saving…' : (existingQuote ? ' Update Quote' : 'Save Quote')}</button>
      
      <ModalShell
        isOpen={open}
        onClose={closeForm}
        title={existingQuote ? 'Update Quote' : 'Save Quote'}
        maxWidth="640px"
        footer={(
          <>
            <button className="slds-button slds-button_neutral" onClick={closeForm} disabled={saving}>Cancel</button>
            <button className="slds-button slds-button_brand" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : (existingQuote ? 'Update' : 'Save')}
            </button>
          </>
        )}
      >
        {error && <div className="slds-text-color_error margin-bottom-05">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="quote-name-input">Quote Name</label>
            <div className="slds-form-element__control"><input id="quote-name-input" className="slds-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>

          <div className="slds-form-element margin-top-1 padding-y-05 padding-x-05 border-radius-4 background-gray-light">
            <label className="slds-form-element__label">Created By</label>
            <div className="slds-form-element__control padding-top-025 font-weight-bold">
              {user?.name || 'N/A'}
            </div>
          </div>

          <div className="slds-form-element margin-top-1">
            <label className="slds-form-element__label">Borrower Type</label>
            <div className="slds-form-element__control">
              <select className="slds-select" value={borrowerType} onChange={(e) => setBorrowerType(e.target.value)}>
                <option value="Personal">Personal</option>
                <option value="Company">Company</option>
              </select>
            </div>
          </div>

          {borrowerType === 'Personal' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Borrower Name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} /></div>
            </div>
          )}

          {borrowerType === 'Company' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Company Name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            </div>
          )}

          {showProductRangeSelection && calculatorType === 'BTL' && (
            <div className="slds-form-element">
              <label className="slds-form-element__label">Product Range to Quote/Save</label>
              <div className="slds-form-element__control">
                <select className="slds-select" value={productRange} onChange={(e) => setProductRange(e.target.value)}>
                  <option value="specialist">Specialist</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <div className="slds-form-element__help slds-text-body_small helper-text margin-top-025">
                Only rates from the selected product range will be saved with this quote
              </div>
            </div>
          )}

          <div className="slds-form-element">
            <label className="slds-form-element__label">Notes</label>
            <div className="slds-form-element__control"><textarea className="slds-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>

        </form>
      </ModalShell>

      {/* Success Modal */}
      <ModalShell
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Quote saved successfully!"
        maxWidth="500px"
        footer={(
          <button className="slds-button slds-button_brand" onClick={() => setShowSuccess(false)}>
            OK
          </button>
        )}
      >
        <div className="padding-y-1">
          <div className="margin-bottom-1">
            <strong className="display-block margin-bottom-05 text-color-dark">Reference:</strong>
            <span className="font-size-large text-color-primary">{successMessage.refNumber}</span>
          </div>
          <div>
            <strong className="display-block margin-bottom-05 text-color-dark">
              {successMessage.timestamp === 'created' ? 'Created:' : 'Updated:'}
            </strong>
            <span className="helper-text">{successMessage.date}</span>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

SaveQuoteButton.propTypes = {
  calculatorType: PropTypes.oneOf(['bridging', 'btl', 'BTL', 'BRIDGING', 'BRIDGE']).isRequired,
  calculationData: PropTypes.shape({
    // Common fields
    propertyValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    monthlyRent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    topSlicing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productScope: PropTypes.string,
    selectedRange: PropTypes.string,
    answers: PropTypes.object,
    // Client details
    clientType: PropTypes.string,
    clientFirstName: PropTypes.string,
    clientLastName: PropTypes.string,
    clientEmail: PropTypes.string,
    clientContact: PropTypes.string,
    brokerCompanyName: PropTypes.string,
    brokerRoute: PropTypes.string,
    brokerCommissionPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // BTL-specific
    retentionChoice: PropTypes.string,
    retentionLtv: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tier: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    loanType: PropTypes.string,
    specificGrossLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    specificNetLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    targetLtv: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productType: PropTypes.string,
    addFeesToggle: PropTypes.bool,
    feeCalculationType: PropTypes.string,
    additionalFeeAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    relevantRates: PropTypes.arrayOf(PropTypes.object),
    // Bridging-specific
    grossLoan: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    firstChargeValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    useSpecificNet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    bridgingTerm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chargeType: PropTypes.string,
    subProduct: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  allColumnData: PropTypes.arrayOf(PropTypes.object).isRequired,
  bestSummary: PropTypes.shape({
    lender: PropTypes.string,
    monthlyRate: PropTypes.number,
    annualRate: PropTypes.number,
    product: PropTypes.string,
    criteria: PropTypes.string,
  }),
  existingQuote: PropTypes.shape({
    id: PropTypes.string,
    reference_number: PropTypes.string,
    calculator_type: PropTypes.string,
    calculation_data: PropTypes.object,
    name: PropTypes.string,
    borrower_type: PropTypes.string,
    borrower_name: PropTypes.string,
    company_name: PropTypes.string,
    notes: PropTypes.string,
    selected_range: PropTypes.string,
    status: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
  showProductRangeSelection: PropTypes.bool,
  onSaved: PropTypes.func,
};

SaveQuoteButton.defaultProps = {
  bestSummary: null,
  existingQuote: null,
  showProductRangeSelection: false,
  onSaved: null,
};
