import React, { useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import {
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST,
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS,
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  MARKET_RATES as DEFAULT_MARKET_RATES,
  LOCALSTORAGE_CONSTANTS_KEY,
} from '../config/constants';
import '../styles/slds.css';

function readOverrides() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse constants overrides', e);
    return null;
  }
}

function writeOverrides(obj) {
  localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify(obj));
}

export default function Constants() {
  const [productLists, setProductLists] = useState(DEFAULT_PRODUCT_TYPES_LIST);
  const [feeColumns, setFeeColumns] = useState(DEFAULT_FEE_COLUMNS);
  const [flatAboveCommercialRule, setFlatAboveCommercialRule] = useState(DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
  const [marketRates, setMarketRates] = useState(DEFAULT_MARKET_RATES);
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState('');
  const { supabase } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [structuredSupported, setStructuredSupported] = useState(null);
  const [hasValueColumn, setHasValueColumn] = useState(null);
  // per-field editing state and temporary values
  const [editingFields, setEditingFields] = useState({});
  const [tempValues, setTempValues] = useState({});
  const disabledInputStyle = { backgroundColor: '#f4f6f8', opacity: 0.8, cursor: 'not-allowed' };

  useEffect(() => {
    const overrides = readOverrides();
    if (overrides) {
      setProductLists(overrides.productLists || DEFAULT_PRODUCT_TYPES_LIST);
      setFeeColumns(overrides.feeColumns || DEFAULT_FEE_COLUMNS);
      setFlatAboveCommercialRule(overrides.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
      setMarketRates(overrides.marketRates || DEFAULT_MARKET_RATES);
      // initialize temp values
      const tv = {};
      Object.keys(overrides.productLists || DEFAULT_PRODUCT_TYPES_LIST).forEach(pt => { tv[`productLists:${pt}`] = (overrides.productLists[pt] || []).join(', '); });
      Object.keys(overrides.feeColumns || DEFAULT_FEE_COLUMNS).forEach(k => { tv[`feeColumns:${k}`] = (overrides.feeColumns[k] || []).join(', '); });
      Object.keys(overrides.marketRates || DEFAULT_MARKET_RATES).forEach(k => { const v = ((overrides.marketRates[k] ?? 0) * 100).toFixed(2); tv[`marketRates:${k}`] = v; });
      tv['flatAbove:scopeMatcher'] = overrides.flatAboveCommercialRule?.scopeMatcher || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.scopeMatcher || '';
      tv['flatAbove:tier2'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['2'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] ?? '');
      tv['flatAbove:tier3'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['3'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] ?? '');
      setTempValues(tv);
    }
  }, []);

  // helpers to start/save/cancel per-field edits
  const startEdit = (key, initial) => {
    setEditingFields(prev => ({ ...prev, [key]: true }));
    setTempValues(prev => ({ ...prev, [key]: initial }));
  };

  const cancelEdit = (key, refreshFromState) => {
    setEditingFields(prev => ({ ...prev, [key]: false }));
    // reset temp to current state values if requested
    if (refreshFromState) {
      setTempValues(prev => ({ ...prev, [key]: prev[key] }));
    }
  };

  const saveEdit = async (key) => {
    // dispatch based on key prefix
    try {
      if (key.startsWith('productLists:')) {
        const pt = key.split(':')[1];
        updateProductList(pt, tempValues[key] || '');
      } else if (key.startsWith('feeColumns:')) {
        const k = key.split(':')[1];
        updateFeeColumns(k, tempValues[key] || '');
      } else if (key.startsWith('marketRates:')) {
        const field = key.split(':')[1];
        const n = Number(tempValues[key]);
        updateMarketRates({ [field]: Number.isFinite(n) ? n / 100 : 0 });
      } else if (key === 'flatAbove:scopeMatcher') {
        updateFlatAboveCommercial({ scopeMatcher: tempValues[key] || '' });
      } else if (key === 'flatAbove:tier2') {
        updateFlatAboveCommercial({ tierLtv: { ...(flatAboveCommercialRule.tierLtv || {}), '2': Number(tempValues[key] || '') } });
      } else if (key === 'flatAbove:tier3') {
        updateFlatAboveCommercial({ tierLtv: { ...(flatAboveCommercialRule.tierLtv || {}), '3': Number(tempValues[key] || '') } });
      }
    } catch (e) {
      console.error('Failed to save field', key, e);
    } finally {
      setEditingFields(prev => ({ ...prev, [key]: false }));
    }
  };

  const exportJson = () => {
  const payload = { productLists, feeColumns, flatAboveCommercialRule, marketRates };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'constants-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Persist to Supabase (best-effort). Expects a table `app_constants` with columns `key` (text PK) and `value` (jsonb).
  const saveToSupabase = async (payload) => {
    if (!supabase) return { error: 'Supabase client unavailable' };
    try {
      const row = { key: 'app.constants', value: payload };
      const { error } = await supabase.from('app_constants').upsert([row], { returning: 'minimal' });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  // Detect whether the app_constants table exposes structured columns (product_lists, fee_columns, ...)
  const detectStructuredSupport = async () => {
    if (!supabase) return false;
    try {
      // Select any row and inspect whether structured keys are present (safer than selecting a missing column)
      const { data, error } = await supabase.from('app_constants').select('*').limit(1);
      if (error) {
        console.debug('Schema detection: could not read app_constants', error.message || error);
        return false;
      }
      if (!data || data.length === 0) return false;
      const sample = data[0];
      return Object.prototype.hasOwnProperty.call(sample, 'product_lists');
    } catch (e) {
      console.debug('Schema detection error', e);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) return;
      const supported = await detectStructuredSupport();
      if (mounted) setStructuredSupported(supported);
      // detect whether `value` jsonb column exists
      try {
        const { data, error } = await supabase.from('app_constants').select('*').limit(1);
        if (error) {
          console.debug('Schema detection: could not read app_constants for value column check', error.message || error);
          if (mounted) setHasValueColumn(false);
        } else {
          const sample = (data && data.length) ? data[0] : null;
          if (mounted) setHasValueColumn(!!(sample && Object.prototype.hasOwnProperty.call(sample, 'value')));
        }
      } catch (e) {
        console.debug('Schema detection error checking value column', e);
        if (mounted) setHasValueColumn(false);
      }
    })();
    // load latest constants into UI
    (async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('app_constants').select('*').order('updated_at', { ascending: false }).limit(1);
        if (!error && data && data.length) {
          const row = data[0];
          // prefer structured columns when present
          if (row.product_lists || row.fee_columns || row.flat_above_commercial_rule || row.market_rates) {
            if (mounted) {
              setProductLists(row.product_lists || DEFAULT_PRODUCT_TYPES_LIST);
              setFeeColumns(row.fee_columns || DEFAULT_FEE_COLUMNS);
              setFlatAboveCommercialRule(row.flat_above_commercial_rule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
              setMarketRates(row.market_rates || DEFAULT_MARKET_RATES);
            }
          } else if (row.value) {
            const v = row.value;
            if (mounted) {
              setProductLists(v.productLists || DEFAULT_PRODUCT_TYPES_LIST);
              setFeeColumns(v.feeColumns || DEFAULT_FEE_COLUMNS);
              setFlatAboveCommercialRule(v.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
              setMarketRates(v.marketRates || DEFAULT_MARKET_RATES);
            }
          }
        }
      } catch (e) {
        console.debug('Could not load latest constants', e);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
    setProductLists(parsed.productLists || DEFAULT_PRODUCT_TYPES_LIST);
    setFeeColumns(parsed.feeColumns || DEFAULT_FEE_COLUMNS);
    setFlatAboveCommercialRule(parsed.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
    setMarketRates(parsed.marketRates || DEFAULT_MARKET_RATES);
  writeOverrides({ productLists: parsed.productLists, feeColumns: parsed.feeColumns, flatAboveCommercialRule: parsed.flatAboveCommercialRule, marketRates: parsed.marketRates });
      setMessage('Imported and saved to localStorage.');
    } catch (e) {
      setMessage('Invalid JSON: ' + (e.message || e));
    }
  };

  const saveToStorage = async () => {
    const payload = { productLists, feeColumns, flatAboveCommercialRule, marketRates };
    writeOverrides(payload);
    setMessage('Saved to localStorage. This will take effect for open calculator tabs.');
    setSaving(true);

    try {
      // Ensure we know whether structured columns are supported
      let tryStructured = structuredSupported;
      if (tryStructured === null) {
        tryStructured = await detectStructuredSupport();
        setStructuredSupported(tryStructured);
      }

      if (tryStructured && supabase) {
        // Create a new row on each save (unique key) so history is preserved and
        // the UI can pull the latest row and display it. Use ISO timestamp suffix
        // for the key to ensure uniqueness.
        const key = `app.constants:${new Date().toISOString()}`;
        const insertRow = {
          key,
          product_lists: payload.productLists || null,
          fee_columns: payload.feeColumns || null,
          flat_above_commercial_rule: payload.flatAboveCommercialRule || null,
          market_rates: payload.marketRates || null,
        };
        try {
          const { data: inserted, error: insertErr } = await supabase.from('app_constants').insert([insertRow]).select('*');
          setSaving(false);
          if (insertErr) {
            console.warn('Failed to insert structured constants to Supabase', insertErr);
            setMessage('Saved locally, but failed to persist structured constants to Supabase. See console.');
            // fallback to storing as `value`
            const { error: fallbackErr } = await saveToSupabase(payload);
            window.alert('Save failed: could not persist structured constants to Supabase. Falling back to legacy storage.');
            if (fallbackErr) console.warn('Fallback saveToSupabase also failed', fallbackErr);
          } else {
            setMessage('Saved to localStorage and persisted structured constants to Supabase.');
            window.alert('Save successful — structured constants persisted.');
            // refresh latest row into UI
            try {
              const { data: latest, error: latestErr } = await supabase.from('app_constants').select('*').order('updated_at', { ascending: false }).limit(1);
              if (!latestErr && latest && latest.length) {
                const row = latest[0];
                if (row.product_lists || row.fee_columns || row.flat_above_commercial_rule || row.market_rates) {
                  setProductLists(row.product_lists || DEFAULT_PRODUCT_TYPES_LIST);
                  setFeeColumns(row.fee_columns || DEFAULT_FEE_COLUMNS);
                  setFlatAboveCommercialRule(row.flat_above_commercial_rule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
                  setMarketRates(row.market_rates || DEFAULT_MARKET_RATES);
                } else if (row.value) {
                  const v = row.value;
                  setProductLists(v.productLists || DEFAULT_PRODUCT_TYPES_LIST);
                  setFeeColumns(v.feeColumns || DEFAULT_FEE_COLUMNS);
                  setFlatAboveCommercialRule(v.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
                  setMarketRates(v.marketRates || DEFAULT_MARKET_RATES);
                }
              }
            } catch (e) {
              /* ignore refresh errors */
            }
          }
        } catch (e) {
          setSaving(false);
          console.error('Exception inserting structured constants', e);
          const { error: fallbackErr } = await saveToSupabase(payload);
          window.alert('Save failed with exception — falling back to legacy save.');
          if (fallbackErr) console.warn('Fallback saveToSupabase also failed', fallbackErr);
        }
        return;
      }

      // Generic fallback: persist into `value` JSON column
      const { error } = await saveToSupabase(payload);
      setSaving(false);
      if (error) {
        console.warn('Failed to save constants to Supabase', error);
        setMessage('Saved locally, but failed to persist to Supabase. See console for details.');
      } else {
        setMessage('Saved to localStorage and persisted to Supabase.');
      }
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving constants', e);
      setMessage('Saved locally, but an unexpected error occurred while persisting to Supabase. See console.');
    }
  };

  const resetToDefaults = async () => {
    setProductLists(DEFAULT_PRODUCT_TYPES_LIST);
    setFeeColumns(DEFAULT_FEE_COLUMNS);
    setFlatAboveCommercialRule(DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
    setMarketRates(DEFAULT_MARKET_RATES);
    const payload = { productLists: DEFAULT_PRODUCT_TYPES_LIST, feeColumns: DEFAULT_FEE_COLUMNS, flatAboveCommercialRule: DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE, marketRates: DEFAULT_MARKET_RATES };
    setMessage('Reset to defaults and removed overrides from localStorage.');
    localStorage.removeItem(LOCALSTORAGE_CONSTANTS_KEY);
    setSaving(true);

    try {
      let tryStructured = structuredSupported;
      if (tryStructured === null) {
        tryStructured = await detectStructuredSupport();
        setStructuredSupported(tryStructured);
      }

      if (tryStructured && supabase) {
        const upsertRow = {
          key: 'app.constants',
          product_lists: payload.productLists,
          fee_columns: payload.feeColumns,
          flat_above_commercial_rule: payload.flatAboveCommercialRule,
          market_rates: payload.marketRates,
        };
        const { error: upsertErr } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        if (upsertErr) {
          console.warn('Failed to reset structured constants in Supabase', upsertErr);
          // fallback to value column
          await saveToSupabase(payload);
        }
        return;
      }

      // fallback
      const { error } = await saveToSupabase(payload);
      setSaving(false);
      if (error) console.warn('Failed to reset constants in Supabase', error);
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error during resetToDefaults', e);
    }
  };

  // helpers for editing product lists and fee columns roughly (simple UI)
  const updateProductList = (propType, csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const newProductLists = { ...(productLists || {}), [propType]: arr };
    setProductLists(newProductLists);
    // persist this section separately
    const payload = { productLists: newProductLists };
    writeOverrides(Object.assign({}, readOverrides() || {}, payload));
    saveFieldToSupabase('product_lists', newProductLists).then(({ error }) => {
      if (error) console.warn('Failed to save product_lists to Supabase', error);
    });
  };

  const updateFeeColumns = (key, csv) => {
    const arr = csv.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    const newFeeColumns = { ...(feeColumns || {}), [key]: arr };
    setFeeColumns(newFeeColumns);
    writeOverrides(Object.assign({}, readOverrides() || {}, { feeColumns: newFeeColumns }));
    saveFieldToSupabase('fee_columns', newFeeColumns).then(({ error }) => {
      if (error) console.warn('Failed to save fee_columns to Supabase', error);
    });
  };

  const updateFlatAboveCommercial = (changes) => {
    const newRule = { ...(flatAboveCommercialRule || {}), ...changes };
    setFlatAboveCommercialRule(newRule);
    writeOverrides(Object.assign({}, readOverrides() || {}, { flatAboveCommercialRule: newRule }));
    saveFieldToSupabase('flat_above_commercial_rule', newRule).then(({ error }) => {
      if (error) console.warn('Failed to save flat_above_commercial_rule to Supabase', error);
    });
  };

  const updateMarketRates = (changes) => {
    const newRates = { ...(marketRates || {}), ...changes };
    setMarketRates(newRates);
    writeOverrides(Object.assign({}, readOverrides() || {}, { marketRates: newRates }));
    saveFieldToSupabase('market_rates', newRates).then(({ error }) => {
      if (error) console.warn('Failed to save market_rates to Supabase', error);
    });
  };

  // Save a single named column to Supabase table `app_constants`.
  // Column names used: product_lists, fee_columns, flat_above_commercial_rule, market_rates
  const saveFieldToSupabase = async (column, value) => {
    if (!supabase) return { error: 'Supabase client unavailable' };
    try {
      // If structured columns supported, try a structured-column upsert first
      let tryStructured = structuredSupported;
      if (tryStructured === null) {
        tryStructured = await detectStructuredSupport();
        setStructuredSupported(tryStructured);
      }
      if (tryStructured) {
        try {
          // Fetch existing structured row and merge to avoid overwriting other structured columns with NULL
          const { data: existingStruct, error: fetchErr } = await supabase.from('app_constants').select('*').eq('key', 'app.constants').single();
          const currentStruct = existingStruct || {};
          const mapStruct = {
            product_lists: 'product_lists',
            fee_columns: 'fee_columns',
            flat_above_commercial_rule: 'flat_above_commercial_rule',
            market_rates: 'market_rates',
          };
          const targetCol = mapStruct[column] || column;
          const newRow = {
            key: 'app.constants',
            product_lists: currentStruct.product_lists || null,
            fee_columns: currentStruct.fee_columns || null,
            flat_above_commercial_rule: currentStruct.flat_above_commercial_rule || null,
            market_rates: currentStruct.market_rates || null,
          };
          // set the changed column
          newRow[targetCol] = value;
          const { error } = await supabase.from('app_constants').upsert([newRow], { returning: 'minimal' });
          if (!error) return { error: null };
          // if structured upsert failed, we'll attempt alternatives below
          console.debug('Structured upsert returned error, will try fallbacks', error);
        } catch (e) {
          console.debug('Structured upsert exception, will try fallbacks', e);
        }

        // If structured columns exist but `value` column does not, try merging/upserting structured columns instead of value
        if (hasValueColumn === false) {
          try {
            // Fetch existing structured columns (if any)
            const { data: existingStruct, error: fetchStructErr } = await supabase.from('app_constants').select('*').eq('key', 'app.constants').single();
            const currentStruct = existingStruct || {};
            const mapStruct = {
              product_lists: 'product_lists',
              fee_columns: 'fee_columns',
              flat_above_commercial_rule: 'flat_above_commercial_rule',
              market_rates: 'market_rates',
            };
            const targetCol = mapStruct[column] || column;
            const newRow = {
              key: 'app.constants',
              product_lists: currentStruct.product_lists || null,
              fee_columns: currentStruct.fee_columns || null,
              flat_above_commercial_rule: currentStruct.flat_above_commercial_rule || null,
              market_rates: currentStruct.market_rates || null,
            };
            // set the changed column
            newRow[targetCol] = value;
            const { error: upsertStructErr } = await supabase.from('app_constants').upsert([newRow], { returning: 'minimal' });
            if (!upsertStructErr) return { error: null };
            console.warn('Structured-column upsert fallback failed', upsertStructErr);
          } catch (e) {
            console.warn('Structured-column merge/upsert fallback exception', e);
          }
        }
      }

      // Generic fallback: if `value` column exists (or we couldn't determine structured support), use JSON merge upsert
        if (hasValueColumn !== false) {
        const { data: existing, error: fetchErr } = await supabase.from('app_constants').select('*').eq('key', 'app.constants').single();
        if (fetchErr && fetchErr.code !== 'PGRST116') {
          console.debug('Fetch existing app_constants row warning', fetchErr);
        }
        const current = (existing && existing.value) ? existing.value : (readOverrides() || { productLists, feeColumns, flatAboveCommercialRule, marketRates });
        // map incoming column names to JSON keys used in localStorage
        const map = {
          product_lists: 'productLists',
          fee_columns: 'feeColumns',
          flat_above_commercial_rule: 'flatAboveCommercialRule',
          market_rates: 'marketRates',
        };
        const jsonKey = map[column] || column;
        const newValue = { ...current, [jsonKey]: value };
        const row = { key: 'app.constants', value: newValue };
        const { error: upsertErr } = await supabase.from('app_constants').upsert([row], { returning: 'minimal' });
        if (upsertErr) {
          console.warn('Upsert to app_constants failed', upsertErr);
          return { error: upsertErr };
        }
        return { error: null };
      }

      return { error: 'No available upsert strategy (structured-only table without value column failed)' };
    } catch (e) {
      console.error('Unexpected error saving field to Supabase', e);
      return { error: e };
    }
  };

  

  

  return (
    <div className="slds-p-around_medium">
      <h2>Constants (editable)</h2>
      <p className="helper-text">Edit product lists, fee columns and LTV thresholds. Changes persist to localStorage and affect the calculator.</p>
      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button className="slds-button slds-button_outline-brand" onClick={exportJson}>Export JSON</button>
        <button className="slds-button slds-button_destructive" onClick={resetToDefaults}>Reset defaults</button>
      </div>

      <section className="slds-box slds-m-bottom_medium">
        <h3>Product lists per property type</h3>
        {Object.keys(productLists).map((pt) => {
          const key = `productLists:${pt}`;
          return (
            <div key={pt} className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label">{pt}</label>
              <div className="slds-form-element__control" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="slds-input"
                  value={editingFields[key] ? (tempValues[key] ?? '') : (productLists[pt] || []).join(', ')}
                  onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={!editingFields[key]}
                  style={!editingFields[key] ? disabledInputStyle : undefined}
                />
                {!editingFields[key] ? (
                  <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (productLists[pt] || []).join(', '))}>Edit</button>
                ) : (
                  <>
                    <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                    <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                  </>
                )}
              </div>
              <div className="helper-text">Comma-separated list of product names shown in the calculator product select.</div>
            </div>
          );
        })}
      </section>

      <section className="slds-box slds-m-bottom_medium">
        <h3>Fee columns</h3>
        {Object.keys(feeColumns).map((k) => {
          const key = `feeColumns:${k}`;
          return (
            <div key={k} className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label">{k}</label>
              <div className="slds-form-element__control" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="slds-input"
                  value={editingFields[key] ? (tempValues[key] ?? '') : (feeColumns[k] || []).join(', ')}
                  onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={!editingFields[key]}
                  style={!editingFields[key] ? disabledInputStyle : undefined}
                />
                {!editingFields[key] ? (
                  <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (feeColumns[k] || []).join(', '))}>Edit</button>
                ) : (
                  <>
                    <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                    <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                  </>
                )}
              </div>
              <div className="helper-text">Comma-separated numbers used to render fee columns in results for this key.</div>
            </div>
          );
        })}
      </section>

      {/* Max LTV by Tier removed from Constants per user request; values are maintained in the rates table. */}

      <section className="slds-box slds-m-bottom_medium">
        <h3>Flat-above-commercial override</h3>
        <div className="slds-form-element slds-m-bottom_small">
          <label className="slds-form-element__label">Scope matcher</label>
          <div className="slds-form-element__control" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {(() => {
              const key = 'flatAbove:scopeMatcher';
              return (
                <>
                  <input className="slds-input" value={editingFields[key] ? (tempValues[key] ?? '') : (flatAboveCommercialRule.scopeMatcher || '')} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} style={!editingFields[key] ? disabledInputStyle : undefined} />
                  {!editingFields[key] ? (
                    <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, flatAboveCommercialRule.scopeMatcher || '')}>Edit</button>
                  ) : (
                    <>
                      <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                      <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <div className="helper-text">Comma-separated tokens or phrase used to detect the product scope (case-insensitive). Example: "flat,commercial"</div>
        </div>

        <div>
          <strong>Tier → Effective max LTV</strong>
          <div className="slds-m-top_x-small">
            <label className="slds-form-element__label">Tier 2</label>
            <div className="slds-form-element__control" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {(() => {
                const key = 'flatAbove:tier2';
                return (
                  <>
                    <input className="slds-input" value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['2'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} style={!editingFields[key] ? disabledInputStyle : undefined} />
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(flatAboveCommercialRule.tierLtv?.['2'] ?? ''))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="slds-m-top_x-small">
            <label className="slds-form-element__label">Tier 3</label>
            <div className="slds-form-element__control" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {(() => {
                const key = 'flatAbove:tier3';
                return (
                  <>
                    <input className="slds-input" value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['3'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} style={!editingFields[key] ? disabledInputStyle : undefined} />
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(flatAboveCommercialRule.tierLtv?.['3'] ?? ''))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      <section className="slds-box slds-m-bottom_medium">
        <h3>Market / Base Rates</h3>
  <p className="helper-text"></p>

        <div className="slds-grid slds-wrap slds-gutters_small" style={{ gap: '1rem' }}>
          <div className="slds-col" style={{ minWidth: 260 }}>
            <label className="slds-form-element__label">Standard BBR</label>
            <div className="slds-form-element__control slds-grid" style={{ alignItems: 'center', gap: '0.5rem' }}>
              {(() => {
                const key = 'marketRates:STANDARD_BBR';
                return (
                  <>
                    <input
                      className="slds-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STANDARD_BBR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                      style={!editingFields[key] ? disabledInputStyle : undefined}
                    />
                    <div style={{ padding: '0 0.5rem', alignSelf: 'center' }}>%</div>
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.STANDARD_BBR ?? 0) * 100).toFixed(2))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="helper-text">Standard Bank Base Rate used in loan calculations (showing as percent).</div>
          </div>

          <div className="slds-col" style={{ minWidth: 260 }}>
            <label className="slds-form-element__label">Stress BBR</label>
            <div className="slds-form-element__control slds-grid" style={{ alignItems: 'center', gap: '0.5rem' }}>
              {(() => {
                const key = 'marketRates:STRESS_BBR';
                return (
                  <>
                    <input
                      className="slds-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STRESS_BBR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                      style={!editingFields[key] ? disabledInputStyle : undefined}
                    />
                    <div style={{ padding: '0 0.5rem', alignSelf: 'center' }}>%</div>
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.STRESS_BBR ?? 0) * 100).toFixed(2))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="helper-text">Stress BBR value used for stress-testing assumptions.</div>
          </div>

          <div className="slds-col" style={{ minWidth: 260 }}>
            <label className="slds-form-element__label">Current MVR</label>
            <div className="slds-form-element__control slds-grid" style={{ alignItems: 'center', gap: '0.5rem' }}>
              {(() => {
                const key = 'marketRates:CURRENT_MVR';
                return (
                  <>
                    <input
                      className="slds-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.CURRENT_MVR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                      style={!editingFields[key] ? disabledInputStyle : undefined}
                    />
                    <div style={{ padding: '0 0.5rem', alignSelf: 'center' }}>%</div>
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, ((marketRates?.CURRENT_MVR ?? 0) * 100).toFixed(2))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="helper-text">Current Mortgage Valuation Rate (shown as percent).</div>
          </div>
        </div>

        {/* Preview removed as requested */}
      </section>

      {/* Flat-above-commercial override removed — rule is now hard-coded in calculator logic per user request. */}

      <div className="slds-button-group">
        <button className="slds-button slds-button_outline-brand" onClick={exportJson}>Export JSON</button>
        <button className="slds-button slds-button_destructive" onClick={resetToDefaults}>Reset defaults</button>
      </div>

      <hr />
      <h4>Import JSON</h4>
      <textarea className="slds-textarea" rows={6} value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
      <div className="slds-m-top_small">
        <button className="slds-button slds-button_brand" onClick={importJson}>Import & Save</button>
      </div>

      {message && <div className="slds-text-title_caps slds-m-top_small">{message}</div>}
    </div>
  );
}
