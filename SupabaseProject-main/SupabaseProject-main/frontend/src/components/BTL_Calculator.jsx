import React, { useEffect, useState, useRef } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import '../styles/slds.css';
import '../styles/Calculator.scss';
import { PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST, FEE_COLUMNS as DEFAULT_FEE_COLUMNS, LOCALSTORAGE_CONSTANTS_KEY, FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE } from '../config/constants';

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

export default function BTLcalculator() {
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
  
  // Range toggle state (Core or Specialist)
  const [selectedRange, setSelectedRange] = useState('specialist');

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
        console.log('Calculator: fetched criteria rows', (data || []).length);
        setAllCriteria(data || []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [supabase]);

  useEffect(() => {
    // build question map based on BTL criteriaSet and selected productScope
    const filtered = allCriteria.filter((r) => {
      if (!r) return false;
      // Only include rows belonging to the BTL criteria set and matching the product_scope
      const csMatch = (r.criteria_set || '').toString() === 'BTL';
      const psMatch = (productScope ? (r.product_scope || '').toString() === productScope.toString() : true);
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
    // reset answers
    const starting = {};
    Object.keys(map).forEach((k) => {
      // default to first option
      starting[k] = map[k].options[0] || null;
    });
    setAnswers(starting);
  }, [allCriteria, productScope]);

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
        // eslint-disable-next-line no-console
        console.log('Rates fetch skipped: productType not set yet');
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
    const scopeMatch = productScope ? (scopeVal === productScope.toString().toLowerCase() || scopeVal.includes(productScope.toString().toLowerCase())) : true;

    // retention matching — use explicit `is_retention` column when available
    const detectRetention = (row) => {
      const v = row.is_retention;
      if (v !== undefined && v !== null && v !== '') {
        const s = String(v).toLowerCase().trim();
        return v === true || ['true', 'yes', '1', 'y', 't'].includes(s);
      }
      // If explicit column not present or empty, treat as non-retention by default
      return false;
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
        // require the row to be a retention product
        if (!isRetentionRow) passesRetentionAndLtv = false;
        else {
          if (!Number.isFinite(rowMaxLtv) || rowMaxLtv <= 0) {
            passesRetentionAndLtv = false;
          } else {
            const selectedLtv = Number(retentionLtv);
            if (selectedLtv === 65) passesRetentionAndLtv = rowMaxLtv <= 65;
            else if (selectedLtv === 75) passesRetentionAndLtv = rowMaxLtv > 65 && rowMaxLtv <= 75;
            else passesRetentionAndLtv = rowMaxLtv <= selectedLtv;
          }
        }
      } else if (retentionChoice === 'No') {
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
        let activeFeeCols = [];
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.feeColumns && parsed.feeColumns[productScope]) {
              activeFeeCols = parsed.feeColumns[productScope].map((n) => Number(n));
            }
          }
        } catch (e) {
          // ignore
        }
        if (!activeFeeCols || activeFeeCols.length === 0) {
          activeFeeCols = (DEFAULT_FEE_COLUMNS[productScope] || DEFAULT_FEE_COLUMNS['Residential'] || []).map((n) => Number(n));
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
        // eslint-disable-next-line no-console
        console.log('Relevant rates matched (after dedupe & feeFilter):', feeFiltered.length);
        if (feeFiltered.length === 0) {
          // Helpful debug output when no rates matched
          // eslint-disable-next-line no-console
          console.groupCollapsed('Rates filter debug: no matches');
          console.log('Filters -> productType:', productType, 'currentTier:', currentTier, 'productScope:', productScope, 'retentionChoice:', retentionChoice, 'retentionLtv:', retentionLtv, 'activeFeeCols:', activeFeeCols);
          // eslint-disable-next-line no-console
          console.table(debugSamples);
          // eslint-disable-next-line no-console
          console.groupEnd();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch relevant rates', err);
      }
    }
    fetchRelevant();
  }, [supabase, productScope, currentTier, productType, retentionChoice, retentionLtv]);

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

  // LTV slider range bounds (used for percentage calculation and to keep UI consistent)
  const ltvMin = 20;
  const ltvMax = 100;
  const ltvPercent = Math.round(((maxLtvInput - ltvMin) / (ltvMax - ltvMin)) * 100);

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
      </div>

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
                      value={answers[qk] ? q.options.indexOf(answers[qk]) : 0}
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
                  onChange={(e) => setPropertyValue(e.target.value)} 
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
                  onChange={(e) => setMonthlyRent(e.target.value)} 
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
                    onChange={(e) => setSpecificNetLoan(e.target.value)} 
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
                    style={{ background: `linear-gradient(90deg, #0176d3 ${ltvPercent}%, #e9eef5 ${ltvPercent}%)` }}
                  />
                  <div className="helper-text">Selected LTV: <strong>{maxLtvInput}%</strong></div>
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
                    onChange={(e) => setSpecificGrossLoan(e.target.value)} 
                    placeholder="£550,000" 
                  />
                  <div className="helper-text">Enter desired gross loan amount</div>
                </div>
              </div>
            )}
          </div>

          {/* Additional fees toggle and fields - full width row */}
          <div className="fees-section">
            <div className="fees-row">
              <div className="modern-switch">
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

              {/* Always render fields to keep alignment; visually hide/disable when toggle is off */}
              <div className={`slds-form-element ${addFeesToggle ? '' : 'fees-collapsed'}`}>
                <label className="slds-form-element__label">Fee calculated as</label>
                <div className="slds-form-element__control">
                  <select 
                    className="slds-select" 
                    value={feeCalculationType} 
                    onChange={(e) => setFeeCalculationType(e.target.value)}
                    disabled={!addFeesToggle}
                  >
                    <option value="pound">Pound value</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>

              <div className={`slds-form-element ${addFeesToggle ? '' : 'fees-collapsed'}`}>
                <label className="slds-form-element__label">Additional fee amount</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    value={additionalFeeAmount}
                    onChange={(e) => setAdditionalFeeAmount(e.target.value)}
                    placeholder={feeCalculationType === 'pound' ? '£' : 'e.g. 1.5'}
                    aria-label="Additional fee amount"
                    disabled={!addFeesToggle}
                  />
                  <div className="helper-text">This will be subtracted from the net loan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Range toggle buttons - Core / Specialist */}
      <div className="range-toggle-container">
        <div className="range-toggle-buttons">
          <button
            className={`range-button ${selectedRange === 'core' ? 'active' : ''}`}
            onClick={() => setSelectedRange('core')}
            type="button"
          >
            Core range
          </button>
          <button
            className={`range-button ${selectedRange === 'specialist' ? 'active' : ''}`}
            onClick={() => setSelectedRange('specialist')}
            type="button"
          >
            Specialist range
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

            return (
              <>
                <div className="rates-count">
                  Found {filteredRates.length} matching {selectedRange} rates for {productType}, Tier {currentTier}
                </div>
                {filteredRates.slice(0, 8).map(r => (
                  <div key={(r.id || r.product) + '::' + (r.rate || '')} className="rate-item">
                    <strong>{r.product}</strong> — {r.rate}% (Tier {r.tier}) — {r.property}
                    {(r.product_fee !== undefined && r.product_fee !== null && r.product_fee !== '') && (
                      <span className="rate-fee"> — Fee: {Number(r.product_fee).toFixed(2)}%</span>
                    )}
                  </div>
                ))}
                {filteredRates.length === 0 && (
                  <div className="no-rates">No {selectedRange} range rates available for the selected criteria.</div>
                )}
              </>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
