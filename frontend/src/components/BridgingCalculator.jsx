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

  // Loan details
  const [propertyValue, setPropertyValue] = useState('');
  const [grossLoan, setGrossLoan] = useState('');
  const [useSpecificNet, setUseSpecificNet] = useState('No');
  const [specificNetLoan, setSpecificNetLoan] = useState('');
  const [bridgingTerm, setBridgingTerm] = useState('');
  // rates
  const [rates, setRates] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [subProduct, setSubProduct] = useState('');
  const [subProductOptions, setSubProductOptions] = useState([]);

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
        const { data, error } = await supabase.from('rates_flat').select('*');
        if (error) throw error;
        if (!mounted) return;
        setRates(data || []);
        // derive sub-product options
        const discovered = new Set();
        (data || []).forEach(r => {
          const s = r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.property || r.product;
          if (s) discovered.add(String(s));
        });
        setSubProductOptions(Array.from(discovered));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Bridging: failed to load rates', err);
      }
    }
    loadRates();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    // filter rates whenever inputs or answers change
    const raw = rates || [];
    const mode = computeModeFromAnswers();
    const loanLtv = computeLoanLtv();
    const loanSize = computeLoanSize();
    const parsedSub = (subProduct || '').toString().toLowerCase();

    const filtered = raw.filter((r) => {
      // product_scope matching: restrict to selected productScope when present
      if (productScope) {
        const ps = (r.product_scope || r.property || r.set_key || '').toString().toLowerCase();
        if (!ps.includes(productScope.toString().toLowerCase())) return false;
      }

      if (mode === 'Bridge') {
        // Bridge filtering: sub-product + LTV
        // check sub-product
        if (parsedSub) {
          const s = (r.subproduct || r.sub_product || r.sub_product_type || r.property_type || r.product || '').toString().toLowerCase();
          if (!s.includes(parsedSub)) return false;
        }
        // LTV filtering using min/max LTV fields
        const rowMin = parseNumber(r.min_ltv ?? r.minltv ?? r.min_LTV ?? r.minLTV ?? r.min_loan_ltv);
        const rowMax = parseNumber(r.max_ltv ?? r.maxltv ?? r.max_LTV ?? r.maxLTV ?? r.max_loan_ltv);
        if (Number.isFinite(loanLtv)) {
          if (Number.isFinite(rowMin) && loanLtv < rowMin) return false;
          if (Number.isFinite(rowMax) && loanLtv > rowMax) return false;
        }
        return true;
      }

      // Fusion: based on loan size ranges in rates (min_loan / max_loan)
      if (mode === 'Fusion') {
        const rowMinLoan = parseNumber(r.min_loan ?? r.minloan ?? r.min_loan_amt ?? r.min_loan_amount);
        const rowMaxLoan = parseNumber(r.max_loan ?? r.maxloan ?? r.max_loan_amt ?? r.max_loan_amount);
        if (Number.isFinite(loanSize)) {
          if (Number.isFinite(rowMinLoan) && loanSize < rowMinLoan) return false;
          if (Number.isFinite(rowMaxLoan) && loanSize > rowMaxLoan) return false;
        }
        return true;
      }

      return true;
    });

    setRelevantRates(filtered);
    // eslint-disable-next-line no-console
    console.log('Bridging: matched rates', filtered.length, 'mode', computeModeFromAnswers());
  }, [rates, productScope, subProduct, propertyValue, grossLoan, specificNetLoan, answers]);

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
        <header className="collapsible-header">
          <h2 className="header-title">Criteria</h2>
        </header>
        <div className="collapsible-body">
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
              return (
                <div key={qk} className="slds-form-element">
                  <label className="slds-form-element__label">{q.label}</label>
                  <div className="slds-form-element__control">
                    <select className="slds-select" value={safeIndex} onChange={(e) => handleAnswerChange(qk, Number(e.target.value))}>
                      {q.options.map((opt, idx) => (
                        <option key={opt.id ?? `${qk}-${idx}`} value={idx}>{opt.option_label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="collapsible-section">
        <header className="collapsible-header">
          <h2 className="header-title">Loan details</h2>
        </header>
        <div className="collapsible-body">
          <div className="loan-details-grid">
            <div className="slds-form-element">
              <label className="slds-form-element__label">Property Value</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} placeholder="£" />
              </div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Gross loan</label>
              <div className="slds-form-element__control">
                <input className="slds-input" value={grossLoan} onChange={(e) => setGrossLoan(e.target.value)} placeholder="£" />
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
                <input className="slds-input" value={bridgingTerm} onChange={(e) => setBridgingTerm(e.target.value)} placeholder="e.g. 6" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
