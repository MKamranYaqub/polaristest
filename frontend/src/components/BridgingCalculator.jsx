import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Calculator.scss';
import SaveQuoteButton from './SaveQuoteButton';
import IssueDIPModal from './IssueDIPModal';
import IssueQuoteModal from './IssueQuoteModal';
import CalculatorResultsPlaceholders from './CalculatorResultsPlaceholders';
import NotificationModal from './NotificationModal';
import CollapsibleSection from './calculator/CollapsibleSection';
import QuoteReferenceHeader from './calculator/shared/QuoteReferenceHeader';
import ClientDetailsSection from './calculator/shared/ClientDetailsSection';
import CriteriaSection from './calculator/bridging/CriteriaSection';
import LoanDetailsSection from './calculator/bridging/LoanDetailsSection';
import MultiPropertyDetailsSection from './calculator/bridging/MultiPropertyDetailsSection';
import useBrokerSettings from '../hooks/calculator/useBrokerSettings';
import { getQuote, upsertQuoteData, requestDipPdf, requestQuotePdf } from '../utils/quotes';
import { parseNumber, formatCurrencyInput } from '../utils/calculator/numberFormatting';
import { computeLoanLtv, computeLoanSize } from '../utils/calculator/loanCalculations';
import { pickBestRate, computeModeFromAnswers } from '../utils/calculator/rateFiltering';
import { LOCALSTORAGE_CONSTANTS_KEY } from '../config/constants';

export default function BridgingCalculator({ initialQuote = null }) {
  const { supabase } = useSupabase();
  const { canEditCalculators, token } = useAuth();
  const location = useLocation();
  const navQuote = location && location.state ? location.state.loadQuote : null;
  const effectiveInitialQuote = initialQuote || navQuote;

  const isReadOnly = !canEditCalculators();

  // Use custom hook for broker settings
  const brokerSettings = useBrokerSettings(effectiveInitialQuote);

  const [allCriteria, setAllCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultScope = 'Bridge & Fusion';
  const [productScope, setProductScope] = useState('');

  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  // Collapsible sections - start collapsed, only one open at a time (accordion)
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = useState(false);
  const [clientDetailsExpanded, setClientDetailsExpanded] = useState(true); // First section open by default

  const [propertyValue, setPropertyValue] = useState('');
  const [grossLoan, setGrossLoan] = useState('');
  const [firstChargeValue, setFirstChargeValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [topSlicing, setTopSlicing] = useState('');
  const [useSpecificNet, setUseSpecificNet] = useState('No');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [bridgingTerm, setBridgingTerm] = useState('');
  const [rates, setRates] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [bridgeMatched, setBridgeMatched] = useState([]);
  const [fusionMatched, setFusionMatched] = useState([]);
  const [subProduct, setSubProduct] = useState('');
  const [subProductOptions, setSubProductOptions] = useState([]);
  const [subProductLimits, setSubProductLimits] = useState({});
  const [chargeType, setChargeType] = useState('All');

  const [dipModalOpen, setDipModalOpen] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  const [dipData, setDipData] = useState({});
  const [selectedFeeTypeForDip, setSelectedFeeTypeForDip] = useState('');
  const [filteredRatesForDip, setFilteredRatesForDip] = useState([]);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({});
  const [currentQuoteRef, setCurrentQuoteRef] = useState(effectiveInitialQuote?.reference_number || null);

  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('pound');
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');

  const [multiPropertyDetailsExpanded, setMultiPropertyDetailsExpanded] = useState(false);
  const [multiPropertyRows, setMultiPropertyRows] = useState([
    { id: Date.now(), property_address: '', property_type: 'Residential', property_value: '', charge_type: 'First charge', first_charge_amount: '', gross_loan: 0 }
  ]);

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
    if (!effectiveInitialQuote) {
      const starting = {};
      Object.keys(map).forEach(k => { starting[k] = map[k].options[0] || null; });
      setAnswers(starting);
    }
  }, [allCriteria, productScope, effectiveInitialQuote]);

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
      if (!effectiveInitialQuote) return;
      
      // New structure: data is directly on the quote object (no nested payload)
      const quote = effectiveInitialQuote;
      
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
      
      // Note: Client details are loaded by useBrokerSettings hook
      
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
  }, [effectiveInitialQuote]);

  const handleAnswerChange = (key, idx) => {
    setAnswers(prev => ({ ...prev, [key]: questions[key].options[idx] }));
  };

  // Accordion behavior - close all other sections when one is opened
  const handleClientDetailsToggle = () => {
    const newState = !clientDetailsExpanded;
    setClientDetailsExpanded(newState);
    if (newState) {
      setCriteriaExpanded(false);
      setMultiPropertyDetailsExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleCriteriaToggle = () => {
    const newState = !criteriaExpanded;
    setCriteriaExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setMultiPropertyDetailsExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleMultiPropertyToggle = () => {
    const newState = !multiPropertyDetailsExpanded;
    setMultiPropertyDetailsExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setLoanDetailsExpanded(false);
    }
  };

  const handleLoanDetailsToggle = () => {
    const newState = !loanDetailsExpanded;
    setLoanDetailsExpanded(newState);
    if (newState) {
      setClientDetailsExpanded(false);
      setCriteriaExpanded(false);
      setMultiPropertyDetailsExpanded(false);
    }
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
    const loanLtv = computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue);
    const loanSize = computeLoanSize(specificNetLoan, grossLoan);
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

  const loanLtv = computeLoanLtv(propertyValue, specificNetLoan, grossLoan, firstChargeValue);
  const loanSize = computeLoanSize(specificNetLoan, grossLoan);

  const bestBridgeRates = useMemo(() => {
    if (!calculatedRates || calculatedRates.length === 0) {
      return { fusion: null, variable: null, fixed: null };
    }

    const lower = (val) => (val || '').toString().toLowerCase();

    const fusionRows = calculatedRates.filter(r => lower(r.set_key) === 'fusion');
    const variableRows = calculatedRates.filter(r => {
      const type = lower(r.type);
      const product = lower(r.product_name || r.product);
      return type.includes('variable') || product.includes('variable');
    });
    const fixedRows = calculatedRates.filter(r => {
      const type = lower(r.type);
      const product = lower(r.product_name || r.product);
      return type.includes('fixed') || product.includes('fixed');
    });

    return {
      fusion: pickBestRate(fusionRows, loanSize, 'min_loan', 'max_loan'),
      variable: pickBestRate(variableRows, loanLtv, 'min_ltv', 'max_ltv'),
      fixed: pickBestRate(fixedRows, loanLtv, 'min_ltv', 'max_ltv'),
    };
  }, [calculatedRates, loanLtv, loanSize]);

  const bestBridgeRatesArray = useMemo(() => (
    ['fusion', 'variable', 'fixed']
      .map((key) => bestBridgeRates[key])
      .filter(Boolean)
  ), [bestBridgeRates]);

  // DIP Modal Handlers
  const handleSaveDipData = async (quoteId, dipData) => {
    try {
      await upsertQuoteData({
        quoteId,
        calculatorType: 'BRIDGING',
        payload: dipData,
        token,
      });
      setDipData(dipData);
    } catch (err) {
      console.error('Error saving DIP data:', err);
      throw err;
    }
  };

  const handleCreatePDF = async (quoteId) => {
    try {
      const response = await requestDipPdf(quoteId, token);

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
      await upsertQuoteData({
        quoteId,
        calculatorType: 'BRIDGING',
        payload: updatedQuoteData,
        token,
      });

      setNotification({ show: true, type: 'success', title: 'Success', message: 'Quote data saved successfully!' });
    } catch (err) {
      console.error('Error saving quote data:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to save quote data: ' + err.message });
      throw err;
    }
  };

  const handleCreateQuotePDF = async (quoteId) => {
    try {
      const response = await requestQuotePdf(quoteId, token);

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
      <QuoteReferenceHeader reference={currentQuoteRef} />

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

        <div className="margin-left-auto display-flex align-items-center flex-gap-8">
          {currentQuoteId && (
            <>
              <button 
                className="slds-button slds-button_brand margin-right-05"
                onClick={() => setDipModalOpen(true)}
              >
                Issue DIP
              </button>
              <button 
                className="slds-button slds-button_neutral margin-right-05"
                onClick={handleIssueQuote}
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
              // Client details from broker settings hook
              ...brokerSettings.getAllSettings(),
              // Multi-property details
              multiPropertyDetails: isMultiProperty ? multiPropertyRows : null,
              results: bestBridgeRatesArray,
              selectedRate: (filteredRatesForDip && filteredRatesForDip.length > 0) 
                ? filteredRatesForDip[0] 
                : (bestBridgeRatesArray && bestBridgeRatesArray.length > 0 ? bestBridgeRatesArray[0] : null),
            }}
            allColumnData={[]}
            bestSummary={null}
            existingQuote={effectiveInitialQuote}
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
      <ClientDetailsSection
        {...brokerSettings}
        expanded={clientDetailsExpanded}
        onToggle={handleClientDetailsToggle}
        isReadOnly={isReadOnly}
      />

      <CriteriaSection
        expanded={criteriaExpanded}
        onToggle={handleCriteriaToggle}
        questions={questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        allCriteria={allCriteria}
        chargeType={chargeType}
        productScope={productScope}
        subProductLimits={subProductLimits}
        isReadOnly={isReadOnly}
      />

      {/* Multi Property Details Section - Only shown when Multi-property = Yes */}
      {isMultiProperty && (
        <MultiPropertyDetailsSection
          expanded={multiPropertyDetailsExpanded}
          onToggle={handleMultiPropertyToggle}
          rows={multiPropertyRows}
          onRowChange={handleMultiPropertyRowChange}
          onAddRow={addMultiPropertyRow}
          onDeleteRow={deleteMultiPropertyRow}
          totals={multiPropertyTotals}
          onUseTotalGrossLoan={(total) => setGrossLoan(formatCurrencyInput(total))}
          isReadOnly={isReadOnly}
        />
      )}

      <LoanDetailsSection
        expanded={loanDetailsExpanded}
        onToggle={handleLoanDetailsToggle}
        propertyValue={propertyValue}
        onPropertyValueChange={setPropertyValue}
        grossLoan={grossLoan}
        onGrossLoanChange={setGrossLoan}
        chargeType={chargeType}
        firstChargeValue={firstChargeValue}
        onFirstChargeValueChange={setFirstChargeValue}
        monthlyRent={monthlyRent}
        onMonthlyRentChange={setMonthlyRent}
        topSlicing={topSlicing}
        onTopSlicingChange={setTopSlicing}
        useSpecificNet={useSpecificNet}
        onUseSpecificNetChange={setUseSpecificNet}
        specificNetLoan={specificNetLoan}
        onSpecificNetLoanChange={setSpecificNetLoan}
        term={bridgingTerm}
        onTermChange={setBridgingTerm}
        termRange={termRange}
        isReadOnly={isReadOnly}
      />

      {/* Results section */}
      <section className="results-section">
        <header className="collapsible-header">
          <h2 className="header-title">Results</h2>
        </header>
        <div className="collapsible-body">
          {/* 4-column layout: Label | Fusion | Variable Bridge | Fixed Bridge */}
          <div className="results-table-wrapper">
            <table className="slds-table slds-table_cell-buffer slds-table_bordered max-width-900">
              <thead>
                <tr>
                  {/* increase label width a bit and adjust other columns */}
                  <th className="width-24">Label</th>
                  <th className="width-25 text-align-center">Fusion</th>
                  <th className="width-25 text-align-center">Variable Bridge</th>
                  <th className="width-26 text-align-center">Fixed Bridge</th>
                </tr>
              </thead>
              <tbody>
                {
                  (() => {
                    const bestFusion = bestBridgeRates.fusion;
                    const bestVariable = bestBridgeRates.variable;
                    const bestFixed = bestBridgeRates.fixed;

                    if (!bestFusion && !bestVariable && !bestFixed) {
                      return (
                        <tr><td colSpan={4} className="slds-text-body_small">No results match the selected filters.</td></tr>
                      );
                    }

                    return (
                      <>
                        <tr>
                          <td>
                            <div className="font-weight-600">{(bestFusion && bestFusion.label) || (bestVariable && bestVariable.label) || (bestFixed && bestFixed.label) || 'Rates'}</div>
                          </td>
                          <td className="text-align-center">
                            {bestFusion ? (
                              <div className="slds-box slds-m-vertical_x-small">
                                <div>{bestFusion.rate != null ? `${bestFusion.rate}%` : '—'}</div>
                                <div className="helper-text">Loan: {bestFusion.min_loan ? `£${Number(bestFusion.min_loan).toLocaleString()}` : '—'} – {bestFusion.max_loan ? `£${Number(bestFusion.max_loan).toLocaleString()}` : '—'}</div>
                              </div>
                            ) : <div className="slds-text-body_small">—</div>}
                          </td>
                          <td className="text-align-center">
                            {bestVariable ? (
                              <div className="slds-box slds-m-vertical_x-small">
                                <div>{bestVariable.rate != null ? `${bestVariable.rate}%` : '—'}</div>
                                <div className="helper-text">LTV: {bestVariable.min_ltv ?? '—'}% – {bestVariable.max_ltv ?? '—'}%</div>
                              </div>
                            ) : <div className="slds-text-body_small">—</div>}
                          </td>
                          <td className="text-align-center">
                            {bestFixed ? (
                              <div className="slds-box slds-m-vertical_x-small">
                                <div>{bestFixed.rate != null ? `${bestFixed.rate}%` : '—'}</div>
                                <div className="helper-text">LTV: {bestFixed.min_ltv ?? '—'}% – {bestFixed.max_ltv ?? '—'}%</div>
                              </div>
                            ) : <div className="slds-text-body_small">—</div>}
                          </td>
                        </tr>

                        {
                          (() => {
                            const columnsHeaders = [ 'Fusion', 'Variable Bridge', 'Fixed Bridge' ];
                            const placeholders = [
                              'APRC', 'Admin Fee', 'Broker Client Fee', 'Broker Comission (Proc Fee %)',
                              'Broker Comission (Proc Fee £)', 'Commitment Fee £', 'Deferred Interest %', 'Deferred Interest £',
                              'Direct Debit', 'ERC', 'ERC (Fusion Only)', 'Exit Fee', 'Gross Loan', 'ICR', 'LTV', 'Monthly Interest Cost',
                              'NBP', 'Net Loan', 'Net LTV', 'Pay Rate', 'Product Fee %', 'Product Fee £', 'Revert Rate', 'Revert Rate DD',
                              'Rolled Months', 'Rolled Months Interest', 'Serviced Interest', 'Total Cost to Borrower', 'Total Loan Term'
                            ];

                            const values = {};
                            placeholders.forEach(p => { values[p] = {}; });

                            const colBest = [bestFusion, bestVariable, bestFixed];
                            const pv = parseNumber(propertyValue);
                            const grossInput = parseNumber(grossLoan);
                            const specificNet = parseNumber(specificNetLoan);

                            columnsHeaders.forEach((col, idx) => {
                              const best = colBest[idx];
                              const pf = best && (best.product_fee !== undefined ? Number(best.product_fee) : NaN);
                              if (pf && !Number.isNaN(pf)) values['Product Fee %'][col] = `${pf}%`;

                              if (Number.isFinite(grossInput)) values['Gross Loan'][col] = `£${Number(grossInput).toLocaleString('en-GB')}`;

                              if (Number.isFinite(grossInput) && pf && !Number.isNaN(pf)) {
                                const pfAmount = grossInput * (pf / 100);
                                values['Product Fee £'][col] = `£${Number(pfAmount).toLocaleString('en-GB')}`;
                                const net = (Number.isFinite(specificNet) ? specificNet : grossInput - pfAmount);
                                if (Number.isFinite(net)) values['Net Loan'][col] = `£${Number(net).toLocaleString('en-GB')}`;
                                if (Number.isFinite(pv)) values['LTV'][col] = `${((net / pv) * 100).toFixed(2)}%`;
                              }

                              if (best && best.pay_rate != null) {
                                values['Pay Rate'][col] = `${Number(best.pay_rate).toFixed(2)}%`;
                              } else if (best && best.rate != null) {
                                values['Pay Rate'][col] = `${Number(best.rate).toFixed(2)}%`;
                              }

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
