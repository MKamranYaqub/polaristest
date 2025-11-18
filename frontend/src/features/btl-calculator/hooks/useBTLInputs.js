/**
 * Custom hook for managing BTL Calculator input state
 * Centralizes all input-related state management
 */

import { useState, useCallback } from 'react';

const DEFAULT_INPUTS = {
  // Property & Product inputs
  propertyValue: '',
  monthlyRent: '',
  topSlicing: '',
  
  // Product configuration
  productScope: '',
  retentionChoice: 'No',
  retentionLtv: '75',
  productType: '',
  selectedRange: 'specialist',
  
  // Loan calculation inputs
  loanType: '',
  specificGrossLoan: '',
  specificNetLoan: '',
  maxLtvInput: 75,
  
  // Additional fees
  addFeesToggle: false,
  feeCalculationType: 'pound',
  additionalFeeAmount: '',
  
  // Criteria and answers
  answers: {},
  
  // Slider controls (per-column state)
  rolledMonthsPerColumn: {},
  deferredInterestPerColumn: {},
  manualModeActivePerColumn: {},
  optimizedRolledPerColumn: {},
  optimizedDeferredPerColumn: {},
  
  // Client details
  clientDetails: {
    clientType: 'Direct',
    applicant1FirstName: '',
    applicant1LastName: '',
    applicant2FirstName: '',
    applicant2LastName: '',
    applicant3FirstName: '',
    applicant3LastName: '',
    applicant4FirstName: '',
    applicant4LastName: '',
    email: '',
    phone: '',
    notes: ''
  },
  
  // Quote tracking
  currentQuoteId: null,
  currentQuoteRef: null
};

export function useBTLInputs(initialInputs = {}) {
  const [inputs, setInputs] = useState({
    ...DEFAULT_INPUTS,
    ...initialInputs
  });

  /**
   * Update a single input field
   */
  const updateInput = useCallback((field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Update multiple input fields at once
   */
  const updateMultipleInputs = useCallback((updates) => {
    setInputs(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Update a nested field (e.g., clientDetails.firstName)
   */
  const updateNestedInput = useCallback((parent, field, value) => {
    setInputs(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  }, []);

  /**
   * Update per-column slider state
   */
  const updateColumnState = useCallback((stateKey, column, value) => {
    setInputs(prev => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        [column]: value
      }
    }));
  }, []);

  /**
   * Reset all inputs to defaults
   */
  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
  }, []);

  /**
   * Reset per-column slider states
   */
  const resetSliderStates = useCallback(() => {
    setInputs(prev => ({
      ...prev,
      rolledMonthsPerColumn: {},
      deferredInterestPerColumn: {},
      manualModeActivePerColumn: {},
      optimizedRolledPerColumn: {},
      optimizedDeferredPerColumn: {}
    }));
  }, []);

  /**
   * Load inputs from a saved quote
   */
  const loadFromQuote = useCallback((quote) => {
    if (!quote) return;

    const loadedInputs = {
      propertyValue: quote.property_value || '',
      monthlyRent: quote.monthly_rent || '',
      topSlicing: quote.top_slicing || '',
      productScope: quote.product_scope || '',
      retentionChoice: quote.retention_choice || 'No',
      retentionLtv: quote.retention_ltv || '75',
      productType: quote.product_type || '',
      selectedRange: quote.selected_range || 'specialist',
      loanType: quote.loan_calculation_requested || '',
      specificGrossLoan: quote.specific_gross_loan || '',
      specificNetLoan: quote.specific_net_loan || '',
      maxLtvInput: quote.target_ltv || 75,
      addFeesToggle: quote.add_fees_toggle || false,
      feeCalculationType: quote.fee_calculation_type || 'pound',
      additionalFeeAmount: quote.additional_fee_amount || '',
      answers: quote.criteria_answers || {},
      currentQuoteId: quote.id,
      currentQuoteRef: quote.reference_number
    };

    // Load client details if present
    if (quote.client_details) {
      loadedInputs.clientDetails = {
        ...DEFAULT_INPUTS.clientDetails,
        ...quote.client_details
      };
    }

    setInputs(prev => ({
      ...prev,
      ...loadedInputs
    }));
  }, []);

  return {
    inputs,
    updateInput,
    updateMultipleInputs,
    updateNestedInput,
    updateColumnState,
    resetInputs,
    resetSliderStates,
    loadFromQuote
  };
}
