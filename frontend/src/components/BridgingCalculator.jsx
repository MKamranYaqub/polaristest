import React, { useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import '../styles/Calculator.scss';

export default function BridgingCalculator() {
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

  // Loan details
  const [propertyValue, setPropertyValue] = useState('');
  const [grossLoan, setGrossLoan] = useState('');
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

    Object.keys(map).forEach(k => {
      map[k].options.sort((a, b) => (a.option_label || '').localeCompare(b.option_label || ''));
    });

    setQuestions(map);
    const starting = {};
    Object.keys(map).forEach(k => { starting[k] = map[k].options[0] || null; });
    setAnswers(starting);

    // Debugging help: log counts so we can inspect why bridging criteria might be empty
    // eslint-disable-next-line no-console
    console.log('BridgingCalculator: filtered criteria rows:', Object.keys(map).length, 'rawMatches:', filtered.length);
    // also log available product_scope values for troubleshooting
    // eslint-disable-next-line no-console
    console.log('BridgingCalculator: available product_scopes ->', Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean))).slice(0,50));
  }, [allCriteria, productScope]);

  // Auto-select productScope intelligently after criteria load: prefer an explicit scope that mentions bridge/fusion
  useEffect(() => {
    if (!allCriteria || allCriteria.length === 0) return;
    const needle = /bridge|fusion/i;
    const scopes = Array.from(new Set(allCriteria.map(r => r.product_scope).filter(Boolean)));
    const explicit = scopes.find(s => needle.test(s));
    if (explicit) {
      setProductScope(explicit);
      // eslint-disable-next-line no-console
      console.log('BridgingCalculator: auto-selected productScope ->', explicit);
      return;
    }
    // fallback: choose first available scope if none explicitly references bridge/fusion
    if (!productScope && scopes.length > 0) setProductScope(scopes[0]);
  }, [allCriteria]);

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
    if (!Number.isFinite(loanAmount) || loanAmount <= 0) return NaN;
    return (loanAmount / pv) * 100;
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
      // Exclude explicit Fusion sets from Bridge. In our CSV the Fusion rows have set_key === 'Fusion'.
      const setKeyStr = (r.set_key || '').toString().toLowerCase();
      if (setKeyStr === 'fusion') return false;
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
    // eslint-disable-next-line no-console
    console.log('Bridging: matched bridge=', bridgeOut.length, 'fusion=', fusionOut.length, 'mode', mode);
  }, [rates, productScope, subProduct, propertyValue, grossLoan, specificNetLoan, answers, chargeType]);

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
      </div>

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
              // detect if this question is a Sub-product selector so we can disable it for Second charge
              const isSubQuestion = /sub[-_ ]?product|subproduct|property type|property_type|product type/i.test(q.label || qk || '');
              const disableForSecond = isSubQuestion && ((chargeType || '').toString().toLowerCase() === 'second');
              return (
                <div key={qk} className="slds-form-element">
                  <label className="slds-form-element__label">{q.label}</label>
                  <div className="slds-form-element__control">
                    <select
                      className="slds-select"
                      value={safeIndex}
                      onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}
                      disabled={disableForSecond}
                    >
                      {q.options.map((opt, idx) => (
                        <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                      ))}
                    </select>
                    {disableForSecond && (
                      <div className="helper-text" style={{ color: '#666' }}>Selection disabled for Second charge — only Second charge products will be shown.</div>
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
                  {Array.from({ length: 16 }, (_, i) => i + 3).map((m) => (
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
                  <th style={{ width: '20%' }}>Label</th>
                  <th style={{ width: '26%' }}>Fusion</th>
                  <th style={{ width: '26%' }}>Variable Bridge</th>
                  <th style={{ width: '28%' }}>Fixed Bridge</th>
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
                      <tr>
                        <td>
                          {/* Label column: show explicit label if available, otherwise show a simple 'Rates' marker for the first/results row */}
                          <div style={{ fontWeight: 600 }}>{(bestFusion && bestFusion.label) || (bestVariable && bestVariable.label) || (bestFixed && bestFixed.label) || 'Rates'}</div>
                        </td>
                        <td>
                          {bestFusion ? (
                            <div className="slds-box slds-m-vertical_x-small">
                              <div>{bestFusion.rate != null ? `${bestFusion.rate}%` : '—'}</div>
                              <div style={{ color: '#666', fontSize: '0.85rem' }}>Loan: {bestFusion.min_loan ? `£${Number(bestFusion.min_loan).toLocaleString()}` : '—'} – {bestFusion.max_loan ? `£${Number(bestFusion.max_loan).toLocaleString()}` : '—'}</div>
                            </div>
                          ) : <div className="slds-text-body_small">—</div>}
                        </td>
                        <td>
                          {bestVariable ? (
                            <div className="slds-box slds-m-vertical_x-small">
                              <div>{bestVariable.rate != null ? `${bestVariable.rate}%` : '—'}</div>
                              <div style={{ color: '#666', fontSize: '0.85rem' }}>LTV: {bestVariable.min_ltv ?? '—'}% – {bestVariable.max_ltv ?? '—'}%</div>
                            </div>
                          ) : <div className="slds-text-body_small">—</div>}
                        </td>
                        <td>
                          {bestFixed ? (
                            <div className="slds-box slds-m-vertical_x-small">
                              <div>{bestFixed.rate != null ? `${bestFixed.rate}%` : '—'}</div>
                              <div style={{ color: '#666', fontSize: '0.85rem' }}>LTV: {bestFixed.min_ltv ?? '—'}% – {bestFixed.max_ltv ?? '—'}%</div>
                            </div>
                          ) : <div className="slds-text-body_small">—</div>}
                        </td>
                      </tr>
                    );
                  })()
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
