import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import '../styles/slds.css';
import '../styles/Calculator.scss';
import SaveQuoteButton from './SaveQuoteButton';
import IssueDIPModal from './IssueDIPModal';
import IssueQuoteModal from './IssueQuoteModal';
import CalculatorResultsPlaceholders from './CalculatorResultsPlaceholders';
import NotificationModal from './NotificationModal';
import { getQuote } from '../utils/quotes';
import { 
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST, 
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS, 
  LOCALSTORAGE_CONSTANTS_KEY, 
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE
} from '../config/constants';
import { API_BASE_URL } from '../config/api';

// Simple heuristic to compute Tier from selected options
// Assumptions: each option row contains a `tier` field (number or string). We'll pick the highest numeric tier
// among selected option values. If no selection, default to Tier 1.
function computeTierFromAnswers(answers) {
  let maxTier = 1;
  Object.values(answers).forEach((opt) => {
    if (!opt) return;
    const t = Number(opt.tier ?? opt.tier?.toString?.() ?? 1);
    if (!Number.isNaN(t) && t > maxTier) maxTier = t;
  });
  return maxTier;
}

export default function BTLcalculator({ initialQuote = null }) {
  const { supabase } = useSupabase();
  const [allCriteria, setAllCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  // This Calculator is restricted to BTL criteria only per user's request
  const criteriaSet = 'BTL';
  const [productScope, setProductScope] = useState('');
  const [retentionChoice, setRetentionChoice] = useState('No'); // default to 'No' to avoid 'Any' behaviour on load
  const [retentionLtv, setRetentionLtv] = useState('75'); // '65' or '75'
  const [topSlicing, setTopSlicing] = useState('');
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipContent, setTipContent] = useState('');
  const [hoveredTip, setHoveredTip] = useState(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Collapsible section states
  const [criteriaExpanded, setCriteriaExpanded] = useState(true);
  const [loanDetailsExpanded, setLoanDetailsExpanded] = useState(true);
  const [clientDetailsExpanded, setClientDetailsExpanded] = useState(true);
  
  // Range toggle state (Core or Specialist)
  const [selectedRange, setSelectedRange] = useState('specialist');
  // Client details
  const [clientType, setClientType] = useState('Direct'); // 'Direct' | 'Broker'
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [brokerRoute, setBrokerRoute] = useState(BROKER_ROUTES.DIRECT_BROKER);
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(BROKER_COMMISSION_DEFAULTS[BROKER_ROUTES.DIRECT_BROKER]);
  const [brokerCompanyName, setBrokerCompanyName] = useState('');
  
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
  
  // Quote id/ref for UI
  const [currentQuoteId, setCurrentQuoteId] = useState(initialQuote?.id || null);
  const [currentQuoteRef, setCurrentQuoteRef] = useState(initialQuote?.reference_number || null);


  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);
  // Property & Product inputs
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  // (Removed additional propertyType state - productScope drives product lists)
  // Additional fees UI
  const [addFeesToggle, setAddFeesToggle] = useState(false);
  const [feeCalculationType, setFeeCalculationType] = useState('pound'); // 'pound' or 'percentage'
  const [additionalFeeAmount, setAdditionalFeeAmount] = useState('');
  // normalize loanType values to match select option values used in the JSX
  const [loanType, setLoanType] = useState('Max gross loan');
  const [specificGrossLoan, setSpecificGrossLoan] = useState('');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [maxLtvInput, setMaxLtvInput] = useState(75);
  const [productType, setProductType] = useState('');
  // Fees: removed inline fee UI; Top slicing input added instead
  const [relevantRates, setRelevantRates] = useState([]);

  // DIP Modal state
  const [dipModalOpen, setDipModalOpen] = useState(false);
  const [dipData, setDipData] = useState({});
  const [selectedFeeTypeForDip, setSelectedFeeTypeForDip] = useState('');
  const [filteredRatesForDip, setFilteredRatesForDip] = useState([]);

  // Quote Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({});
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: e } = await supabase
          .from('criteria_config_flat')
          .select('*');
        if (e) throw e;
        // Debug log rows count
        // eslint-disable-next-line no-console
        setAllCriteria(data || []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [supabase]);

  // helper to format currency inputs with thousand separators (display-only)
  const formatCurrencyInput = (v) => {
    if (v === undefined || v === null || v === '') return '';
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n.toLocaleString('en-GB') : '';
  };

  const parseNumber = (v) => {
    if (v === undefined || v === null || v === '') return NaN;
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };

  const formatCurrency = (n) => {
    if (!Number.isFinite(n)) return '—';
    return `£${Number(n).toLocaleString('en-GB')}`;
  };

  const formatPercent = (n, decimals = 2) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '—';
    return `${Number(n).toFixed(decimals)}%`;
  };

  useEffect(() => {
    // build question map based on BTL criteriaSet and selected productScope
    const normalizeStr = (s) => (s || '').toString().trim().toLowerCase();
    const filtered = allCriteria.filter((r) => {
      if (!r) return false;
      // Only include rows belonging to the BTL criteria set and matching the product_scope
      const csMatch = normalizeStr(r.criteria_set) === 'btl';
      const psMatch = productScope ? normalizeStr(r.product_scope) === normalizeStr(productScope) : true;
      return csMatch && psMatch;
    });

    const map = {};
    filtered.forEach((row) => {
      const key = row.question_key || row.question || 'unknown';
      if (!map[key]) map[key] = { label: row.question_label || key, options: [], infoTip: '', displayOrder: undefined };
      // prefer explicit info_tip field; fall back to helper field if present
      if (!map[key].infoTip && (row.info_tip || row.helper)) {
        map[key].infoTip = row.info_tip || row.helper || '';
      }
      // capture a numeric display_order (admin-controlled ordering). Use the first defined value for the question.
      if (map[key].displayOrder === undefined && (row.display_order !== undefined && row.display_order !== null)) {
        const parsed = Number(row.display_order);
        map[key].displayOrder = Number.isFinite(parsed) ? parsed : undefined;
      }
      map[key].options.push({
        id: row.id,
        option_label: row.option_label,
        tier: row.tier,
        raw: row,
      });
    });

    // sort options by tier ascending
    Object.keys(map).forEach((k) => {
      map[k].options.sort((a, b) => (Number(a.tier) || 0) - (Number(b.tier) || 0));
    });

  setQuestions(map);
    // reset answers ONLY if there's no initialQuote (i.e., new quote, not loading existing)
    if (!initialQuote) {
      const starting = {};
      Object.keys(map).forEach((k) => {
        // default to first option
        starting[k] = map[k].options[0] || null;
      });
      setAnswers(starting);
    }
  }, [allCriteria, productScope, initialQuote]);

  // Auto-select a product scope when data loads if none selected
  useEffect(() => {
    if (!productScope) {
      const available = Array.from(new Set(allCriteria.map((r) => r.product_scope).filter(Boolean)));
      if (available.length > 0) {
        setProductScope(available[0]);
      }
    }
    // apply any constants overrides from localStorage for product lists (use productScope as the key)
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.productLists && productScope) {
          if (parsed.productLists[productScope] && parsed.productLists[productScope].length > 0) {
            setProductType(parsed.productLists[productScope][0]);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [allCriteria, productScope]);

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
      if (quote.monthly_rent != null) setMonthlyRent(formatCurrencyInput(quote.monthly_rent));
      if (quote.product_type) setProductType(quote.product_type);
      if (quote.product_scope) setProductScope(quote.product_scope);
      if (quote.specific_net_loan != null) setSpecificNetLoan(formatCurrencyInput(quote.specific_net_loan));
      if (quote.specific_gross_loan != null) setSpecificGrossLoan(formatCurrencyInput(quote.specific_gross_loan));
      if (quote.loan_calculation_requested) setLoanType(quote.loan_calculation_requested);
      if (quote.retention_ltv != null) setRetentionLtv(String(quote.retention_ltv));
      if (quote.retention_choice) setRetentionChoice(quote.retention_choice);
      if (quote.top_slicing != null) setTopSlicing(String(quote.top_slicing));
      if (quote.target_ltv != null) setMaxLtvInput(Number(quote.target_ltv));
      if (quote.add_fees_toggle != null) setAddFeesToggle(quote.add_fees_toggle);
      if (quote.fee_calculation_type) setFeeCalculationType(quote.fee_calculation_type);
      if (quote.additional_fee_amount != null) setAdditionalFeeAmount(String(quote.additional_fee_amount));
      if (quote.selected_range) setSelectedRange(quote.selected_range);
      
      // Load client details if available
      if (quote.client_type) setClientType(quote.client_type);
      if (quote.client_first_name) setClientFirstName(quote.client_first_name);
      if (quote.client_last_name) setClientLastName(quote.client_last_name);
      if (quote.client_email) setClientEmail(quote.client_email);
      if (quote.client_contact_number) setClientContact(quote.client_contact_number);
      if (quote.broker_company_name) setBrokerCompanyName(quote.broker_company_name);
      if (quote.broker_route) setBrokerRoute(quote.broker_route);
      if (quote.broker_commission_percent != null) setBrokerCommissionPercent(quote.broker_commission_percent);
      
      // Load calculated results if available (from quote_results table)
      if (quote.results && Array.isArray(quote.results) && quote.results.length > 0) {
        // Map database results back to the format expected by the calculator
        const loadedRates = quote.results.map(result => ({
          product_fee: result.fee_column,
          gross_loan: result.gross_loan,
          net_loan: result.net_loan,
          ltv: result.ltv_percentage,
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
          rolled_months_interest: result.rolled_months_interest,
          deferred_interest_percent: result.deferred_interest_percent,
          deferred_interest_pounds: result.deferred_interest_pounds,
          serviced_interest: result.serviced_interest,
          direct_debit: result.direct_debit,
          erc: result.erc,
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
      // ignore load errors
      // eslint-disable-next-line no-console
      console.debug('BTL: failed to apply initial quote', e);
    }
  }, [initialQuote]);

  // Ensure productType defaults to the first product for the selected productScope
  useEffect(() => {
    if (!productScope) return;
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const list = (parsed && parsed.productLists && parsed.productLists[productScope])
        || DEFAULT_PRODUCT_TYPES_LIST[productScope]
        || DEFAULT_PRODUCT_TYPES_LIST['Residential']
        || [];
      if (list.length > 0) {
        // only set if not set or current value not in list
        if (!productType || !list.includes(productType)) setProductType(list[0]);
      }
    } catch (e) {
      const list = DEFAULT_PRODUCT_TYPES_LIST[productScope] || DEFAULT_PRODUCT_TYPES_LIST['Residential'] || [];
      if (list.length > 0 && (!productType || !list.includes(productType))) setProductType(list[0]);
    }
  }, [productScope]);

  // compute tier when answers change
  const currentTier = computeTierFromAnswers(answers);

  // Fetch relevant rates whenever productScope, currentTier or productType changes
  useEffect(() => {
    if (!supabase) return;
    async function fetchRelevant() {
      // Do not attempt to fetch/filter rates until a productType is selected.
      // On initial page load productType can be empty which previously allowed all products through.
      if (!productType) {
        setRelevantRates([]);
        return;
      }
      try {
        const { data, error } = await supabase.from('rates_flat').select('*');
        if (error) throw error;
  // Filter client-side to avoid DB column mismatch errors.
  // We'll build matched using an explicit loop so we can collect debug samples when nothing matches.
  const debugSamples = [];
  const matched = [];
  const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const swapYrYear = (s) => (s || '').toString().replace(/yr/g, 'year').replace(/year/g, 'yr');
  const swapFixFixed = (s) => (s || '').toString().replace(/fix/g, 'fixed').replace(/fixed/g, 'fix');

  for (let i = 0; i < (data || []).length; i++) {
    const r = data[i];
    // tolerant tier matching
    const rtRaw = r.tier;
    const rtNumRaw = Number(rtRaw);
    let rtNum = Number.isFinite(rtNumRaw) ? rtNumRaw : NaN;
    if (Number.isNaN(rtNum)) {
      const m = (rtRaw || '').toString().match(/(\d+)/);
      rtNum = m ? Number(m[1]) : NaN;
    }
    const ct = Number(currentTier);
    const tierMatch = (!Number.isNaN(rtNum) && !Number.isNaN(ct)) ? (rtNum === ct) : (String(rtRaw).toLowerCase() === String(currentTier).toString().toLowerCase());

    // product matching: stricter token-based matching (year + type), fallback to normalized substring
    const productValRaw = (r.product || '').toString();
    const normRow = normalize(productValRaw);
    const normSelected = normalize(productType || '');

    const parseProduct = (s) => {
      const t = (s || '').toString().toLowerCase();
      const yearsMatch = t.match(/(\d+)\s*(yr|year)?/); // capture leading digits
      const years = yearsMatch ? yearsMatch[1] : null;
      let type = null;
      if (/track/.test(t)) type = 'tracker';
      else if (/fix/.test(t)) type = 'fix';
      else if (/variable/.test(t)) type = 'variable';
      return { years, type };
    };

    const selTokens = parseProduct(productType || '');
    const rowTokens = parseProduct(productValRaw || '');
    let productMatch = true;
    if (productType) {
      // If both have a year token, require years to match
      if (selTokens.years && rowTokens.years) {
        productMatch = selTokens.years === rowTokens.years;
      }
      // If both have a type token (fix/tracker), require type to match
      if (productMatch && selTokens.type && rowTokens.type) {
        productMatch = selTokens.type === rowTokens.type;
      }
      // If we couldn't confidently parse tokens, fallback to normalized substring equality
      if (!selTokens.years && !selTokens.type) {
        productMatch = normRow === normSelected || normRow.includes(normSelected) || normSelected.includes(normRow);
      }
    }

    // scope matching
    const scopeVal = ((r.property || r.product_scope || r.property_scope || r.set_key || '')).toString().toLowerCase();
    let scopeMatch = true;
    if (productScope) {
      const psLower = productScope.toString().toLowerCase();
      // If user selected Commercial, do NOT include Semi-Commercial variants (treat them separately).
      // i.e. match rows that contain 'commercial' but exclude rows that specifically indicate 'semi-commercial'.
      if (psLower === 'commercial') {
        scopeMatch = (scopeVal.includes('commercial') && !/semi[-_ ]?commercial/.test(scopeVal));
      } else {
        scopeMatch = scopeVal === psLower || scopeVal.includes(psLower);
      }
    }

    // retention matching: more robust detection
    const detectRetention = (row) => {
      // probe for different possible column names
      const retentionKeys = ['is_retention', 'isRetention', 'retention', 'retained', 'is_retained'];
      let v = null;
      for (const k of retentionKeys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          v = row[k];
          break;
        }
      }

      if (v === null) {
        // if no explicit retention column, fall back to scanning product text
        const productText = (row.product || '').toString().toLowerCase();
        return productText.includes('retention');
      }

      // handle boolean, numeric or string encodings
      const s = String(v).toLowerCase().trim();
      return v === true || ['true', 'yes', '1', 'y', 't'].includes(s);
    };

    const isRetentionRow = detectRetention(r);
    // By default assume row passes retention/LTV checks
    let passesRetentionAndLtv = true;

    // Read row max ltv once
    const rowMaxLtv = Number(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? 0);

    // Special-case override: configurable Flat-above-commercial rule from Constants UI/localStorage.
    // Read overrides from localStorage, fall back to default constant.
    let flatAboveCommercialOverrideObj = DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
    try {
      const rawOverrides = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (rawOverrides) {
        const parsed = JSON.parse(rawOverrides);
        if (parsed && parsed.flatAboveCommercialRule) flatAboveCommercialOverrideObj = parsed.flatAboveCommercialRule;
      }
    } catch (e) {
      // ignore parse issues and use default
    }

    const psLower = (productScope || '').toString().toLowerCase();
    const enabled = !!flatAboveCommercialOverrideObj && flatAboveCommercialOverrideObj.enabled;
    let flatOverrideMatches = false;
    if (enabled) {
      const matcher = (flatAboveCommercialOverrideObj.scopeMatcher || '').toString().toLowerCase();
      const tokens = matcher.split(',').map((s) => s.trim()).filter(Boolean);
      if (tokens.length === 0) {
        flatOverrideMatches = matcher.length > 0 && psLower.includes(matcher);
      } else {
        flatOverrideMatches = tokens.every((t) => psLower.includes(t));
      }
    }

    if (flatOverrideMatches) {
      const ctNum = Number(currentTier);
      const tier2Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['2']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2']);
      const tier3Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['3']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3']);
      if (!Number.isFinite(rowMaxLtv) || rowMaxLtv <= 0) {
        passesRetentionAndLtv = false;
      } else if (ctNum === 2) {
        passesRetentionAndLtv = rowMaxLtv <= tier2Val;
      } else if (ctNum === 3) {
        // interpret tier3 as values greater than tier2 up to tier3
        passesRetentionAndLtv = rowMaxLtv > (tier2Val || 0) && rowMaxLtv <= tier3Val;
      } else {
        passesRetentionAndLtv = true;
      }
    } else {
      // Normal retention filtering behavior.
      if (retentionChoice === 'Yes') {
        // Per user spec: if retention is 'Yes', the row MUST be a retention row.
        if (!isRetentionRow) {
          passesRetentionAndLtv = false;
        } else {
          // If it IS a retention row, THEN we apply LTV gating.
          const selectedLtv = Number(retentionLtv);
          if (Number.isFinite(rowMaxLtv) && rowMaxLtv > 0) {
            if (selectedLtv === 65) {
              passesRetentionAndLtv = rowMaxLtv <= 65;
            } else if (selectedLtv === 75) {
              // For 75% LTV, the range is typically >65% and <=75%
              passesRetentionAndLtv = rowMaxLtv > 65 && rowMaxLtv <= 75;
            } else {
              // Fallback for any other LTV, though UI is fixed to 65/75
              passesRetentionAndLtv = rowMaxLtv <= selectedLtv;
            }
          } else {
            // If a retention row has no max_ltv, it cannot pass the LTV check.
            passesRetentionAndLtv = false;
          }
        }
      } else if (retentionChoice === 'No') {
        // If retention is 'No', the row must NOT be a retention row.
        passesRetentionAndLtv = !isRetentionRow;
      }
    }

    if (i < 8) {
      debugSamples.push({
        product: productValRaw,
        normRow,
        productType,
        normSelected,
        tierRaw: rtRaw,
        tierMatch,
        scopeVal,
        scopeMatch,
        isRetentionRow,
        passesRetentionAndLtv,
        max_ltv: r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? null,
      });
    }

    if (tierMatch && productMatch && scopeMatch && passesRetentionAndLtv) matched.push(r);
  }
        // Deduplicate exact-duplicate rows (some CSV imports may create repeated rows).
        const unique = {};
        (matched || []).forEach((r) => {
          const key = `${r.product || ''}||${r.rate || ''}||${r.property || ''}||${r.tier || ''}||${r.product_fee || ''}`;
          if (!unique[key]) unique[key] = r;
        });
        const deduped = Object.values(unique);
        // Try to sort by numeric rate if possible (ascending)
        deduped.sort((a, b) => {
          const na = Number((a.rate || '').toString().replace('%', ''));
          const nb = Number((b.rate || '').toString().replace('%', ''));
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return String(a.rate).localeCompare(String(b.rate));
        });
        // Client-side fee-column filtering: hide rates whose product_fee is present but not
        // included in the active fee columns for the selected productScope.
        // Build dynamic fee column key based on retention state and range
        let feeColumnKey = productScope;
        if (retentionChoice === 'Yes') {
          // For retention products, use specialized fee columns
          if (selectedRange === 'core') {
            feeColumnKey = `Core_Retention_${retentionLtv}`;
          } else {
            feeColumnKey = `Retention${productScope}`;
          }
        }
        
        let activeFeeCols = [];
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.feeColumns && parsed.feeColumns[feeColumnKey]) {
              activeFeeCols = parsed.feeColumns[feeColumnKey].map((n) => Number(n));
            }
          }
        } catch (e) {
          // ignore
        }
        if (!activeFeeCols || activeFeeCols.length === 0) {
          activeFeeCols = (DEFAULT_FEE_COLUMNS[feeColumnKey] || DEFAULT_FEE_COLUMNS[productScope] || DEFAULT_FEE_COLUMNS['Residential'] || []).map((n) => Number(n));
        }

        const feeFiltered = deduped.filter((r) => {
          const pf = r.product_fee;
          if (pf === undefined || pf === null || pf === '') return true; // keep rows without explicit product_fee
          const pfNum = Number(pf);
          if (Number.isNaN(pfNum)) return true; // non-numeric fees - keep
          // include only when the fee value is present in the active columns
          return activeFeeCols.includes(pfNum);
        });

        setRelevantRates(feeFiltered);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch relevant rates', err);
      }
    }
    fetchRelevant();
  }, [supabase, productScope, currentTier, productType, retentionChoice, retentionLtv, selectedRange]);

  // Compute calculated rates with all financial values
  const calculatedRates = useMemo(() => {
    if (!relevantRates || relevantRates.length === 0) return [];

    const pv = parseNumber(propertyValue);
    const specificGross = parseNumber(specificGrossLoan);
    const specificNet = parseNumber(specificNetLoan);
    const monthlyRentNum = parseNumber(monthlyRent);
    const topSlicingNum = parseNumber(topSlicing);
    const additionalFeeNum = parseNumber(additionalFeeAmount);

    return relevantRates.map(rate => {
      // Determine gross loan based on loan calculation type
      let gross = NaN;
      if (loanType === 'Specific gross loan' && Number.isFinite(specificGross)) {
        gross = specificGross;
      } else if (loanType === 'Specific net loan' && Number.isFinite(specificNet)) {
        // Work backwards from net loan to gross loan
        const pfPercent = Number(rate.product_fee);
        if (!Number.isNaN(pfPercent)) {
          gross = specificNet / (1 - pfPercent / 100);
        }
      } else if (loanType === 'Max gross loan' && Number.isFinite(pv)) {
        // Use max LTV from rate or input
        const maxLtv = Number(rate.max_ltv || maxLtvInput);
        gross = pv * (maxLtv / 100);
      }

      // Product fee calculations
      const pfPercent = Number(rate.product_fee);
      const pfAmount = Number.isFinite(gross) && !Number.isNaN(pfPercent) ? gross * (pfPercent / 100) : NaN;
      
      // Admin fee
      const adminFee = Number(rate.admin_fee) || 0;

      // Net loan calculation
      let net = gross;
      if (Number.isFinite(pfAmount)) net -= pfAmount;
      if (Number.isFinite(adminFee)) net -= adminFee;
      
      // Additional fees
      let brokerClientFee = 0;
      if (addFeesToggle && Number.isFinite(additionalFeeNum)) {
        if (feeCalculationType === 'percentage') {
          brokerClientFee = gross * (additionalFeeNum / 100);
        } else {
          brokerClientFee = additionalFeeNum;
        }
        net -= brokerClientFee;
      }

      // LTV calculations
      const ltvPercent = Number.isFinite(pv) && pv > 0 ? (gross / pv * 100) : NaN;
      const netLtv = Number.isFinite(pv) && pv > 0 ? (net / pv * 100) : NaN;

      // ICR calculation
      const initialRate = Number(rate.rate);
      const monthlyInterest = Number.isFinite(gross) && Number.isFinite(initialRate) ? gross * (initialRate / 100) / 12 : NaN;
      const icr = Number.isFinite(monthlyRentNum) && Number.isFinite(monthlyInterest) && monthlyInterest > 0 
        ? (monthlyRentNum / monthlyInterest * 100) 
        : NaN;

      // Broker commission (proc fee) - 1% of gross loan
      const procFeePercent = Number(rate.proc_fee) || 1;
      const brokerCommissionProcFeePounds = Number.isFinite(gross) ? gross * (procFeePercent / 100) : NaN;

      return {
        ...rate,
        gross_loan: Number.isFinite(gross) ? gross.toFixed(2) : null,
        net_loan: Number.isFinite(net) ? net.toFixed(2) : null,
        ltv: Number.isFinite(ltvPercent) ? ltvPercent.toFixed(2) : null,
        net_ltv: Number.isFinite(netLtv) ? netLtv.toFixed(2) : null,
        property_value: Number.isFinite(pv) ? pv.toFixed(2) : null,
        icr: Number.isFinite(icr) ? icr.toFixed(2) : null,
        initial_rate: initialRate,
        pay_rate: initialRate, // Assuming pay rate same as initial rate for BTL
        product_fee_percent: pfPercent,
        product_fee_pounds: Number.isFinite(pfAmount) ? pfAmount.toFixed(2) : null,
        admin_fee: adminFee,
        broker_client_fee: brokerClientFee > 0 ? brokerClientFee.toFixed(2) : null,
        broker_commission_proc_fee_percent: procFeePercent,
        broker_commission_proc_fee_pounds: Number.isFinite(brokerCommissionProcFeePounds) ? brokerCommissionProcFeePounds.toFixed(2) : null,
        monthly_interest_cost: Number.isFinite(monthlyInterest) ? monthlyInterest.toFixed(2) : null,
        rent: Number.isFinite(monthlyRentNum) ? monthlyRentNum.toFixed(2) : null,
        top_slicing: Number.isFinite(topSlicingNum) ? topSlicingNum.toFixed(2) : null,
        product_name: rate.product || null,
        // Add other fields that might be needed
        revert_rate: null, // Not calculated in BTL
        revert_rate_dd: null,
        full_rate: null,
        aprc: null,
        commitment_fee_pounds: null,
        exit_fee: null,
        rolled_months: null,
        rolled_months_interest: null,
        deferred_interest_percent: null,
        deferred_interest_pounds: null,
        serviced_interest: null,
        direct_debit: null,
        erc: null,
        nbp: null,
        total_cost_to_borrower: null,
        total_loan_term: null
      };
    });
  }, [relevantRates, propertyValue, specificGrossLoan, specificNetLoan, monthlyRent, topSlicing, loanType, maxLtvInput, addFeesToggle, feeCalculationType, additionalFeeAmount]);

  const handleAnswerChange = (questionKey, optionIndex) => {
    setAnswers((prev) => {
      const opt = questions[questionKey].options[optionIndex];
      return { ...prev, [questionKey]: opt };
    });
  };

  // small helper: product select control so we can render it in two places conditionally
  const productSelectControl = (
    <select className="slds-select" value={productType} onChange={(e) => setProductType(e.target.value)}>
      {(() => {
        // read product lists from localStorage overrides first, fall back to default
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.productLists && productScope && parsed.productLists[productScope]) {
              return parsed.productLists[productScope].map((p) => <option key={p}>{p}</option>);
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        // fall back: try productScope then 'Residential'
        const key = productScope || 'Residential';
        return (DEFAULT_PRODUCT_TYPES_LIST[key] || DEFAULT_PRODUCT_TYPES_LIST['Residential'] || []).map((p) => <option key={p}>{p}</option>);
      })()}
    </select>
  );



  // Build unique product_scope values for top control; criteria_set is fixed to BTL
  const productScopes = Array.from(new Set(allCriteria.map((r) => r.product_scope).filter(Boolean)));

  // DIP Modal Handlers
  const handleSaveDipData = async (quoteId, dipData) => {
    try {
      // Save DIP data (don't include filtered_rates - it's not a database column)
      const dataToSave = { ...dipData };

      const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'BTL',
          ...dataToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save DIP data');
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
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
      
      setNotification({ show: true, type: 'success', title: 'Success', message: 'DIP PDF generated successfully!' });
    } catch (err) {
      console.error('Error creating PDF:', err);
      setNotification({ show: true, type: 'error', title: 'Error', message: `Failed to create DIP PDF: ${err.message}` });
      throw err;
    }
  };

  // Get available fee types for BTL (extract from relevantRates)
  const getAvailableFeeTypes = () => {
    if (!relevantRates || relevantRates.length === 0) return [];
    
    // Build fee buckets similar to how they're displayed in the results table
    const feeBucketsSet = new Set(relevantRates.map((r) => {
      if (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') return 'none';
      return String(r.product_fee);
    }));
    
    // Sort: numeric values first, then 'none' last
    const feeBuckets = Array.from(feeBucketsSet).sort((a, b) => {
      if (a === 'none') return 1;
      if (b === 'none') return -1;
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    
    // Format as displayed in results: "Fee: 2%" or "Fee: —" for none
    return feeBuckets.map(fb => fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`);
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
          calculator_type: 'BTL',
          ...updatedQuoteData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save quote data');
      }

      // Don't close modal or show alert here - let the modal handle it
    } catch (error) {
      console.error('Error saving quote data:', error);
      throw error; // Re-throw so modal can handle the error
    }
  };

  const handleCreateQuotePDF = async (quoteId) => {
    try {
      // Trigger PDF generation
      const response = await fetch(`${API_BASE_URL}/api/quote/pdf/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate quote PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote_${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setQuoteModalOpen(false);
    } catch (error) {
      console.error('Error generating quote PDF:', error);
      throw error; // Re-throw so modal can handle the error
    }
  };

  // Check if both Core and Specialist ranges have rates available
  const hasBothRanges = () => {
    if (!relevantRates || relevantRates.length === 0) return false;
    
    const hasCoreRates = relevantRates.some(r => {
      const rateType = (r.rate_type || r.type || '').toString().toLowerCase();
      return rateType === 'core' || rateType.includes('core');
    });
    
    const hasSpecialistRates = relevantRates.some(r => {
      const rateType = (r.rate_type || r.type || '').toString().toLowerCase();
      return rateType === 'specialist' || rateType.includes('specialist') || !rateType || rateType === '';
    });
    
    return hasCoreRates && hasSpecialistRates;
  };

  // Handle fee type selection in DIP modal to filter rates
  const handleFeeTypeSelection = (feeTypeLabel) => {
    setSelectedFeeTypeForDip(feeTypeLabel);
    
    if (!feeTypeLabel || !relevantRates || relevantRates.length === 0) {
      setFilteredRatesForDip([]);
      return;
    }

    // Extract the fee value from label (e.g., "Fee: 2%" -> "2", "Fee: —" -> "none")
    let feeValue = 'none';
    if (feeTypeLabel.includes('%')) {
      const match = feeTypeLabel.match(/Fee:\s*(\d+(?:\.\d+)?)%/);
      if (match) {
        feeValue = match[1];
      }
    } else if (feeTypeLabel === 'Fee: —') {
      feeValue = 'none';
    }

    // Filter rates by the selected fee
    const filtered = relevantRates.filter(r => {
      const rateFee = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
      return rateFee === feeValue;
    });

    setFilteredRatesForDip(filtered);
  };

  // Defensive: show helpful message if Supabase client missing
  if (!supabase) {
    return (
      <div className="slds-p-around_medium">
        <div className="slds-text-color_error">Supabase client not available. Calculator cannot load data.</div>
      </div>
    );
  }

  // Visible debug header so the page is never blank
  const totalRows = allCriteria.length;
  const btlRows = allCriteria.filter((r) => (r.criteria_set || '').toString() === 'BTL').length;
  const questionCount = Object.keys(questions).length;
  // Decide how many columns to render for questions: up to 4, but don't create empty columns when fewer questions exist
  const questionColumns = Math.min(4, Math.max(1, questionCount));

  // Calculate dynamic maximum LTV based on current selections
  const calculateMaxAvailableLtv = () => {
    // Check if flat-above-commercial rule applies based on CRITERIA ANSWER
    let flatAboveCommercialOverrideObj = DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE;
    try {
      const rawOverrides = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
      if (rawOverrides) {
        const parsed = JSON.parse(rawOverrides);
        if (parsed && parsed.flatAboveCommercialRule) flatAboveCommercialOverrideObj = parsed.flatAboveCommercialRule;
      }
    } catch (e) {
      // ignore
    }

    const enabled = !!flatAboveCommercialOverrideObj && flatAboveCommercialOverrideObj.enabled;
    
    // Check if user answered "Yes" to "Flat Above Commercial?" criteria question
    let flatAboveCommercialAnswer = null;
    Object.keys(answers).forEach((questionKey) => {
      const questionLabel = (questions[questionKey]?.label || '').toLowerCase();
      if (questionLabel.includes('flat') && questionLabel.includes('commercial')) {
        const answer = answers[questionKey];
        const answerLabel = (answer?.option_label || '').toLowerCase();
        if (answerLabel === 'yes' || answerLabel === 'y') {
          flatAboveCommercialAnswer = true;
        }
      }
    });

    // If flat-above-commercial rule applies (enabled AND user answered Yes), use tier-based LTV limits
    if (enabled && flatAboveCommercialAnswer) {
      const ctNum = Number(currentTier);
      const tier2Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['2']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] || 65);
      const tier3Val = Number((flatAboveCommercialOverrideObj.tierLtv && flatAboveCommercialOverrideObj.tierLtv['3']) || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] || 75);
      
      if (ctNum === 2) return tier2Val; // 65%
      if (ctNum === 3) return tier3Val; // 75%
      return 75; // default for tier 1 or other tiers
    }

    // For retention products, use retention LTV value
    if (retentionChoice === 'Yes') {
      const retLtv = Number(retentionLtv);
      return retLtv;
    }

    // Otherwise, find max LTV from available rates
    if (relevantRates && relevantRates.length > 0) {
      const maxFromRates = Math.max(...relevantRates.map(r => {
        const ltv = Number(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? 0);
        return Number.isFinite(ltv) ? ltv : 0;
      }));
      if (maxFromRates > 0) {
        return maxFromRates;
      }
    }

    // Default fallback
    console.log('Using default fallback LTV: 75');
    return 75;
  };

  const dynamicMaxLtv = calculateMaxAvailableLtv();
  
  // LTV slider range bounds (used for percentage calculation and to keep UI consistent)
  const ltvMin = 20;
  const ltvMax = dynamicMaxLtv;
  const ltvPercent = Math.round(((maxLtvInput - ltvMin) / (ltvMax - ltvMin)) * 100);

  // Clamp maxLtvInput when dynamicMaxLtv changes
  useEffect(() => {
    if (maxLtvInput > dynamicMaxLtv) {
      setMaxLtvInput(dynamicMaxLtv);
    }
  }, [dynamicMaxLtv, maxLtvInput]);

  // Determine display order for questions: prefer numeric `displayOrder` (from DB) then fall back to label
  const orderedQuestionKeys = Object.keys(questions).sort((a, b) => {
    const da = questions[a]?.displayOrder;
    const db = questions[b]?.displayOrder;
    if (da !== undefined && db !== undefined) return (Number(da) || 0) - (Number(db) || 0);
    if (da !== undefined) return -1;
    if (db !== undefined) return 1;
    const la = (questions[a]?.label || a).toString();
    const lb = (questions[b]?.label || b).toString();
    return la.localeCompare(lb, undefined, { sensitivity: 'base', numeric: true });
  });

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
      
      {/* Top filters inline - no card */}
      <div className="top-filters">
        <div className="slds-form-element">
          <label className="slds-form-element__label">Product Type</label>
          <div className="slds-form-element__control">
            <div><strong>BTL</strong></div>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Product Scope</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={productScope} onChange={(e) => setProductScope(e.target.value)}>
              {productScopes.map((ps) => (
                <option key={ps} value={ps}>{ps}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Retention?</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={retentionChoice} onChange={(e) => setRetentionChoice(e.target.value)}>
             <option value="No">No</option>
              <option value="Yes">Yes</option>
              
            </select>
          </div>
        </div>

        {retentionChoice === 'Yes' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">Retention LTV</label>
            <div className="slds-form-element__control">
              <select className="slds-select" value={retentionLtv} onChange={(e) => setRetentionLtv(e.target.value)}>
                <option value="65">65%</option>
                <option value="75">75%</option>
              </select>
            </div>
          </div>
        )}

        <div className="tier-display">
          <span className="tier-label">Based on the criteria:</span>
          <strong className="tier-value">Tier {currentTier}</strong>
        </div>

        <div className="tier-display" style={{ backgroundColor: '#e3f3ff', border: '1px solid #0176d3' }}>
          <span className="tier-label">Max LTV available:</span>
          <strong className="tier-value" style={{ color: '#0176d3' }}>{dynamicMaxLtv}%</strong>
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
            calculatorType="BTL"
            calculationData={{
              productScope,
              retentionChoice,
              retentionLtv,
              tier: currentTier,
              propertyValue,
              monthlyRent,
              topSlicing,
              loanType,
              specificGrossLoan,
              specificNetLoan,
              targetLtv: maxLtvInput,
              productType,
              addFeesToggle,
              feeCalculationType,
              additionalFeeAmount,
              selectedRange,
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
              relevantRates: calculatedRates,
              selectedRate: (filteredRatesForDip && filteredRatesForDip.length > 0) 
                ? filteredRatesForDip[0] 
                : (calculatedRates && calculatedRates.length > 0 ? calculatedRates[0] : null),
            }}
            allColumnData={[]}
            bestSummary={null}
            existingQuote={initialQuote}
            showProductRangeSelection={hasBothRanges()}
            onSaved={(savedQuote) => {
              // Update currentQuoteId when quote is saved for the first time
              if (savedQuote && savedQuote.id && !currentQuoteId) {
                setCurrentQuoteId(savedQuote.id);
              }
              if (savedQuote && savedQuote.reference_number) {
                setCurrentQuoteRef(savedQuote.reference_number);
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

      {tipOpen && (
        <>
          <div className="slds-backdrop slds-backdrop_open" />
          <div className="slds-modal slds-fade-in-open">
            <div className="slds-modal__container">
              <div className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setTipOpen(false)}
                  title="Close"
                >
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Info</h2>
              </div>
              <div className="slds-modal__content slds-p-around_medium">
                <div dangerouslySetInnerHTML={{ __html: String(tipContent).replace(/\n/g, '<br/>') }} />
              </div>
              <div className="slds-modal__footer">
                <button className="slds-button slds-button_brand" onClick={() => setTipOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      

      

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
          {loading && <div>Loading criteria…</div>}
          {error && <div className="slds-text-color_error">{error}</div>}
          {!loading && !error && (
            <div className="criteria-grid">
              {Object.keys(questions).length === 0 && <div>No criteria found for this set/scope.</div>}
              {orderedQuestionKeys.map((qk) => {
                const q = questions[qk];
                return (
                <div key={qk} className="slds-form-element">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label className="slds-form-element__label" style={{ margin: 0 }}>
                      <span className="required-asterisk">*</span>{q.label}
                    </label>
                    {q.infoTip && (
                      <div className="info-icon-wrapper">
                        <button
                          type="button"
                          className="info-icon-button"
                          onClick={() => { setTipContent(q.infoTip); setTipOpen(true); }}
                          onMouseEnter={() => {
                            if (hideTimerRef.current) {
                              clearTimeout(hideTimerRef.current);
                              hideTimerRef.current = null;
                            }
                            if (showTimerRef.current) clearTimeout(showTimerRef.current);
                            showTimerRef.current = setTimeout(() => setHoveredTip(qk), 150);
                          }}
                          onMouseLeave={() => {
                            if (showTimerRef.current) {
                              clearTimeout(showTimerRef.current);
                              showTimerRef.current = null;
                            }
                            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                            hideTimerRef.current = setTimeout(() => setHoveredTip(null), 200);
                          }}
                          aria-label={`Info: ${q.label}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="#0176d3" strokeWidth="1.6" fill="#ffffff" />
                            <rect x="11" y="10" width="2" height="6" rx="1" fill="#0176d3" />
                            <rect x="11" y="7" width="2" height="2" rx="1" fill="#0176d3" />
                          </svg>
                        </button>
                        <span className={`info-tooltip ${hoveredTip === qk ? 'visible' : ''}`} role="tooltip">
                          {q.infoTip}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="slds-form-element__control">
                    <select
                      className="slds-select"
                      value={(() => {
                        const selectedIndex = q.options.findIndex(opt => {
                          const a = answers[qk];
                          if (!a) return false;
                          if (opt.id && a.id) return opt.id === a.id;
                          return (opt.option_label || '').toString().trim() === (a.option_label || '').toString().trim();
                        });
                        return selectedIndex >= 0 ? selectedIndex : 0;
                      })()}
                      onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}
                    >
                      {q.options.map((opt, idx) => (
                        <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>      <section className="collapsible-section">
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
              <label className="slds-form-element__label">
                <span className="required-asterisk">*</span>Property value
              </label>
              <div className="slds-form-element__control">
                <input 
                  className="slds-input" 
                  value={propertyValue} 
                  onChange={(e) => setPropertyValue(formatCurrencyInput(e.target.value))} 
                  placeholder="£1,200,000" 
                />
                <div className="helper-text">Subject to valuation</div>
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">
                <span className="required-asterisk">*</span>Monthly rent
              </label>
              <div className="slds-form-element__control">
                <input 
                  className="slds-input" 
                  value={monthlyRent} 
                  onChange={(e) => setMonthlyRent(formatCurrencyInput(e.target.value))} 
                  placeholder="£3,000" 
                />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Top slicing</label>
              <div className="slds-form-element__control">
                <input 
                  className="slds-input" 
                  value={topSlicing} 
                  onChange={(e) => setTopSlicing(e.target.value)} 
                  placeholder="e.g. 600" 
                />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">
                <span className="required-asterisk">*</span>Loan calculation requested
              </label>
              <div className="slds-form-element__control">
                <select 
                  className="slds-select" 
                  value={loanType} 
                  onChange={(e) => setLoanType(e.target.value)}
                >
                  <option value="Max gross loan">Max Gross Loan</option>
                  <option value="Net loan required">Net loan required</option>
                  <option value="Specific LTV required">Specific LTV Required</option>
                  <option value="Specific gross loan">Specific Gross Loan</option>
                </select>
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">
                <span className="required-asterisk">*</span>Select your product
              </label>
              <div className="slds-form-element__control">
                  {productSelectControl}
                  <div className="helper-text">Default is first product for the selected product scope</div>
                </div>
            </div>

            {loanType === 'Net loan required' && (
              <div className="slds-form-element">
                <label className="slds-form-element__label">
                  <span className="required-asterisk">*</span>Net loan required
                </label>
                <div className="slds-form-element__control">
                  <input 
                    className="slds-input" 
                    value={specificNetLoan} 
                    onChange={(e) => setSpecificNetLoan(formatCurrencyInput(e.target.value))} 
                    placeholder="£425,000" 
                  />
                  <div className="helper-text">Maximum GLA £9,000,000</div>
                </div>
              </div>
            )}

            {loanType === 'Specific LTV required' && (
              <div className="slds-form-element">
                <label className="slds-form-element__label">
                  <span className="required-asterisk">*</span>Target LTV (%)
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="range"
                    min={ltvMin}
                    max={ltvMax}
                    value={maxLtvInput}
                    onChange={(e) => setMaxLtvInput(Number(e.target.value))}
                    aria-valuemin={ltvMin}
                    aria-valuemax={ltvMax}
                    aria-valuenow={maxLtvInput}
                    className="ltv-slider"
                    style={{ background: `linear-gradient(90deg, #0176d3 ${ltvPercent}%, #e9eef5 ${ltvPercent}%)` }}
                  />
                  <div className="helper-text">
                    Selected: <strong>{maxLtvInput}%</strong> (Max available: <strong>{ltvMax}%</strong>)
                  </div>
                </div>
              </div>
            )}

            {loanType === 'Specific gross loan' && (
              <div className="slds-form-element">
                <label className="slds-form-element__label">
                  <span className="required-asterisk">*</span>Specific gross loan
                </label>
                <div className="slds-form-element__control">
                  <input 
                    className="slds-input" 
                    value={specificGrossLoan} 
                    onChange={(e) => setSpecificGrossLoan(formatCurrencyInput(e.target.value))} 
                    placeholder="£550,000" 
                  />
                  <div className="helper-text">Enter desired gross loan amount</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      

      {/* Range toggle buttons - Core / Specialist */}
      <div className="range-toggle-container">
        <div className="range-toggle-buttons">
          <button
            className={`range-button ${selectedRange === 'specialist' ? 'active' : ''}`}
            onClick={() => setSelectedRange('specialist')}
            type="button"
          >
            Specialist range
          </button>
          <button
            className={`range-button ${selectedRange === 'core' ? 'active' : ''}`}
            onClick={() => setSelectedRange('core')}
            type="button"
          >
            Core range
          </button>
        </div>

        {/* Rates display */}
        <div className="rates-display">
          {(() => {
            // Filter rates based on selected range
            const filteredRates = relevantRates.filter(r => {
              const rateType = (r.rate_type || r.type || '').toString().toLowerCase();
              if (selectedRange === 'core') {
                return rateType === 'core' || rateType.includes('core');
              } else {
                return rateType === 'specialist' || rateType.includes('specialist') || !rateType || rateType === '';
              }
            });

            // Build fee buckets (unique product_fee values). Use 'none' for rows without an explicit fee.
            const feeBucketsSet = new Set((filteredRates || []).map((r) => {
              if (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') return 'none';
              return String(r.product_fee);
            }));
            // prefer numeric sort for numeric buckets, keep 'none' last
            const feeBuckets = Array.from(feeBucketsSet).sort((a, b) => {
              if (a === 'none') return 1;
              if (b === 'none') return -1;
              const na = Number(a);
              const nb = Number(b);
              if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
              return a.localeCompare(b);
            });

                    return (
                      <>
                        <div className="rates-count">
                          Found {filteredRates.length} matching {selectedRange} rates for {productType}, Tier {currentTier}
                        </div>
                        {feeBuckets.length === 0 ? (
                          <div className="no-rates">No {selectedRange} range rates available for the selected criteria.</div>
                        ) : (
                          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                            <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ minWidth: Math.max(600, feeBuckets.length * 220) }}>
                              <thead>
                                <tr>
                                  {/* increased label column width */}
                                  <th style={{ width: '200px' }}>Label</th>
                                  {feeBuckets.map((fb) => (
                                    <th key={fb} style={{ width: `${(100 - 15) / feeBuckets.length}%`, textAlign: 'center' }}>
                                      {fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  {/* Label column: show 'Rates' for the results row or the first label available */}
                                  <td style={{ verticalAlign: 'top', fontWeight: 600 }}>Rates</td>
                                  {feeBuckets.map((fb) => {
                                    const rows = filteredRates.filter(r => {
                                      const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                      return key === fb;
                                    });
                                    return (
                                      <td key={fb} style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                        {rows.length === 0 ? (
                                          <div className="slds-text-body_small">—</div>
                                        ) : rows.map(r => (
                                          <div key={(r.id || r.product) + '::' + (r.rate || '')} className="slds-box slds-m-bottom_x-small">
                                            <div style={{ fontWeight: 600 }}>{r.product}</div>
                                            <div>{r.rate != null ? `${r.rate}%` : '—'}</div>
                                            <div style={{ color: '#666', fontSize: '0.85rem' }}>{r.property || r.product_scope || '—'}</div>
                                          </div>
                                        ))}
                                      </td>
                                    );
                                  })}
                                </tr>
                                {/* Render placeholders aligned with the same fee-bucket columns as additional table rows */}
                                {
                                  (() => {
                                    const columnsHeaders = feeBuckets.map((fb) => (fb === 'none' ? 'Fee: —' : `Fee: ${fb}%`));
                                    const placeholders = [
                                      'APRC','Admin Fee','Broker Client Fee','Broker Comission (Proc Fee %)',
                                      'Broker Comission (Proc Fee £)','Commitment Fee £','Deferred Interest %','Deferred Interest £',
                                      'Direct Debit','ERC','Gross Loan','ICR','Initial Rate','LTV','Monthly Interest Cost',
                                      'NBP','Net Loan','Net LTV','Pay Rate','Product Fee %','Product Fee £','Revert Rate',
                                      'Revert Rate DD','Rolled Months','Rolled Months Interest','Serviced Interest',
                                      'Total Cost to Borrower','Total Loan Term'
                                    ];

                                    const values = {};
                                    placeholders.forEach(p => { values[p] = {}; });

                                    // compute per-column values
                                    feeBuckets.forEach((fb, idx) => {
                                      const colKey = columnsHeaders[idx];
                                      const rows = filteredRates.filter(r => {
                                        const key = (r.product_fee === undefined || r.product_fee === null || r.product_fee === '') ? 'none' : String(r.product_fee);
                                        return key === fb;
                                      });
                                      const best = (rows || []).filter(r => r.rate != null).sort((a,b) => Number(a.rate) - Number(b.rate))[0] || (rows || [])[0] || null;

                                      // Initial Rate
                                      if (best && best.rate != null) values['Initial Rate'][colKey] = formatPercent(best.rate, 2);

                                      // Product Fee %
                                      const pfPercent = fb === 'none' ? NaN : Number(fb);
                                      if (!Number.isNaN(pfPercent)) values['Product Fee %'][colKey] = `${pfPercent}%`;

                                      // Gross Loan: use specificGrossLoan if provided, otherwise estimate from propertyValue and maxLtvInput
                                      const pv = parseNumber(propertyValue);
                                      const specificGross = parseNumber(specificGrossLoan);
                                      let gross = Number.isFinite(specificGross) ? specificGross : (Number.isFinite(pv) ? pv * (Number(maxLtvInput) / 100) : NaN);
                                      if (Number.isFinite(gross)) values['Gross Loan'][colKey] = formatCurrency(gross);

                                      // Product Fee £ and Net Loan
                                      if (Number.isFinite(gross) && !Number.isNaN(pfPercent)) {
                                        const pfAmount = gross * (pfPercent / 100);
                                        values['Product Fee £'][colKey] = formatCurrency(pfAmount);
                                        const net = gross - pfAmount;
                                        values['Net Loan'][colKey] = formatCurrency(net);
                                        if (Number.isFinite(pv)) values['LTV'][colKey] = `${(net / pv * 100).toFixed(2)}%`;
                                      }

                                      // Monthly Interest Cost (approximation)
                                      if (best && best.rate != null && Number.isFinite(gross)) {
                                        const monthly = gross * (Number(best.rate) / 100) / 12;
                                        values['Monthly Interest Cost'][colKey] = formatCurrency(monthly);
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
                              </tbody>
                            </table>
                            {/* Note shown below the table */}
                            <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>Placeholders: ERC (Fusion only) and Exit Fee are not shown in the BTL calculator.</div>
                          </div>
                        )}
                      </>
                    );
          })()}
        </div>
      </div>

      {/* Issue DIP Modal */}
      <IssueDIPModal
        isOpen={dipModalOpen}
        onClose={() => {
          setDipModalOpen(false);
          setSelectedFeeTypeForDip('');
          setFilteredRatesForDip([]);
        }}
        quoteId={currentQuoteId}
        calculatorType="BTL"
        existingDipData={dipData}
        availableFeeTypes={getAvailableFeeTypes()}
        allRates={relevantRates}
        showProductRangeSelection={hasBothRanges()}
        onSave={handleSaveDipData}
        onCreatePDF={handleCreatePDF}
        onFeeTypeSelected={handleFeeTypeSelection}
      />

      {/* Issue Quote Modal */}
      <IssueQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        quoteId={currentQuoteId}
        calculatorType="BTL"
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
