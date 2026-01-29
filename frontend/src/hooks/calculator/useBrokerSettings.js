import { useState, useEffect } from 'react';
import {
  LOCALSTORAGE_CONSTANTS_KEY,
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE
} from '../../config/constants';

/**
 * useBrokerSettings - Manages broker-related state and validation
 * Handles broker routes, proc fee percentages, and additional fees
 * 
 * For BTL calculators, maintains separate proc fees for Specialist and Core ranges.
 * For Bridge calculators, uses a single proc fee.
 * 
 * @param {Object} initialQuote - Optional initial quote data to populate fields
 * @param {String} calculatorType - 'btl' (BTL Specialist), 'core' (BTL Core), or 'bridge' to determine which proc fee to use
 * @returns {Object} Broker settings state and handlers
 */
export default function useBrokerSettings(initialQuote = null, calculatorType = 'btl') {
  const [clientType, setClientType] = useState('Broker');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [brokerRoute, setBrokerRoute] = useState(BROKER_ROUTES.DIRECT_BROKER);
  
  // Separate proc fee states for BTL Specialist and Core
  const [procFeeSpecialistPercent, setProcFeeSpecialistPercent] = useState(() => {
    const defaults = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
    return typeof defaults === 'object' ? (defaults.btl ?? 0.9) : defaults;
  });
  const [procFeeCorePercent, setProcFeeCorePercent] = useState(() => {
    const defaults = BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER];
    return typeof defaults === 'object' ? (defaults.core ?? 0.5) : 0.5;
  });
  
  // Legacy alias for backwards compatibility - returns the active proc fee based on calculatorType
  const brokerCommissionPercent = calculatorType === 'core' ? procFeeCorePercent : procFeeSpecialistPercent;
  const setBrokerCommissionPercent = calculatorType === 'core' ? setProcFeeCorePercent : setProcFeeSpecialistPercent;
  
  const [brokerCompanyName, setBrokerCompanyName] = useState('');
  
  // Additional fees state
  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');

  // Get broker routes and defaults from localStorage (supports runtime updates)
  const getBrokerRoutesAndDefaults = () => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        routes: parsed?.brokerRoutes || BROKER_ROUTES,
        defaults: parsed?.brokerCommissionDefaults || BROKER_COMMISSION_DEFAULTS,
        tolerance: parsed?.brokerCommissionTolerance ?? BROKER_COMMISSION_TOLERANCE
      };
    } catch (e) {
      return {
        routes: BROKER_ROUTES,
        defaults: BROKER_COMMISSION_DEFAULTS,
        tolerance: BROKER_COMMISSION_TOLERANCE
      };
    }
  };

  // Update proc fee defaults when broker route or client type changes
  useEffect(() => {
    if (clientType === 'Broker') {
      const { defaults } = getBrokerRoutesAndDefaults();
      const routeDefaults = defaults[brokerRoute];
      if (typeof routeDefaults === 'object') {
        setProcFeeSpecialistPercent(routeDefaults.btl ?? routeDefaults.bridge ?? 0.9);
        setProcFeeCorePercent(routeDefaults.core ?? 0.5);
      } else {
        setProcFeeSpecialistPercent(routeDefaults ?? 0.9);
        setProcFeeCorePercent(0.5);
      }
    }
  }, [clientType, brokerRoute]);

  // Load initial data from quote
  useEffect(() => {
    if (!initialQuote) return;
    
    if (initialQuote.client_type) setClientType(initialQuote.client_type);
    if (initialQuote.client_first_name) setClientFirstName(initialQuote.client_first_name);
    if (initialQuote.client_last_name) setClientLastName(initialQuote.client_last_name);
    if (initialQuote.client_email) setClientEmail(initialQuote.client_email);
    if (initialQuote.client_contact_number) setClientContact(initialQuote.client_contact_number);
    if (initialQuote.broker_company_name) setBrokerCompanyName(initialQuote.broker_company_name);
    if (initialQuote.broker_route) setBrokerRoute(initialQuote.broker_route);
    // Load proc fees from quote
    if (initialQuote.proc_fee_specialist_percent != null) {
      setProcFeeSpecialistPercent(initialQuote.proc_fee_specialist_percent);
    } else if (initialQuote.broker_commission_percent != null) {
      // Backwards compatibility: use old field name
      setProcFeeSpecialistPercent(initialQuote.broker_commission_percent);
    }
    if (initialQuote.proc_fee_core_percent != null) {
      setProcFeeCorePercent(initialQuote.proc_fee_core_percent);
    }
    if (initialQuote.add_fees_toggle != null) setAddFeesToggle(initialQuote.add_fees_toggle);
    if (initialQuote.fee_calculation_type) setFeeCalculationType(initialQuote.fee_calculation_type);
    if (initialQuote.additional_fee_amount != null) {
      setAdditionalFeeAmount(String(initialQuote.additional_fee_amount));
    }
  }, [initialQuote]);

  // Handle proc fee change (no validation/clamping - user can enter any value)
  const handleProcFeeSpecialistChange = (e) => {
    const value = e.target.value;
    if (value === '' || value === '-') {
      setProcFeeSpecialistPercent(value);
      return;
    }
    setProcFeeSpecialistPercent(Number(value));
  };

  const handleProcFeeCoreChange = (e) => {
    const value = e.target.value;
    if (value === '' || value === '-') {
      setProcFeeCorePercent(value);
      return;
    }
    setProcFeeCorePercent(Number(value));
  };
  
  // Legacy handler for backwards compatibility
  const handleBrokerCommissionChange = calculatorType === 'core' ? handleProcFeeCoreChange : handleProcFeeSpecialistChange;

  // Get all broker settings as a single object for saving
  const getAllSettings = () => ({
    clientType,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientContact,
    brokerCompanyName: clientType === 'Broker' ? brokerCompanyName : null,
    brokerRoute: clientType === 'Broker' ? brokerRoute : null,
    // New field names
    procFeeSpecialistPercent: clientType === 'Broker' ? procFeeSpecialistPercent : null,
    procFeeCorePercent: clientType === 'Broker' ? procFeeCorePercent : null,
    // Legacy field name for backwards compatibility
    brokerCommissionPercent: clientType === 'Broker' ? brokerCommissionPercent : null,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount
  });

  return {
    // State
    clientType,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientContact,
    brokerRoute,
    brokerCompanyName,
    addFeesToggle,
    feeCalculationType,
    additionalFeeAmount,
    
    // New proc fee states
    procFeeSpecialistPercent,
    procFeeCorePercent,
    
    // Legacy alias (returns active proc fee based on calculatorType)
    brokerCommissionPercent,
    
    // Setters
    setClientType,
    setClientFirstName,
    setClientLastName,
    setClientEmail,
    setClientContact,
    setBrokerRoute,
    setBrokerCompanyName,
    setAddFeesToggle,
    setFeeCalculationType,
    setAdditionalFeeAmount,
    
    // New proc fee setters
    setProcFeeSpecialistPercent,
    setProcFeeCorePercent,
    
    // Legacy setter
    setBrokerCommissionPercent,
    
    // New handlers
    handleProcFeeSpecialistChange,
    handleProcFeeCoreChange,
    
    // Legacy handler
    handleBrokerCommissionChange,
    
    // Utils
    getBrokerRoutesAndDefaults,
    getAllSettings
  };
}
