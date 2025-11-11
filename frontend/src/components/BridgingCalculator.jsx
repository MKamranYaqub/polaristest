import React, { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import '../styles/Calculator.scss';
import SaveQuoteButton from './SaveQuoteButton';
import IssueDIPModal from './IssueDIPModal';
import IssueQuoteModal from './IssueQuoteModal';
import CalculatorResultsPlaceholders from './CalculatorResultsPlaceholders';
import NotificationModal from './NotificationModal';
import { getQuote } from '../utils/quotes';
import { API_BASE_URL } from '../config/api';
import { 
  LOCALSTORAGE_CONSTANTS_KEY,
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE
} from '../config/constants';

export default function BridgingCalculator({ initialQuote = null }) {
  const { supabase } = useSupabase();
  const [allCriteria, setAllCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // default product type / scope for bridging
  const defaultScope = 'Bridge & Fusion';
  // start empty; we'll auto-select a sensible scope after loading criteria
  const [productScope, setProductScope] = useState('');

  // Criteria-driven questions
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  // Collapsible sections like BTL
  const [criteriaExpanded, setCriteriaExpanded] = useState(true);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = useState(true);
  const [clientDetailsExpanded, setClientDetailsExpanded] = useState(true);

  // Loan details
  const [propertyValue, setPropertyValue] = useState('');
  const [grossLoan, setGrossLoan] = useState('');
  const [firstChargeValue, setFirstChargeValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [topSlicing, setTopSlicing] = useState('');
  const [useSpecificNet, setUseSpecificNet] = useState('No');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [bridgingTerm, setBridgingTerm] = useState('');
  // rates
  const [rates, setRates] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [bridgeMatched, setBridgeMatched] = useState([]);
  const [fusionMatched, setFusionMatched] = useState([]);
  const [subProduct, setSubProduct] = useState('');
  const [subProductOptions, setSubProductOptions] = useState([]);
  const [subProductLimits, setSubProductLimits] = useState({});
  const [chargeType, setChargeType] = useState('All'); // All | First | Second

  // DIP Modal state
  const [dipModalOpen, setDipModalOpen] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  const [dipData, setDipData] = useState({});
  const [selectedFeeTypeForDip, setSelectedFeeTypeForDip] = useState('');
  const [filteredRatesForDip, setFilteredRatesForDip] = useState([]);

  // Quote Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({});
  const [currentQuoteRef, setCurrentQuoteRef] = useState(initialQuote?.reference_number || null);
  // Client details
  const [clientType, setClientType] = useState('Direct'); // 'Direct' | 'Broker'
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [brokerRoute, setBrokerRoute] = useState(BROKER_ROUTES.DIRECT_BROKER);
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER]);
  const [brokerCompanyName, setBrokerCompanyName] = useState('');
  
  // Additional fees state
  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('pound');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');
  
  // Multi-property details state
  const [multiPropertyDetailsExpanded, setMultiPropertyDetailsExpanded] = useState(true);
  const [multiPropertyRows, setMultiPropertyRows] = useState([
    { id: Date.now(), property_address: '', property_type: 'Residential', property_value: '', charge_type: 'First charge', first_charge_amount: '', gross_loan: 0 }
  ]);
  
  // Get broker routes and commission defaults from constants (supports runtime updates via Constants UI)
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

  useEffect(() => {
    if (clientType === 'Broker') {
      const { defaults } = getBrokerRoutesAndDefaults();
      setBrokerCommissionPercent(defaults[brokerRoute] ?? 0.9);
    }
  }, [clientType, brokerRoute]);

  // Validate broker commission is within tolerance
  const validateBrokerCommission = (value) => {
    const { defaults, tolerance } = getBrokerRoutesAndDefaults();
    const defaultValue = defaults[brokerRoute] ?? 0.9;
    const minValue = defaultValue - tolerance;
    const maxValue = defaultValue + tolerance;
    const numValue = Number(value);
    
    if (numValue < minValue) return Number(minValue.toFixed(1));
    if (numValue > maxValue) return Number(maxValue.toFixed(1));
    return Number(numValue.toFixed(1));
  };

  const handleBrokerCommissionChange = (e) => {
    const value = e.target.value;
    if (value === '' || value === '-') {
      setBrokerCommissionPercent(value);
      return;
    }
    const validated = validateBrokerCommission(value);
    setBrokerCommissionPercent(validated);
  };

  // Multi-property helper functions
  const calculateMultiPropertyGrossLoan = (propertyType, propertyValue, firstChargeAmount) => {
    const pv = Number(propertyValue) || 0;
    const fca = Number(firstChargeAmount) || 0;
    const maxLtv = propertyType === 'Residential' ? 0.75 : 0.70; // 75% for Residential, 70% for Commercial/Semi-Commercial
    const grossLoan = (pv * maxLtv) - fca;
    return grossLoan > 0 ? grossLoan : 0;
  };

  const handleMultiPropertyRowChange = (id, field, value) => {
    setMultiPropertyRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      
      // Parse numeric fields to remove formatting before storing
      let processedValue = value;
      if (field === 'property_value' || field === 'first_charge_amount') {
        processedValue = parseNumber(value);
        // Keep empty string if user cleared the field
        if (!Number.isFinite(processedValue)) {
          processedValue = '';
        }
      }
      
      const updated = { ...row, [field]: processedValue };
      // Recalculate gross loan when property_type, property_value, or first_charge_amount changes
      if (['property_type', 'property_value', 'first_charge_amount'].includes(field)) {
        updated.gross_loan = calculateMultiPropertyGrossLoan(
          updated.property_type,
          updated.property_value,
          updated.first_charge_amount
        );
      }
      return updated;
    }));
  };

  const addMultiPropertyRow = () => {
    setMultiPropertyRows(prev => [
      ...prev,
      { id: Date.now(), property_address: '', property_type: 'Residential', property_value: '', charge_type: 'First charge', first_charge_amount: '', gross_loan: 0 }
    ]);
  };

  const deleteMultiPropertyRow = (id) => {
    if (multiPropertyRows.length <= 1) return; // Keep at least one row
    setMultiPropertyRows(prev => prev.filter(row => row.id !== id));
  };

  // Calculate totals for multi-property
  const multiPropertyTotals = useMemo(() => {
    return multiPropertyRows.reduce((acc, row) => {
      acc.property_value += Number(row.property_value) || 0;
      acc.first_charge_amount += Number(row.first_charge_amount) || 0;
      acc.gross_loan += Number(row.gross_loan) || 0;
      return acc;
    }, { property_value: 0, first_charge_amount: 0, gross_loan: 0 });
  }, [multiPropertyRows]);

  // Check if Multi-property is set to "Yes"
  const isMultiProperty = useMemo(() => {
    const multiPropAnswer = Object.entries(answers).find(([key]) => 
      key.toLowerCase().includes('multi') && key.toLowerCase().includes('property')
    );
    if (!multiPropAnswer) return false;
    const answer = multiPropAnswer[1];
    return answer?.option_label?.toString().toLowerCase() === 'yes';
  }, [answers]);

  // Calculate available term range from bridge rates (exclude Fusion products)
  const termRange = useMemo(() => {
    console.log('=== TERM RANGE CALCULATION ===');
    console.log('Total rates loaded:', rates?.length || 0);
    
    if (!rates || rates.length === 0) {
      console.log('No rates loaded, using default fallback');
      return { min: 3, max: 18 }; // Default fallback
    }
    
    // Debug: Show first few rates with their set_key values
    console.log('Sample rates (first 3):', rates.slice(0, 3).map(r => ({
      set_key: r.set_key,
      property: r.property,
      product: r.product,
      min_term: r.min_term,
      max_term: r.max_term
    })));
    
    // Filter for Bridge products only (exclude Fusion)
    // Check both set_key and property fields for "bridge" or "bridging"
    const bridgeRates = rates.filter(r => {
      const setKey = (r.set_key || '').toLowerCase();
      const property = (r.property || '').toLowerCase();
      const isBridge = setKey.includes('bridge') || setKey.includes('bridging') || property.includes('bridge') || property.includes('bridging');
      const isFusion = setKey.includes('fusion') || property.includes('fusion');
      console.log(`Rate: set_key="${r.set_key}", property="${r.property}", isBridge=${isBridge}, isFusion=${isFusion}, include=${isBridge && !isFusion}`);
      return isBridge && !isFusion;
    });
    
    console.log('Bridge rates found (filtered):', bridgeRates.length);
    console.log('Sample bridge rate:', bridgeRates[0]);
    
    if (bridgeRates.length === 0) {
      console.log('No bridge rates found after filtering, using fallback');
      return { min: 3, max: 18 }; // Fallback if no bridge rates found
    }
    
    // Find the minimum min_term and maximum max_term across bridge rates
    const minTerms = bridgeRates.map(r => r.min_term).filter(t => t != null && !isNaN(t));
    const maxTerms = bridgeRates.map(r => r.max_term).filter(t => t != null && !isNaN(t));
    
    console.log('Min terms found:', minTerms.slice(0, 5), '(showing first 5)');
    console.log('Max terms found:', maxTerms.slice(0, 10), '(showing first 10)');
    console.log('Unique max terms:', [...new Set(maxTerms)].sort((a, b) => a - b));
    
    const minTerm = minTerms.length > 0 ? Math.min(...minTerms) : 3;
    const maxTerm = maxTerms.length > 0 ? Math.max(...maxTerms) : 18;
    
    console.log('Term range calculated:', { min: minTerm, max: maxTerm });
    console.log('=== END TERM RANGE CALCULATION ===');
    
    return { min: minTerm, max: maxTerm };
  }, [rates]);

  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('criteria_config_flat')
          .select('*');
        if (error) throw error;
        if (!mounted) return;
        setAllCriteria(data || []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    // Build question map for bridging.
    // Strategy: look for any rows that explicitly mention 'bridge' or 'fusion' in common fields
    // (product_scope, criteria_set, question_group, question_label, question_key, option_label).
    // If none found, fall back to the currently-selected productScope (if any) or show a helpful message.
    const needle = /bridge|fusion/i;
    const raw = (allCriteria || []);
    const normalizeStr = (s) => (s || '').toString().trim().toLowerCase();
    // Find explicit matches that mention bridge/fusion. If a productScope is already
    // selected, restrict explicit matches to that scope to avoid leaking rows from other scopes.
    const explicitMatches = raw.filter((r) => {
      if (!r) return false;
      const fields = [r.product_scope, r.criteria_set, r.question_group, r.question_label, r.question_key, r.option_label];
      const mentions = fields.some(f => typeof f === 'string' && needle.test(f));
      if (!mentions) return false;
      if (productScope) {
        // only keep explicit matches within the selected product scope
        return normalizeStr(r.product_scope) === normalizeStr(productScope);
      }
      return true;
    });

    // If we have explicit matches, prefer those. Otherwise, if a productScope is selected, use rows matching that scope.
    let filtered = explicitMatches;
    if (filtered.length === 0 && productScope) {
      filtered = raw.filter(r => normalizeStr(r.product_scope) === normalizeStr(productScope));
    }

    const map = {};
    filtered.forEach((row) => {
      const key = row.question_key || row.question_label || 'unknown';
      if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
      if (!map[key].infoTip && (row.info_tip || row.helper)) map[key].infoTip = row.info_tip || row.helper || '';
      if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
        const parsed = Number(row.display_order);
        map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
      }
      // dedupe options by option_label (case-insensitive) or id
      const optLabel = (row.option_label || '').toString().trim().toLowerCase();
      const exists = map[key].options.some(o => (o.id && o.id === row.id) || ((o.option_label || '').toString().trim().toLowerCase() === optLabel));
      if (!exists) map[key].options.push({ id: row.id, option_label: row.option_label, raw: row });
    });
    
    // Always include Charge Type question from any product scope if it exists
    const chargeTypeRows = raw.filter(r => {
      const key = r.question_key || r.question_label || '';
      return /charge[-_ ]?type|chargetype/i.test(key);
    });
    if (chargeTypeRows.length > 0 && !map['chargeType'] && !map['Charge Type']) {
      chargeTypeRows.forEach((row) => {
        const key = row.question_key || row.question_label || 'chargeType';
        if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
        if (!map[key].infoTip && (row.info_tip || row.helper)) map[key].infoTip = row.info_tip || row.helper || '';
        if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
          const parsed = Number(row.display_order);
          map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
        }
        const optLabel = (row.option_label || '').toString().trim().toLowerCase();
        const exists = map[key].options.some(o => (o.id && o.id === row.id) || ((o.option_label || '').toString().trim().toLowerCase() === optLabel));
        if (!exists) map[key].options.push({ id: row.id, option_label: row.option_label, raw: row });
      });
    }

    Object.keys(map).forEach(k => {
      map[k].options.sort((a, b) => (a.option_label || '').localeCompare(b.option_label || ''));
    });

    setQuestions(map);
    // reset answers ONLY if there's no initialQuote (i.e., new quote, not loading existing)
    if (!initialQuote) {
      const starting = {};
      Object.keys(map).forEach(k => { starting[k] = map[k].options[0] || null; });
      setAnswers(starting);
    }
  }, [allCriteria, productScope, initialQuote]);

  // Auto-select productScope intelligently after criteria load: prefer an explicit scope that mentions bridge/fusion
  useEffect(() => {
    if (!allCriteria || allCriteria.length === 0) return;
    const needle = /bridge|fusion/i;
    const scopes = Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean)));
    const explicit = scopes.find(s => needle.test(s));
    if (explicit) {
      setProductScope(explicit);
      return;
    }
    // fallback: choose first available scope if none explicitly references bridge/fusion
    if (!productScope && scopes.length > 0) setProductScope(scopes[0]);
  }, [allCriteria]);

  // If an initialQuote is provided, populate fields from the database structure
  useEffect(() => {
    try {
      if (!initialQuote) return;
      
      // New structure: data is directly on the quote object (no nested payload)
      const quote = initialQuote;
      
      // Store quote ID and DIP data for Issue DIP modal
      if (quote.id) setCurrentQuoteId(quote.id);
      if (quote.commercial_or_main_residence || quote.dip_date || quote.dip_expiry_date) {
        setDipData({
          commercial_or_main_residence: quote.commercial_or_main_residence,
          dip_date: quote.dip_date,
          dip_expiry_date: quote.dip_expiry_date,
          guarantor_name: quote.guarantor_name,
          lender_legal_fee: quote.lender_legal_fee,
          number_of_applicants: quote.number_of_applicants,
          overpayments_percent: quote.overpayments_percent,
          paying_network_club: quote.paying_network_club,
          security_properties: quote.security_properties,
          fee_type_selection: quote.fee_type_selection,
          dip_status: quote.dip_status
        });
      }
      
      if (quote.property_value != null) setPropertyValue(formatCurrencyInput(quote.property_value));
      if (quote.gross_loan != null) setGrossLoan(formatCurrencyInput(quote.gross_loan));
      if (quote.first_charge_value != null) setFirstChargeValue(formatCurrencyInput(quote.first_charge_value));
      if (quote.monthly_rent != null) setMonthlyRent(formatCurrencyInput(quote.monthly_rent));
      if (quote.top_slicing != null) setTopSlicing(String(quote.top_slicing));
      if (quote.use_specific_net_loan != null) setUseSpecificNet(quote.use_specific_net_loan ? 'Yes' : 'No');
      if (quote.specific_net_loan != null) setSpecificNetLoan(formatCurrencyInput(quote.specific_net_loan));
      if (quote.bridging_loan_term != null) setBridgingTerm(String(quote.bridging_loan_term));
      if (quote.product_scope) setProductScope(quote.product_scope);
      if (quote.charge_type) setChargeType(quote.charge_type);
      if (quote.sub_product) setSubProduct(quote.sub_product);
      
      // Load client details if available
      if (quote.client_type) setClientType(quote.client_type);
      if (quote.client_first_name) setClientFirstName(quote.client_first_name);
      if (quote.client_last_name) setClientLastName(quote.client_last_name);
      if (quote.client_email) setClientEmail(quote.client_email);
      if (quote.client_contact_number) setClientContact(quote.client_contact_number);
      if (quote.broker_company_name) setBrokerCompanyName(quote.broker_company_name);
      if (quote.broker_route) setBrokerRoute(quote.broker_route);
      if (quote.broker_commission_percent != null) setBrokerCommissionPercent(quote.broker_commission_percent);
      
      // Load multi-property details if available
      if (quote.id) {
        supabase
          .from('bridge_multi_property_details')
          .select('*')
          .eq('bridge_quote_id', quote.id)
          .order('row_order', { ascending: true })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              const loadedRows = data.map(row => ({
                id: row.id,
                property_address: row.property_address || '',
                property_type: row.property_type || 'Residential',
                property_value: row.property_value || '',
                charge_type: row.charge_type || 'First charge',
                first_charge_amount: row.first_charge_amount || '',
                gross_loan: row.gross_loan || 0
              }));
              setMultiPropertyRows(loadedRows);
            }
          });
      }
      
      // Load calculated results if available (from bridge_quote_results table)
      if (quote.results && Array.isArray(quote.results) && quote.results.length > 0) {
        // Map database results back to the format expected by the calculator
        const loadedRates = quote.results.map(result => ({
          product_fee: result.fee_column,
          gross_loan: result.gross_loan,
          net_loan: result.net_loan,
          ltv: result.ltv_percentage,
          ltv_percentage: result.ltv_percentage,
          net_ltv: result.net_ltv,
          property_value: result.property_value,
          icr: result.icr,
          initial_rate: result.initial_rate,
          rate: result.initial_rate,
          pay_rate: result.pay_rate,
          revert_rate: result.revert_rate,
          revert_rate_dd: result.revert_rate_dd,
          full_rate: result.full_rate,
          aprc: result.aprc,
          product_fee_percent: result.product_fee_percent,
          product_fee_pounds: result.product_fee_pounds,
          admin_fee: result.admin_fee,
          broker_client_fee: result.broker_client_fee,
          broker_commission_proc_fee_percent: result.broker_commission_proc_fee_percent,
          broker_commission_proc_fee_pounds: result.broker_commission_proc_fee_pounds,
          commitment_fee_pounds: result.commitment_fee_pounds,
          exit_fee: result.exit_fee,
          monthly_interest_cost: result.monthly_interest_cost,
          rolled_months: result.rolled_months,
          rolled_months_interest: result.rolled_months_interest || result.rolled_interest,
          rolled_interest: result.rolled_months_interest || result.rolled_interest,
          deferred_interest_percent: result.deferred_interest_percent,
          deferred_interest_pounds: result.deferred_interest_pounds || result.deferred_interest,
          deferred_interest: result.deferred_interest_pounds || result.deferred_interest,
          deferred_rate: result.deferred_rate,
          serviced_interest: result.serviced_interest,
          direct_debit: result.direct_debit,
          erc: result.erc,
          erc_fusion_only: result.erc_fusion_only,
          rent: result.rent,
          top_slicing: result.top_slicing,
          nbp: result.nbp,
          total_cost_to_borrower: result.total_cost_to_borrower,
          total_loan_term: result.total_loan_term,
          product_name: result.product_name,
          product: result.product_name,
        }));
        setRelevantRates(loadedRates);
      }
      
      // Load criteria answers if available
      if (quote.criteria_answers) {
        try {
          const answersData = typeof quote.criteria_answers === 'string' 
            ? JSON.parse(quote.criteria_answers) 
            : quote.criteria_answers;
          if (answersData) setAnswers(answersData);
        } catch (e) {
          console.debug('Failed to parse criteria_answers', e);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('Bridging: failed to apply initial quote', e);
    }
  }, [initialQuote]);

  const handleAnswerChange = (key, idx) => {
    setAnswers(prev => ({ ...prev, [key]: questions[key].options[idx] }));
  };

  const parseNumber = (v) => {
    if (v === undefined || v === null || v === '') return NaN;
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };

  const formatCurrencyInput = (v) => {
    const n = parseNumber(v);
    return Number.isFinite(n) ? n.toLocaleString('en-GB') : '';
  };

  const computeLoanLtv = () => {
    const pv = parseNumber(propertyValue);
    if (!Number.isFinite(pv) || pv <= 0) return NaN;
    const loanAmount = parseNumber(specificNetLoan) || parseNumber(grossLoan);
    const firstCharge = parseNumber(firstChargeValue) || 0;
    if (!Number.isFinite(loanAmount) || loanAmount <= 0) return NaN;
    // LTV = (Gross Loan + First Charge Value) / Property Value × 100
    return ((loanAmount + firstCharge) / pv) * 100;
  };

  const computeLoanSize = () => {
    const loanAmount = parseNumber(specificNetLoan) || parseNumber(grossLoan);
    return Number.isFinite(loanAmount) ? loanAmount : NaN;
  };

  // Determine mode: Fusion vs Bridge. set_key (criteria_set) differentiates but is not used for filtering
  const computeModeFromAnswers = () => {
    // If any selected answer originates from a criteria row whose criteria_set mentions 'fusion', treat as Fusion
    const vals = Object.values(answers || {});
    for (const v of vals) {
      if (v && v.raw && v.raw.criteria_set && /fusion/i.test(String(v.raw.criteria_set))) return 'Fusion';
    }
    return 'Bridge';
  };

  // Fetch rates for Bridging: filter depending on mode
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    async function loadRates() {
      try {
        // load bridge & fusion rates (not BTL rates)
        const { data, error } = await supabase.from('bridge_fusion_rates_full').select('*');
        if (error) throw error;
        if (!mounted) return;
        setRates(data || []);
        // derive sub-product options (prefer `product` field in rates as the sub-product identifier)
        const discovered = new Set();
        (data || []).forEach(r => {
          const canonical = (r.product || r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.property || '').toString().trim();
          if (canonical) discovered.add(canonical);
        });
        const options = Array.from(discovered).sort((a,b) => String(a).localeCompare(String(b)));
        setSubProductOptions(options);
        // derive loan/LTV limits per sub-product from the rates dataset
        const limits = {};
        const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        (data || []).forEach(r => {
          const name = (r.product || r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.property || '').toString().trim();
          if (!name) return;
          const key = normalizeKey(name);
          if (!limits[key]) limits[key] = { name: name, minLoan: Infinity, maxLoan: -Infinity, minLtv: Infinity, maxLtv: -Infinity };
          const minLoan = parseNumber(r.min_loan ?? r.minloan ?? r.min_loan_amt ?? r.min_loan_amount);
          const maxLoan = parseNumber(r.max_loan ?? r.maxloan ?? r.max_loan_amt ?? r.max_loan_amount);
          const minLtv = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
          const maxLtv = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
          if (Number.isFinite(minLoan)) limits[key].minLoan = Math.min(limits[key].minLoan, minLoan);
          if (Number.isFinite(maxLoan)) limits[key].maxLoan = Math.max(limits[key].maxLoan, maxLoan);
          if (Number.isFinite(minLtv)) limits[key].minLtv = Math.min(limits[key].minLtv, minLtv);
          if (Number.isFinite(maxLtv)) limits[key].maxLtv = Math.max(limits[key].maxLtv, maxLtv);
        });
        // normalize infinities to null and attach to state
        Object.keys(limits).forEach(k => {
          if (limits[k].minLoan === Infinity) limits[k].minLoan = null;
          if (limits[k].maxLoan === -Infinity) limits[k].maxLoan = null;
          if (limits[k].minLtv === Infinity) limits[k].minLtv = null;
          if (limits[k].maxLtv === -Infinity) limits[k].maxLtv = null;
        });
        setSubProductLimits(limits);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Bridging: failed to load rates', err);
      }
    }
    loadRates();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    // when second-charge is selected, clear subProduct and disable sub-product selection in UI
    if ((chargeType || '').toString().toLowerCase() === 'second') {
      setSubProduct('');
    }
  }, [chargeType]);

  // Derive chargeType and subProduct from criteria answers when present.
  // Criteria questions may include a 'Charge type' question or a 'Sub-product' question.
  // Prefer explicit question keys/labels that mention 'charge' or 'sub-product'.
  useEffect(() => {
    try {
      const entries = Object.entries(answers || {});
      let derivedCharge = null;
      let derivedSub = null;
      for (const [qk, sel] of entries) {
        if (!sel) continue;
        const raw = sel.raw || {};
        const qlabel = (raw.question_label || raw.question_key || qk || '').toString().toLowerCase();
        const opt = (sel.option_label || '').toString().toLowerCase();

        // Charge detection: check question label/key or option label for 'charge' or 'first/second'
        if (!derivedCharge && /charge|first|second|2nd/i.test(qlabel + ' ' + opt)) {
          if (/second/i.test(opt) || /second/i.test(qlabel)) derivedCharge = 'Second';
          else if (/first/i.test(opt) || /first/i.test(qlabel)) derivedCharge = 'First';
          else derivedCharge = 'All';
        }

        // Sub-product detection: question mentions sub-product, subproduct, property type, or similar
        if (derivedSub === null && /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(qlabel)) {
          derivedSub = sel.option_label || '';
        }
      }

      if (derivedCharge) {
        setChargeType(prev => (prev === derivedCharge ? prev : derivedCharge));
      }
      if (derivedSub !== null) {
        setSubProduct(prev => (prev === derivedSub ? prev : derivedSub || ''));
      }
    } catch (e) {
      // swallow errors silently to avoid breaking UI
      // eslint-disable-next-line no-console
      console.debug('Bridging: criteria-derive effect error', e);
    }
  }, [answers]);

  useEffect(() => {
    // filter rates whenever inputs or answers change
    const raw = rates || [];
    const mode = computeModeFromAnswers();
    const loanLtv = computeLoanLtv();
    const loanSize = computeLoanSize();
    const parsedSub = (subProduct || '').toString().toLowerCase();
    const parsedCharge = (chargeType || 'All').toString().toLowerCase();

    // Bridge: productScope + (Charge type filtered to Bridge-style rows) + sub-product + LTV
    const bridgeOut = raw.filter((r) => {
      if (productScope) {
        const ps = (r.product_scope || r.property || r.set_key || '').toString().toLowerCase();
        if (!ps.includes(productScope.toString().toLowerCase())) return false;
      }
      // Exclude Fusion sets from Bridge. Check for set_key === 'Fusion', 'fusion', etc.
      const setKeyStr = (r.set_key || '').toString().toLowerCase();
      if (setKeyStr === 'fusion') return false;
      
      // Only include rates with set_key of 'Bridging_Fix', 'Bridging_Var', or similar bridge-related keys
      // (not 'Fusion')
      const isBridgeRate = setKeyStr.includes('bridging') || setKeyStr.includes('bridge');
      if (!isBridgeRate) return false;
      
      // charge type handling: allow All/First/Second. Detect second-charge deterministically by checking
      // the product/type fields (CSV uses product="Second Charge"). Fall back to legacy boolean flags.
  const isSecondFlag = (r.second_charge === true) || (r.is_second === true);
  // Prefer explicit `charge_type` column when present; fall back to product/type/other heuristics
  const looksLikeSecond = /second/i.test(String(r.charge_type || r.product || r.type || r.charge || r.tier || ''));
  const isSecond = isSecondFlag || looksLikeSecond;
      if (parsedCharge === 'second') {
        if (!isSecond) return false;
      }
      if (parsedCharge === 'first') {
        if (isSecond) return false;
      }
      // sub-product: skip sub-product filtering when Second charge is selected (second-charge rates should not be restricted by sub-product)
      if (parsedCharge !== 'second' && parsedSub) {
        const s = (r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.product || '').toString().toLowerCase();
        if (!s.includes(parsedSub)) return false;
      }
      // LTV filtering
      const rowMin = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
      const rowMax = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
      if (Number.isFinite(loanLtv)) {
        if (Number.isFinite(rowMin) && loanLtv < rowMin) return false;
        if (Number.isFinite(rowMax) && loanLtv > rowMax) return false;
      }
      return true;
    });

    // Fusion: productScope + loan size range
    const fusionOut = raw.filter((r) => {
      // if user requested second-charge only, do not show any Fusion products
      if (parsedCharge === 'second') return false;
      if (productScope) {
        const ps = (r.product_scope || r.property || r.set_key || '').toString().toLowerCase();
        if (!ps.includes(productScope.toString().toLowerCase())) return false;
      }
      // Only include rows that belong to Fusion sets: require set_key === 'Fusion' for determinism.
      const setKeyStr2 = (r.set_key || '').toString().toLowerCase();
      if (setKeyStr2 !== 'fusion') return false;
      // Fusion rates are based on loan size and should NOT be restricted by sub-product selection.
      const rowMinLoan = parseNumber(r.min_loan ?? r.minloan ?? r.min_loan_amt ?? r.min_loan_amount);
      const rowMaxLoan = parseNumber(r.max_loan ?? r.maxloan ?? r.max_loan_amt ?? r.max_loan_amount);
      if (Number.isFinite(loanSize)) {
        if (Number.isFinite(rowMinLoan) && loanSize < rowMinLoan) return false;
        if (Number.isFinite(rowMaxLoan) && loanSize > rowMaxLoan) return false;
      }
      return true;
    });

    setBridgeMatched(bridgeOut);
    setFusionMatched(fusionOut);
    setRelevantRates([...bridgeOut, ...fusionOut]);
  }, [rates, productScope, subProduct, propertyValue, grossLoan, specificNetLoan, answers, chargeType]);

  // Compute calculated rates with all financial values for Bridging
  const calculatedRates = useMemo(() => {
    if (!relevantRates || relevantRates.length === 0) return [];

    const pv = parseNumber(propertyValue);
    const grossInput = parseNumber(grossLoan);
    const specificNet = parseNumber(specificNetLoan);
    const monthlyRentNum = parseNumber(monthlyRent);
    const topSlicingNum = parseNumber(topSlicing);

    return relevantRates.map(rate => {
      // Gross loan - use the input value
      const gross = grossInput;

      // Product fee calculations
      const pfPercent = Number(rate.product_fee);
      const pfAmount = Number.isFinite(gross) && !Number.isNaN(pfPercent) ? gross * (pfPercent / 100) : NaN;
      
      // Admin fee
      const adminFee = Number(rate.admin_fee) || 0;

      // Net loan calculation - use specific net if provided, otherwise calculate
      let net = NaN;
      if (useSpecificNet === 'Yes' && Number.isFinite(specificNet)) {
        net = specificNet;
      } else if (Number.isFinite(gross)) {
        net = gross;
        if (Number.isFinite(pfAmount)) net -= pfAmount;
        if (Number.isFinite(adminFee)) net -= adminFee;
      }

      // LTV calculations
      const ltvPercent = Number.isFinite(pv) && pv > 0 && Number.isFinite(net) ? (net / pv * 100) : NaN;
      const netLtv = ltvPercent; // For bridging, LTV and Net LTV are typically the same

      // ICR calculation (if applicable)
      const initialRate = Number(rate.rate);
      const monthlyInterest = Number.isFinite(gross) && Number.isFinite(initialRate) ? gross * (initialRate / 100) / 12 : NaN;
      const icr = Number.isFinite(monthlyRentNum) && Number.isFinite(monthlyInterest) && monthlyInterest > 0 
        ? (monthlyRentNum / monthlyInterest * 100) 
        : NaN;

      // Broker commission (proc fee) - typically 1% of gross loan
      const procFeePercent = Number(rate.proc_fee) || 1;
      const brokerCommissionProcFeePounds = Number.isFinite(gross) ? gross * (procFeePercent / 100) : NaN;

      // Determine product name: "Fusion", "Variable Bridge", or "Fixed Bridge"
      let productName = null;
      const setKey = (rate.set_key || '').toString().toLowerCase();
      
      if (setKey === 'fusion') {
        productName = 'Fusion';
      } else if (setKey === 'bridging_fix' || setKey.includes('bridging_fix') || setKey.includes('fix')) {
        productName = 'Fixed Bridge';
      } else if (setKey === 'bridging_var' || setKey.includes('bridging_var') || setKey.includes('var')) {
        productName = 'Variable Bridge';
      } else {
        // Fallback: check rate type field
        const rateType = (rate.type || '').toString().toLowerCase();
        if (rateType.includes('fixed')) {
          productName = 'Fixed Bridge';
        } else if (rateType.includes('variable')) {
          productName = 'Variable Bridge';
        } else {
          // Final fallback: use the product field or "Bridge" as default
          productName = rate.product || 'Bridge';
        }
      }

      return {
        ...rate,
        gross_loan: Number.isFinite(gross) ? gross.toFixed(2) : null,
        net_loan: Number.isFinite(net) ? net.toFixed(2) : null,
        ltv: Number.isFinite(ltvPercent) ? ltvPercent.toFixed(2) : null,
        ltv_percentage: Number.isFinite(ltvPercent) ? ltvPercent.toFixed(2) : null,
        net_ltv: Number.isFinite(netLtv) ? netLtv.toFixed(2) : null,
        property_value: Number.isFinite(pv) ? pv.toFixed(2) : null,
        icr: Number.isFinite(icr) ? icr.toFixed(2) : null,
        initial_rate: initialRate,
        pay_rate: initialRate, // Assuming pay rate same as initial rate
        product_fee_percent: pfPercent,
        product_fee_pounds: Number.isFinite(pfAmount) ? pfAmount.toFixed(2) : null,
        admin_fee: adminFee,
        broker_commission_proc_fee_percent: procFeePercent,
        broker_commission_proc_fee_pounds: Number.isFinite(brokerCommissionProcFeePounds) ? brokerCommissionProcFeePounds.toFixed(2) : null,
        monthly_interest_cost: Number.isFinite(monthlyInterest) ? monthlyInterest.toFixed(2) : null,
        rent: Number.isFinite(monthlyRentNum) ? monthlyRentNum.toFixed(2) : null,
        top_slicing: Number.isFinite(topSlicingNum) ? topSlicingNum.toFixed(2) : null,
        product_name: productName,
        // Bridging-specific fields (set to null if not calculated)
        revert_rate: null,
        revert_rate_dd: null,
        full_rate: null,
        aprc: null,
        broker_client_fee: null,
        commitment_fee_pounds: null,
        exit_fee: null,
        rolled_months: null,
        rolled_months_interest: null,
        deferred_interest_percent: null,
        deferred_interest_pounds: null,
        deferred_rate: null,
        serviced_interest: null,
        direct_debit: null,
        erc: null,
        erc_fusion_only: null,
        nbp: null,
        total_cost_to_borrower: null,
        total_loan_term: null
      };
    });
  }, [relevantRates, propertyValue, grossLoan, specificNetLoan, monthlyRent, topSlicing, useSpecificNet]);

  // DIP Modal Handlers
  const handleSaveDipData = async (quoteId, dipData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'BRIDGING',
          ...dipData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('DIP save error response:', errorData);
        throw new Error(errorData.error || 'Failed to save DIP data');
      }

      const result = await response.json();

      // Update local DIP data state so it persists when reopening modal
      setDipData(dipData);
    } catch (err) {
      console.error('Error saving DIP data:', err);
      throw err;
    }
  };

  const handleCreatePDF = async (quoteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dip/pdf/${quoteId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DIP_${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error creating PDF:', err);
      throw err;
    }
  };

  // Available fee types for Bridge: Fusion, Variable Bridge, Fixed Bridge
  const bridgeFeeTypes = ['Fusion', 'Variable Bridge', 'Fixed Bridge'];

  // Handle fee type selection in DIP modal to filter rates
  const handleFeeTypeSelection = (feeTypeLabel) => {
    setSelectedFeeTypeForDip(feeTypeLabel);
    
    if (!feeTypeLabel || !relevantRates || relevantRates.length === 0) {
      setFilteredRatesForDip([]);
      return;
    }

    // Filter based on product type for Bridge
    let filtered = [];
    if (feeTypeLabel === 'Fusion') {
      filtered = fusionMatched;
    } else if (feeTypeLabel === 'Variable Bridge') {
      filtered = bridgeMatched.filter(r => r.product && r.product.toLowerCase().includes('variable'));
    } else if (feeTypeLabel === 'Fixed Bridge') {
      filtered = bridgeMatched.filter(r => r.product && r.product.toLowerCase().includes('fixed'));
    }

    setFilteredRatesForDip(filtered);
  };

  // === Issue Quote handlers ===
  const handleIssueQuote = async () => {
    if (!currentQuoteId) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please save your quote first before issuing a quote.' });
      return;
    }
    
    // Check if there are calculation results to issue
    if (!relevantRates || relevantRates.length === 0) {
      setNotification({ 
        show: true, 
        type: 'warning', 
        title: 'No Results', 
        message: 'Please calculate rates first before issuing a quote. Make sure the results table shows data, then click "Save Quote" or "Update Quote" to save the calculations.' 
      });
      return;
    }
    
    // Fetch the latest quote data from the database to get any previously saved quote info
    try {
      const response = await getQuote(currentQuoteId);
      if (response && response.quote) {
        setQuoteData(response.quote);
        
        // Warn if the quote has no saved results in the database
        if (!response.quote.results || response.quote.results.length === 0) {
          setNotification({
            show: true,
            type: 'warning',
            title: 'Quote Not Fully Saved',
            message: 'The quote exists but has no saved calculation results. Please click "Update Quote" to save your calculations before issuing the quote, otherwise the PDF will not include rate details.'
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching quote data:', error);
      // Continue anyway - use existing data
    }
    
    setQuoteModalOpen(true);
  };

  const handleSaveQuoteData = async (quoteId, updatedQuoteData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculator_type: 'BRIDGING',
          ...updatedQuoteData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quote data');
      }

      setNotification({ show: true, type: 'success', title: 'Success', message: 'Quote data saved successfully!' });
    } catch (err) {
      console.error('Error saving quote data:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to save quote data: ' + err.message });
      throw err;
    }
  };

  const handleCreateQuotePDF = async (quoteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quote/pdf/${quoteId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate Quote PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quote_${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error creating Quote PDF:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to create Quote PDF: ' + err.message });
      throw err;
    }
  };

  const getAvailableFeeTypes = () => {
    return bridgeFeeTypes;
  };

  if (!supabase) return <div className="slds-p-around_medium">Supabase client missing</div>;
  if (loading) return (
    <div className="slds-spinner_container">
      <div className="slds-spinner slds-spinner_medium">
        <div className="slds-spinner__dot-a"></div>
        <div className="slds-spinner__dot-b"></div>
      </div>
      <div className="slds-text-heading_small slds-m-top_medium">Loading bridging criteria...</div>
    </div>
  );

  return (
    <div className="calculator-container">
      {/* Quote Reference Badge */}
      {currentQuoteRef && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          marginBottom: '1rem',
          paddingTop: '0.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#0176d3',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.25rem',
            border: '1px solid #014486',
            fontSize: '0.875rem',
            boxShadow: '0 2px 4px rgba(1, 118, 211, 0.2)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '400', fontSize: '0.75rem' }}>Quote Reference</span>
              <span style={{ 
                color: 'white', 
                fontWeight: '700',
                fontFamily: 'monospace',
                fontSize: '1rem',
                letterSpacing: '0.5px'
              }}>
                {currentQuoteRef}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(currentQuoteRef);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                padding: '0.375rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                color: 'white',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              title="Copy to clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="top-filters">
        <div className="slds-form-element">
          <label className="slds-form-element__label">Product Type</label>
          <div className="slds-form-element__control"><strong>Bridge & Fusion</strong></div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Product Scope</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={productScope} onChange={(e) => setProductScope(e.target.value)}>
              {/* Derive available scopes from data but keep default if not present */}
              {Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean))).map(ps => (
                <option key={ps} value={ps}>{ps}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentQuoteId && (
            <>
              <button 
                className="slds-button slds-button_brand"
                onClick={() => setDipModalOpen(true)}
                style={{ marginRight: '0.5rem' }}
              >
                Issue DIP
              </button>
              <button 
                className="slds-button slds-button_neutral"
                onClick={handleIssueQuote}
                style={{ marginRight: '0.5rem' }}
              >
                Issue Quote
              </button>
            </>
          )}
          <SaveQuoteButton
            calculatorType="BRIDGING"
            calculationData={{
              productScope,
              propertyValue,
              grossLoan,
              firstChargeValue,
              monthlyRent,
              topSlicing,
              useSpecificNet,
              specificNetLoan,
              bridgingTerm,
              chargeType,
              subProduct,
              answers,
              // Client details
              clientType,
              clientFirstName,
              clientLastName,
              clientEmail,
              clientContact,
              brokerCompanyName: clientType === 'Broker' ? brokerCompanyName : null,
              brokerRoute: clientType === 'Broker' ? brokerRoute : null,
              brokerCommissionPercent: clientType === 'Broker' ? brokerCommissionPercent : null,
              // Multi-property details
              multiPropertyDetails: isMultiProperty ? multiPropertyRows : null,
              results: calculatedRates,
              selectedRate: (filteredRatesForDip && filteredRatesForDip.length > 0) 
                ? filteredRatesForDip[0] 
                : (calculatedRates && calculatedRates.length > 0 ? calculatedRates[0] : null),
            }}
            allColumnData={[]}
            bestSummary={null}
            existingQuote={initialQuote}
            onSaved={async (savedQuote) => {
              // Update currentQuoteId when quote is saved for the first time
              if (savedQuote && savedQuote.id && !currentQuoteId) {
                setCurrentQuoteId(savedQuote.id);
              }
              if (savedQuote && savedQuote.reference_number) {
                setCurrentQuoteRef(savedQuote.reference_number);
              }
              
              // Save multi-property details if Multi-property is Yes
              if (savedQuote && savedQuote.id && isMultiProperty) {
                try {
                  // Delete existing rows for this quote
                  await supabase
                    .from('bridge_multi_property_details')
                    .delete()
                    .eq('bridge_quote_id', savedQuote.id);
                  
                  // Insert new rows
                  const rowsToInsert = multiPropertyRows.map((row, index) => ({
                    bridge_quote_id: savedQuote.id,
                    property_address: row.property_address,
                    property_type: row.property_type,
                    property_value: Number(row.property_value) || 0,
                    charge_type: row.charge_type,
                    first_charge_amount: Number(row.first_charge_amount) || 0,
                    gross_loan: Number(row.gross_loan) || 0,
                    row_order: index
                  }));
                  
                  await supabase
                    .from('bridge_multi_property_details')
                    .insert(rowsToInsert);
                } catch (error) {
                  console.error('Error saving multi-property details:', error);
                }
              }
              
              // Update dipData if the saved quote has DIP information
              if (savedQuote && savedQuote.id) {
                if (savedQuote.commercial_or_main_residence || savedQuote.dip_date || savedQuote.dip_expiry_date) {
                  setDipData({
                    commercial_or_main_residence: savedQuote.commercial_or_main_residence,
                    dip_date: savedQuote.dip_date,
                    dip_expiry_date: savedQuote.dip_expiry_date,
                    guarantor_name: savedQuote.guarantor_name,
                    lender_legal_fee: savedQuote.lender_legal_fee,
                    number_of_applicants: savedQuote.number_of_applicants,
                    overpayments_percent: savedQuote.overpayments_percent,
                    paying_network_club: savedQuote.paying_network_club,
                    security_properties: savedQuote.security_properties,
                    fee_type_selection: savedQuote.fee_type_selection,
                    dip_status: savedQuote.dip_status
                  });
                }
              }
            }}
          />
        </div>
      </div>

      {/* Client details section */}
      <section className="collapsible-section">
        <header className="collapsible-header" onClick={() => setClientDetailsExpanded(!clientDetailsExpanded)}>
          <h2 className="header-title">Client details</h2>
          <svg 
            className={`chevron-icon ${clientDetailsExpanded ? 'expanded' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </header>
        <div className={`collapsible-body ${!clientDetailsExpanded ? 'collapsed' : ''}`}>
          <div className="slds-grid slds-gutters" style={{ alignItems: 'stretch', marginBottom: '0.5rem' }}>
            <div className="slds-col" style={{ width: '100%' }}>
              <div className="slds-button-group" role="group" style={{ display: 'flex', width: '100%' }}>
                <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={`slds-button ${clientType === 'Direct' ? 'slds-button_brand' : 'slds-button_neutral'}`} onClick={() => setClientType('Direct')}>Direct Client</button>
                <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={`slds-button ${clientType === 'Broker' ? 'slds-button_brand' : 'slds-button_neutral'}`} onClick={() => setClientType('Broker')}>Broker</button>
              </div>
            </div>
          </div>
          <div className="loan-details-grid">
            {clientType === 'Broker' && (
              <div className="slds-form-element">
                <label className="slds-form-element__label">Company name</label>
                <div className="slds-form-element__control"><input className="slds-input" value={brokerCompanyName} onChange={(e) => setBrokerCompanyName(e.target.value)} /></div>
              </div>
            )}
            <div className="slds-form-element">
              <label className="slds-form-element__label">First name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={clientFirstName} onChange={(e) => setClientFirstName(e.target.value)} /></div>
            </div>
            <div className="slds-form-element">
              <label className="slds-form-element__label">Last name</label>
              <div className="slds-form-element__control"><input className="slds-input" value={clientLastName} onChange={(e) => setClientLastName(e.target.value)} /></div>
            </div>
            <div className="slds-form-element">
              <label className="slds-form-element__label">Email</label>
              <div className="slds-form-element__control"><input className="slds-input" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
            </div>
            <div className="slds-form-element">
              <label className="slds-form-element__label">Contact number</label>
              <div className="slds-form-element__control"><input className="slds-input" value={clientContact} onChange={(e) => setClientContact(e.target.value)} /></div>
            </div>
          </div>
          {clientType === 'Broker' && (
            <div className="loan-details-grid" style={{ marginTop: '0.5rem' }}>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Broker route</label>
                <div className="slds-form-element__control">
                  <select className="slds-select" value={brokerRoute} onChange={(e) => setBrokerRoute(e.target.value)}>
                    {Object.values(getBrokerRoutesAndDefaults().routes).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Broker commission (%)</label>
                <div className="slds-form-element__control">
                  <input 
                    className="slds-input" 
                    type="number" 
                    step="0.1"
                    value={brokerCommissionPercent} 
                    onChange={handleBrokerCommissionChange}
                    title={`Allowed range: ${(getBrokerRoutesAndDefaults().defaults[brokerRoute] - getBrokerRoutesAndDefaults().tolerance).toFixed(1)}% to ${(getBrokerRoutesAndDefaults().defaults[brokerRoute] + getBrokerRoutesAndDefaults().tolerance).toFixed(1)}%`}
                  />
                </div>
                <div className="slds-form-element__help" style={{ fontSize: '0.75rem', color: '#706e6b', marginTop: '0.25rem' }}>
                  Adjustable within ±{getBrokerRoutesAndDefaults().tolerance}% of default ({getBrokerRoutesAndDefaults().defaults[brokerRoute]}%)
                </div>
              </div>
              
              <div className="slds-form-element" style={{ gridColumn: 'span 2' }}>
                <div className="modern-switch" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <span className="switch-label">Will you/the broker be adding any additional fees?</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={addFeesToggle}
                    onClick={() => setAddFeesToggle(prev => !prev)}
                    className={`switch-track ${addFeesToggle ? 'checked' : ''}`}
                    aria-label="Will you/the broker be adding any additional fees?"
                  >
                    <span className={`switch-thumb ${addFeesToggle ? 'checked' : ''}`} />
                  </button>
                </div>
              </div>

              {addFeesToggle && (
                <>
                  <div className="slds-form-element">
                    <label className="slds-form-element__label">Fee calculated as</label>
                    <div className="slds-form-element__control">
                      <select 
                        className="slds-select" 
                        value={feeCalculationType} 
                        onChange={(e) => setFeeCalculationType(e.target.value)}
                      >
                        <option value="pound">Pound value</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                  </div>

                  <div className="slds-form-element">
                    <label className="slds-form-element__label">Additional fee amount</label>
                    <div className="slds-form-element__control">
                      <input
                        className="slds-input"
                        value={additionalFeeAmount}
                        onChange={(e) => setAdditionalFeeAmount(e.target.value)}
                        placeholder={feeCalculationType === 'pound' ? '£' : 'e.g. 1.5'}
                        aria-label="Additional fee amount"
                      />
                    </div>
                    <div className="slds-form-element__help" style={{ fontSize: '0.75rem', color: '#706e6b', marginTop: '0.25rem' }}>
                      This will be subtracted from the net loan
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="collapsible-section">
            <header className="collapsible-header" onClick={() => setCriteriaExpanded(!criteriaExpanded)}>
              <h2 className="header-title">Criteria</h2>
              <svg 
                className={`chevron-icon ${criteriaExpanded ? 'expanded' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </header>
            <div className={`collapsible-body ${!criteriaExpanded ? 'collapsed' : ''}`}>
          <div className="criteria-grid">
            {Object.keys(questions).length === 0 && (
              <div>
                <div>No criteria found for Bridge & Fusion.</div>
                <div style={{ marginTop: '0.5rem', color: '#666' }}>
                  Try checking Manage Criteria — available product scopes: {Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean))).join(', ') || 'none'}.
                </div>
              </div>
            )}
            {Object.keys(questions).sort((a,b) => (questions[a].displayOrder || 0) - (questions[b].displayOrder || 0)).map((qk) => {
              const q = questions[qk];
              // compute selected index by matching id or label (safer across re-creates)
              const selectedIndex = q.options.findIndex(opt => {
                const a = answers[qk];
                if (!a) return false;
                if (opt.id && a.id) return opt.id === a.id;
                return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
              });
              const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
              
              // Detect if this question is a Sub-product selector
              const isSubQuestion = /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(q.label || qk || '');
              const hideForSecond = isSubQuestion && ((chargeType || '').toString().toLowerCase() === 'second');
              
              // Detect if this question is a Charge type selector
              const isChargeTypeQuestion = /charge[-_ ]?type|chargetype/i.test(q.label || qk || '');
              const isNonResidential = productScope && productScope.toLowerCase() !== 'residential';
              
              if (isChargeTypeQuestion) {
                console.log('Charge Type Question Found:', {
                  label: q.label,
                  key: qk,
                  productScope,
                  isNonResidential,
                  shouldDisable: isNonResidential
                });
              }
              
              // Hide sub-product field if Second charge is selected
              if (hideForSecond) return null;
              
              // For Charge type question: when product scope is not Residential (Commercial/Semi-Commercial)
              // Default to "First Charge" and disable the field
              let effectiveIndex = safeIndex;
              let isDisabled = false;
              if (isChargeTypeQuestion && isNonResidential) {
                // Find the "First Charge" or "First charge" option index
                const firstChargeIndex = q.options.findIndex(opt => 
                  (opt.option_label || '').toString().toLowerCase().includes('first')
                );
                if (firstChargeIndex >= 0) {
                  effectiveIndex = firstChargeIndex;
                  // Auto-select First Charge if not already selected
                  if (safeIndex !== firstChargeIndex) {
                    handleAnswerChange(qk, firstChargeIndex);
                  }
                }
                isDisabled = true;
              }
              
              return (
                <div key={qk} className="slds-form-element">
                  <label className="slds-form-element__label">{q.label}</label>
                  <div className="slds-form-element__control">
                    <select
                      className="slds-select"
                      value={effectiveIndex}
                      onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}
                      disabled={isDisabled}
                    >
                      {q.options.map((opt, idx) => (
                        <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                      ))}
                    </select>
                    {isDisabled && (
                      <div className="helper-text" style={{ color: '#666', marginTop: '0.25rem' }}>
                        Only First Charge is available for {productScope} properties
                      </div>
                    )}
                    {/* Show loan/LTV limits for the selected sub-product (if available) */}
                    {isSubQuestion && (() => {
                      const opt = q.options[safeIndex];
                      const labelRaw = (opt && opt.option_label) ? opt.option_label.toString().trim() : '';
                      const label = labelRaw.toLowerCase();
                      const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                      const labelKey = normalizeKey(label);
                      let lim = subProductLimits[labelKey];
                      // fuzzy fallback: try to find a limits entry whose key includes labelKey or vice-versa
                      if (!lim) {
                        const foundKey = Object.keys(subProductLimits).find(k => k.includes(labelKey) || labelKey.includes(k));
                        if (foundKey) lim = subProductLimits[foundKey];
                      }
                      if (!lim) return null;
                      const parts = [];
                      if (lim.minLoan !== null || lim.maxLoan !== null) {
                        const min = lim.minLoan ? `£${Number(lim.minLoan).toLocaleString()}` : '—';
                        const max = lim.maxLoan ? `£${Number(lim.maxLoan).toLocaleString()}` : '—';
                        parts.push(`Loan size: ${min} – ${max}`);
                      }
                      if (lim.minLtv !== null || lim.maxLtv !== null) {
                        const min = lim.minLtv != null ? `${lim.minLtv}%` : '—';
                        const max = lim.maxLtv != null ? `${lim.maxLtv}%` : '—';
                        parts.push(`LTV: ${min} – ${max}`);
                      }
                      if (parts.length === 0) return null;
                      return (
                        <div className="helper-text" style={{ color: '#666', marginTop: '0.25rem' }}>{parts.join(' • ')}</div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Multi Property Details Section - Only shown when Multi-property = Yes */}
      {isMultiProperty && (
        <section className="collapsible-section">
          <header className="collapsible-header" onClick={() => setMultiPropertyDetailsExpanded(!multiPropertyDetailsExpanded)}>
            <h2 className="header-title">Multi Property Details</h2>
            <svg 
              className={`chevron-icon ${multiPropertyDetailsExpanded ? 'expanded' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </header>
          <div className={`collapsible-body ${!multiPropertyDetailsExpanded ? 'collapsed' : ''}`}>
            <div style={{ overflowX: 'auto' }}>
              <table className="slds-table slds-table_bordered slds-table_cell-buffer">
                <thead>
                  <tr className="slds-line-height_reset">
                    <th scope="col" style={{ width: '25%' }}>
                      <div className="slds-truncate" title="Property Address">Property Address</div>
                    </th>
                    <th scope="col" style={{ width: '12%' }}>
                      <div className="slds-truncate" title="Property Type">Property Type</div>
                    </th>
                    <th scope="col" style={{ width: '13%' }}>
                      <div className="slds-truncate" title="Property Value">Property Value (£)</div>
                    </th>
                    <th scope="col" style={{ width: '13%' }}>
                      <div className="slds-truncate" title="Charge Type">Charge Type</div>
                    </th>
                    <th scope="col" style={{ width: '15%' }}>
                      <div className="slds-truncate" title="First Charge Amount">First Charge Amount (£)</div>
                    </th>
                    <th scope="col" style={{ width: '13%' }}>
                      <div className="slds-truncate" title="Gross Loan">Gross Loan (£)</div>
                    </th>
                    <th scope="col" style={{ width: '9%' }}>
                      <div className="slds-truncate" title="Actions">Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {multiPropertyRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          className="slds-input"
                          type="text"
                          value={row.property_address}
                          onChange={(e) => handleMultiPropertyRowChange(row.id, 'property_address', e.target.value)}
                          placeholder="Enter address"
                        />
                      </td>
                      <td>
                        <select
                          className="slds-select"
                          value={row.property_type}
                          onChange={(e) => handleMultiPropertyRowChange(row.id, 'property_type', e.target.value)}
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Semi-Commercial">Semi-Commercial</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="slds-input"
                          type="text"
                          value={formatCurrencyInput(row.property_value)}
                          onChange={(e) => handleMultiPropertyRowChange(row.id, 'property_value', e.target.value)}
                          placeholder="£0"
                        />
                      </td>
                      <td>
                        <select
                          className="slds-select"
                          value={row.charge_type}
                          onChange={(e) => handleMultiPropertyRowChange(row.id, 'charge_type', e.target.value)}
                        >
                          <option value="First charge">First charge</option>
                          <option value="Second charge">Second charge</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="slds-input"
                          type="text"
                          value={formatCurrencyInput(row.first_charge_amount)}
                          onChange={(e) => handleMultiPropertyRowChange(row.id, 'first_charge_amount', e.target.value)}
                          placeholder="£0"
                          disabled={row.charge_type === 'First charge'}
                        />
                      </td>
                      <td>
                        <div style={{ padding: '0.5rem', fontWeight: '600', fontFamily: 'monospace' }}>
                          £{Number(row.gross_loan).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td>
                        <button
                          className="slds-button slds-button_icon slds-button_icon-border-filled"
                          onClick={() => deleteMultiPropertyRow(row.id)}
                          disabled={multiPropertyRows.length <= 1}
                          title="Delete row"
                        >
                          <svg className="slds-button__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr style={{ backgroundColor: '#f3f3f3', fontWeight: '700' }}>
                    <td colSpan="2" style={{ textAlign: 'right', padding: '0.75rem' }}>
                      <strong>Totals:</strong>
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      £{multiPropertyTotals.property_value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      £{multiPropertyTotals.first_charge_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      £{multiPropertyTotals.gross_loan.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="slds-button slds-button_neutral"
                onClick={addMultiPropertyRow}
              >
                <svg className="slds-button__icon slds-button__icon_left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Property
              </button>
              <button
                className="slds-button slds-button_brand"
                onClick={() => setGrossLoan(formatCurrencyInput(multiPropertyTotals.gross_loan))}
                title="Transfer total gross loan to main Loan Details section"
              >
                <svg className="slds-button__icon slds-button__icon_left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Use Total Gross Loan
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="collapsible-section">
        <header className="collapsible-header" onClick={() => setLoanDetailsExpanded(!loanDetailsExpanded)}>
          <h2 className="header-title">Loan details</h2>
          <svg 
            className={`chevron-icon ${loanDetailsExpanded ? 'expanded' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </header>
        <div className={`collapsible-body ${!loanDetailsExpanded ? 'collapsed' : ''}`}>
          <div className="loan-details-grid">
            <div className="slds-form-element">
              <label className="slds-form-element__label">Property Value</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={propertyValue} onChange={(e) => setPropertyValue(formatCurrencyInput(e.target.value))} placeholder="£1,200,000" />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Gross loan</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={grossLoan} onChange={(e) => setGrossLoan(formatCurrencyInput(e.target.value))} placeholder="£550,000" />
              </div>
            </div>

            {chargeType === 'Second' && (
              <div className="slds-form-element" style={{ backgroundColor: '#fff4e5', padding: '0.75rem', borderRadius: '4px', border: '2px solid #fe9339' }}>
                <label className="slds-form-element__label" style={{ fontWeight: '600' }}>
                  First charge value
                  <span style={{ fontSize: '0.8em', color: '#706e6b', marginLeft: '0.25rem' }}>
                    (used for LTV calculation)
                  </span>
                </label>
                <div className="slds-form-element__control">
                  <input className="slds-input" value={firstChargeValue} onChange={(e) => setFirstChargeValue(formatCurrencyInput(e.target.value))} placeholder="£0" />
                </div>
              </div>
            )}

            <div className="slds-form-element">
              <label className="slds-form-element__label">Monthly rent</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={monthlyRent} onChange={(e) => setMonthlyRent(formatCurrencyInput(e.target.value))} placeholder="£3,000" />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Top slicing</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={topSlicing} onChange={(e) => setTopSlicing(e.target.value)} placeholder="e.g. 600" />
              </div>
            </div>

            {/* Force new row by adding a full-width spacer */}
            <div style={{ gridColumn: '1 / -1', height: '0' }}></div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Use specific net loan?</label>
              <div className="slds-form-element__control">
                <select className="slds-select" value={useSpecificNet} onChange={(e) => setUseSpecificNet(e.target.value)}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {useSpecificNet === 'Yes' && (
              <div className="slds-form-element">
                <label className="slds-form-element__label">Specific net loan</label>
                <div className="slds-form-element__control">
                  <input className="slds-input" value={specificNetLoan} onChange={(e) => setSpecificNetLoan(e.target.value)} placeholder="£" />
                </div>
              </div>
            )}

            <div className="slds-form-element">
              <label className="slds-form-element__label">Bridging loan term (months)</label>
              <div className="slds-form-element__control">
                <select className="slds-select" value={bridgingTerm} onChange={(e) => setBridgingTerm(e.target.value)}>
                  <option value="">Select months</option>
                  {Array.from({ length: termRange.max - termRange.min + 1 }, (_, i) => termRange.min + i).map((m) => (
                    <option key={m} value={String(m)}>{m} months</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/*
              Sub-product type and Charge type are driven from the Criteria section.
              We derive `subProduct` and `chargeType` from the selected answers there so
              users pick these via Criteria controls instead of separate Loan details fields.
            */}
          </div>
        </div>
      </section>

      {/* Results section */}
      <section className="results-section">
        <header className="collapsible-header">
          <h2 className="header-title">Results</h2>
        </header>
        <div className="collapsible-body">
          {/* 4-column layout: Label | Fusion | Variable Bridge | Fixed Bridge */}
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  {/* increase label width a bit and adjust other columns */}
                  <th style={{ width: '24%' }}>Label</th>
                  <th style={{ width: '25%', textAlign: 'center' }}>Fusion</th>
                  <th style={{ width: '25%', textAlign: 'center' }}>Variable Bridge</th>
                  <th style={{ width: '26%', textAlign: 'center' }}>Fixed Bridge</th>
                </tr>
              </thead>
              <tbody>
                {
                  (() => {
                    // helper to choose the best matching row for a primary value (loanSize or loanLtv)
                    const pickBest = (rows, primaryValue, minField, maxField) => {
                      if (!rows || rows.length === 0) return null;
                      if (!Number.isFinite(primaryValue)) {
                        // no primary metric: prefer lowest rate, then first
                        const byRate = rows.filter(r => r.rate != null).sort((a,b) => Number(a.rate) - Number(b.rate));
                        return byRate[0] || rows[0];
                      }
                      // compute distance to the mid-point of the bucket, prefer rows containing the value
                      let best = null;
                      let bestScore = Number.POSITIVE_INFINITY;
                      for (const r of rows) {
                        const min = parseNumber(r[minField]);
                        const max = parseNumber(r[maxField]);
                        if (Number.isFinite(min) && Number.isFinite(max)) {
                          if (primaryValue >= min && primaryValue <= max) return r; // exact bucket match
                          const mid = (min + max) / 2;
                          const score = Math.abs(primaryValue - mid);
                          if (score < bestScore) { bestScore = score; best = r; }
                        } else if (r.rate != null && best == null) {
                          best = r;
                        } else if (best == null) {
                          best = r;
                        }
                      }
                      return best || rows[0];
                    };

                    const loanLtv = computeLoanLtv();
                    const loanSize = computeLoanSize();

                    const bestFusion = pickBest(fusionMatched, loanSize, 'min_loan', 'max_loan');
                    const variableRows = bridgeMatched.filter(b => (b.type || '').toString().toLowerCase() === 'variable');
                    const fixedRows = bridgeMatched.filter(b => (b.type || '').toString().toLowerCase() === 'fixed');
                    const bestVariable = pickBest(variableRows, loanLtv, 'min_ltv', 'max_ltv');
                    const bestFixed = pickBest(fixedRows, loanLtv, 'min_ltv', 'max_ltv');

                    if (!bestFusion && !bestVariable && !bestFixed) return (
                      <tr><td colSpan={3} className="slds-text-body_small">No results match the selected filters.</td></tr>
                    );

                      return (
                        <>
                          <tr>
                            <td>
                              {/* Label column: show explicit label if available, otherwise show a simple 'Rates' marker for the first/results row */}
                              <div style={{ fontWeight: 600 }}>{(bestFusion && bestFusion.label) || (bestVariable && bestVariable.label) || (bestFixed && bestFixed.label) || 'Rates'}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bestFusion ? (
                                <div className="slds-box slds-m-vertical_x-small">
                                  <div>{bestFusion.rate != null ? `${bestFusion.rate}%` : '—'}</div>
                                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Loan: {bestFusion.min_loan ? `£${Number(bestFusion.min_loan).toLocaleString()}` : '—'} – {bestFusion.max_loan ? `£${Number(bestFusion.max_loan).toLocaleString()}` : '—'}</div>
                                </div>
                              ) : <div className="slds-text-body_small">—</div>}
                            </td>
                          <td style={{ textAlign: 'center' }}>
                              {bestVariable ? (
                                <div className="slds-box slds-m-vertical_x-small">
                                  <div>{bestVariable.rate != null ? `${bestVariable.rate}%` : '—'}</div>
                                  <div style={{ color: '#666', fontSize: '0.85rem' }}>LTV: {bestVariable.min_ltv ?? '—'}% – {bestVariable.max_ltv ?? '—'}%</div>
                                </div>
                              ) : <div className="slds-text-body_small">—</div>}
                            </td>
                          <td style={{ textAlign: 'center' }}>
                              {bestFixed ? (
                                <div className="slds-box slds-m-vertical_x-small">
                                  <div>{bestFixed.rate != null ? `${bestFixed.rate}%` : '—'}</div>
                                  <div style={{ color: '#666', fontSize: '0.85rem' }}>LTV: {bestFixed.min_ltv ?? '—'}% – {bestFixed.max_ltv ?? '—'}%</div>
                                </div>
                              ) : <div className="slds-text-body_small">—</div>}
                            </td>
                          </tr>

                          {/* Inject placeholders as additional rows inside the same results table */}
                          {
                            (() => {
                              const columnsHeaders = [ 'Fusion', 'Variable Bridge', 'Fixed Bridge' ];
                              const placeholders = [
                                'APRC', 'Admin Fee', 'Broker Client Fee', 'Broker Comission (Proc Fee %)',
                                'Broker Comission (Proc Fee £)', 'Commitment Fee £', 'Deferred Interest %', 'Deferred Interest £',
                                'Direct Debit', 'ERC', 'ERC (Fusion Only)', 'Exit Fee', 'Gross Loan', 'ICR', 'Initial Rate', 'LTV', 'Monthly Interest Cost',
                                'NBP', 'Net Loan', 'Net LTV', 'Pay Rate', 'Product Fee %', 'Product Fee £', 'Revert Rate', 'Revert Rate DD',
                                'Rolled Months', 'Rolled Months Interest', 'Serviced Interest', 'Total Cost to Borrower', 'Total Loan Term'
                              ];

                              const values = {};
                              placeholders.forEach(p => { values[p] = {}; });

                              const colBest = [bestFusion, bestVariable, bestFixed];
                              // common inputs
                              const pv = parseNumber(propertyValue);
                              const grossInput = parseNumber(grossLoan);
                              const specificNet = parseNumber(specificNetLoan);

                              columnsHeaders.forEach((col, idx) => {
                                const best = colBest[idx];
                                if (best && best.rate != null) values['Initial Rate'][col] = `${Number(best.rate).toFixed(2)}%`;

                                // product fee percent may be on the row
                                const pf = best && (best.product_fee !== undefined ? Number(best.product_fee) : NaN);
                                if (pf && !Number.isNaN(pf)) values['Product Fee %'][col] = `${pf}%`;

                                // gross loan: prefer gross input, otherwise leave blank
                                if (Number.isFinite(grossInput)) values['Gross Loan'][col] = `£${Number(grossInput).toLocaleString('en-GB')}`;

                                // product fee £ and net loan
                                if (Number.isFinite(grossInput) && pf && !Number.isNaN(pf)) {
                                  const pfAmount = grossInput * (pf / 100);
                                  values['Product Fee £'][col] = `£${Number(pfAmount).toLocaleString('en-GB')}`;
                                  const net = (Number.isFinite(specificNet) ? specificNet : grossInput - pfAmount);
                                  if (Number.isFinite(net)) values['Net Loan'][col] = `£${Number(net).toLocaleString('en-GB')}`;
                                  if (Number.isFinite(pv)) values['LTV'][col] = `${((net / pv) * 100).toFixed(2)}%`;
                                }

                                // monthly interest
                                if (best && best.rate != null && Number.isFinite(grossInput)) {
                                  const monthly = grossInput * (Number(best.rate) / 100) / 12;
                                  values['Monthly Interest Cost'][col] = `£${Number(monthly).toLocaleString('en-GB')}`;
                                }
                              });

                              return (
                                <CalculatorResultsPlaceholders
                                  renderAsRows={true}
                                  labels={placeholders}
                                  columns={columnsHeaders}
                                  values={values}
                                />
                              );
                            })()
                          }
                        </>
                      );
                  })()
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Placeholders are injected into the results table as rows (see above) */}

      {/* Issue DIP Modal */}
      <IssueDIPModal
        isOpen={dipModalOpen}
        onClose={() => {
          setDipModalOpen(false);
          setSelectedFeeTypeForDip('');
          setFilteredRatesForDip([]);
        }}
        quoteId={currentQuoteId}
        calculatorType="BRIDGING"
        existingDipData={dipData}
        availableFeeTypes={bridgeFeeTypes}
        allRates={relevantRates}
        onSave={handleSaveDipData}
        onCreatePDF={handleCreatePDF}
        onFeeTypeSelected={handleFeeTypeSelection}
      />

      {/* Issue Quote Modal */}
      <IssueQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        quoteId={currentQuoteId}
        calculatorType="Bridging"
        availableFeeRanges={getAvailableFeeTypes()}
        existingQuoteData={quoteData}
        onSave={handleSaveQuoteData}
        onCreatePDF={handleCreateQuotePDF}
      />
      
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
