import React, { useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import NotificationModal from './NotificationModal';
import {
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST,
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS,
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  MARKET_RATES as DEFAULT_MARKET_RATES,
  BROKER_ROUTES as DEFAULT_BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS as DEFAULT_BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE as DEFAULT_BROKER_COMMISSION_TOLERANCE,
  FUNDING_LINES_BTL,
  FUNDING_LINES_BRIDGE,
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
  const [brokerRoutes, setBrokerRoutes] = useState(DEFAULT_BROKER_ROUTES);
  const [brokerCommissionDefaults, setBrokerCommissionDefaults] = useState(DEFAULT_BROKER_COMMISSION_DEFAULTS);
  const [brokerCommissionTolerance, setBrokerCommissionTolerance] = useState(DEFAULT_BROKER_COMMISSION_TOLERANCE);
  const [fundingLinesBTL, setFundingLinesBTL] = useState([]);
  const [fundingLinesBridge, setFundingLinesBridge] = useState([]);
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState('');
  const { supabase } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [structuredSupported, setStructuredSupported] = useState(null);
  const [hasValueColumn, setHasValueColumn] = useState(null);
  // per-field editing state and temporary values
  const [editingFields, setEditingFields] = useState({});
  const [tempValues, setTempValues] = useState({});
  
  // Broker route add/delete state
  const [showAddRouteForm, setShowAddRouteForm] = useState(false);
  const [newRouteKey, setNewRouteKey] = useState('');
  const [newRouteDisplayName, setNewRouteDisplayName] = useState('');
  const [newRouteCommission, setNewRouteCommission] = useState('0.9');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, routeKey: '', displayName: '' });
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  // defensive: if someone saved an invalid shape to localStorage or constants,
  // ensure rendering doesn't throw. Treat non-object productLists/feeColumns as missing.
  const safeProductLists = (productLists && typeof productLists === 'object' && !Array.isArray(productLists)) ? productLists : DEFAULT_PRODUCT_TYPES_LIST;
  const safeFeeColumns = (feeColumns && typeof feeColumns === 'object' && !Array.isArray(feeColumns)) ? feeColumns : DEFAULT_FEE_COLUMNS;
  const safeFundingLinesBTL = Array.isArray(fundingLinesBTL) && fundingLinesBTL.length ? fundingLinesBTL : FUNDING_LINES_BTL;
  const safeFundingLinesBridge = Array.isArray(fundingLinesBridge) && fundingLinesBridge.length ? fundingLinesBridge : FUNDING_LINES_BRIDGE;

  useEffect(() => {
    const overrides = readOverrides();
    if (overrides) {
      setProductLists(overrides.productLists || DEFAULT_PRODUCT_TYPES_LIST);
      setFeeColumns(overrides.feeColumns || DEFAULT_FEE_COLUMNS);
      setFlatAboveCommercialRule(overrides.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
      setMarketRates(overrides.marketRates || DEFAULT_MARKET_RATES);
      setBrokerRoutes(overrides.brokerRoutes || DEFAULT_BROKER_ROUTES);
      setBrokerCommissionDefaults(overrides.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS);
      setBrokerCommissionTolerance(overrides.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
      setFundingLinesBTL(overrides.fundingLinesBTL || FUNDING_LINES_BTL);
      setFundingLinesBridge(overrides.fundingLinesBridge || FUNDING_LINES_BRIDGE);
      // initialize temp values
      const tv = {};
      // product lists: tolerate malformed overrides (strings/arrays) and fall back to defaults per key
      const opl = overrides.productLists;
      const plSource = (opl && typeof opl === 'object' && !Array.isArray(opl)) ? opl : DEFAULT_PRODUCT_TYPES_LIST;
      Object.keys(plSource).forEach((pt) => {
        const raw = opl && opl[pt];
        let v = '';
        if (Array.isArray(raw)) v = raw.join(', ');
        else if (raw == null) v = (DEFAULT_PRODUCT_TYPES_LIST[pt] || []).join(', ');
        else v = String(raw);
        tv[`productLists:${pt}`] = v;
      });

      // fee columns: ensure we stringify arrays of numbers or fall back
      const ofc = overrides.feeColumns;
      const fcSource = (ofc && typeof ofc === 'object' && !Array.isArray(ofc)) ? ofc : DEFAULT_FEE_COLUMNS;
      Object.keys(fcSource).forEach((k) => {
        const raw = ofc && ofc[k];
        let v = '';
        if (Array.isArray(raw)) v = raw.join(', ');
        else if (raw == null) v = (DEFAULT_FEE_COLUMNS[k] || []).join(', ');
        else v = String(raw);
        tv[`feeColumns:${k}`] = v;
      });

      Object.keys(overrides.marketRates || DEFAULT_MARKET_RATES).forEach(k => { const v = ((overrides.marketRates?.[k] ?? 0) * 100).toFixed(2); tv[`marketRates:${k}`] = v; });
      tv['flatAbove:scopeMatcher'] = overrides.flatAboveCommercialRule?.scopeMatcher || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.scopeMatcher || '';
      tv['flatAbove:tier2'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['2'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] ?? '');
      tv['flatAbove:tier3'] = String(overrides.flatAboveCommercialRule?.tierLtv?.['3'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] ?? '');
      
      // broker settings
      Object.keys(overrides.brokerRoutes || DEFAULT_BROKER_ROUTES).forEach(k => { tv[`brokerRoutes:${k}`] = (overrides.brokerRoutes?.[k] ?? DEFAULT_BROKER_ROUTES[k]); });
      Object.keys(overrides.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).forEach(k => { tv[`brokerCommission:${k}`] = String((overrides.brokerCommissionDefaults?.[k] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[k])); });
      tv['brokerTolerance'] = String(overrides.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
      tv['fundingLinesBTL'] = (overrides.fundingLinesBTL || FUNDING_LINES_BTL).join(', ');
      tv['fundingLinesBridge'] = (overrides.fundingLinesBridge || FUNDING_LINES_BRIDGE).join(', ');
      
      setTempValues(tv);
    }

    // listen for external localStorage changes (e.g. calculator updates overrides)
    const onStorage = (e) => {
      if (e.key !== LOCALSTORAGE_CONSTANTS_KEY) return;
      try {
        const newVal = e.newValue ? JSON.parse(e.newValue) : null;
        if (!newVal) return;
        setProductLists(newVal.productLists || DEFAULT_PRODUCT_TYPES_LIST);
        setFeeColumns(newVal.feeColumns || DEFAULT_FEE_COLUMNS);
        setFlatAboveCommercialRule(newVal.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE);
        setMarketRates(newVal.marketRates || DEFAULT_MARKET_RATES);
        setBrokerRoutes(newVal.brokerRoutes || DEFAULT_BROKER_ROUTES);
        setBrokerCommissionDefaults(newVal.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS);
        setBrokerCommissionTolerance(newVal.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
        setFundingLinesBTL(newVal.fundingLinesBTL || FUNDING_LINES_BTL);
        setFundingLinesBridge(newVal.fundingLinesBridge || FUNDING_LINES_BRIDGE);
        // re-seed temp values similarly to initial load
        const tv2 = {};
        Object.keys(newVal.productLists || DEFAULT_PRODUCT_TYPES_LIST).forEach(pt => { tv2[`productLists:${pt}`] = (newVal.productLists?.[pt] || DEFAULT_PRODUCT_TYPES_LIST[pt] || []).join(', '); });
        Object.keys(newVal.feeColumns || DEFAULT_FEE_COLUMNS).forEach(k => { tv2[`feeColumns:${k}`] = (newVal.feeColumns?.[k] || DEFAULT_FEE_COLUMNS[k] || []).join(', '); });
        Object.keys(newVal.marketRates || DEFAULT_MARKET_RATES).forEach(k => { const v = ((newVal.marketRates?.[k] ?? 0) * 100).toFixed(2); tv2[`marketRates:${k}`] = v; });
        tv2['flatAbove:scopeMatcher'] = newVal.flatAboveCommercialRule?.scopeMatcher || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.scopeMatcher || '';
        tv2['flatAbove:tier2'] = String(newVal.flatAboveCommercialRule?.tierLtv?.['2'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['2'] ?? '');
        tv2['flatAbove:tier3'] = String(newVal.flatAboveCommercialRule?.tierLtv?.['3'] ?? DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE.tierLtv['3'] ?? '');
        Object.keys(newVal.brokerRoutes || DEFAULT_BROKER_ROUTES).forEach(k => { tv2[`brokerRoutes:${k}`] = (newVal.brokerRoutes?.[k] ?? DEFAULT_BROKER_ROUTES[k]); });
        Object.keys(newVal.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).forEach(k => { tv2[`brokerCommission:${k}`] = String((newVal.brokerCommissionDefaults?.[k] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[k])); });
        tv2['brokerTolerance'] = String(newVal.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
        tv2['fundingLinesBTL'] = (newVal.fundingLinesBTL || FUNDING_LINES_BTL).join(', ');
        tv2['fundingLinesBridge'] = (newVal.fundingLinesBridge || FUNDING_LINES_BRIDGE).join(', ');
        setTempValues(tv2);
      } catch (err) {
        console.debug('Ignored storage event for constants', err);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
        await updateProductList(pt, tempValues[key] || '');
      } else if (key.startsWith('feeColumns:')) {
        const k = key.split(':')[1];
        await updateFeeColumns(k, tempValues[key] || '');
      } else if (key.startsWith('marketRates:')) {
        const field = key.split(':')[1];
        const n = Number(tempValues[key]);
        await updateMarketRates({ [field]: Number.isFinite(n) ? n / 100 : 0 });
      } else if (key === 'flatAbove:scopeMatcher') {
        await updateFlatAboveCommercial({ scopeMatcher: tempValues[key] || '' });
      } else if (key === 'flatAbove:tier2') {
        await updateFlatAboveCommercial({ tierLtv: { ...(flatAboveCommercialRule.tierLtv || {}), '2': Number(tempValues[key] || '') } });
      } else if (key === 'flatAbove:tier3') {
        await updateFlatAboveCommercial({ tierLtv: { ...(flatAboveCommercialRule.tierLtv || {}), '3': Number(tempValues[key] || '') } });
      } else if (key.startsWith('brokerRoutes:')) {
        const routeKey = key.split(':')[1];
        await updateBrokerRoutes({ [routeKey]: tempValues[key] || '' });
      } else if (key.startsWith('brokerCommission:')) {
        const route = key.split(':')[1];
        const n = Number(tempValues[key]);
        await updateBrokerCommissionDefaults({ [route]: Number.isFinite(n) ? n : 0.9 });
      } else if (key === 'brokerTolerance') {
        const n = Number(tempValues[key]);
        await updateBrokerCommissionTolerance(Number.isFinite(n) ? n : 0.2);
      } else if (key === 'fundingLinesBTL') {
        await updateFundingLinesBTL(tempValues[key] || '');
      } else if (key === 'fundingLinesBridge') {
        await updateFundingLinesBridge(tempValues[key] || '');
      }
    } catch (e) {
      console.error('Failed to save field', key, e);
    } finally {
      setEditingFields(prev => ({ ...prev, [key]: false }));
    }
  };

  const exportJson = () => {
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge
    };
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
          let loadedData = null;
          // prefer structured columns when present
          if (row.product_lists || row.fee_columns || row.flat_above_commercial_rule || row.market_rates || row.broker_routes) {
            loadedData = {
              productLists: row.product_lists || DEFAULT_PRODUCT_TYPES_LIST,
              feeColumns: row.fee_columns || DEFAULT_FEE_COLUMNS,
              flatAboveCommercialRule: row.flat_above_commercial_rule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
              marketRates: row.market_rates || DEFAULT_MARKET_RATES,
              brokerRoutes: row.broker_routes || DEFAULT_BROKER_ROUTES,
              brokerCommissionDefaults: row.broker_commission_defaults || DEFAULT_BROKER_COMMISSION_DEFAULTS,
              brokerCommissionTolerance: row.broker_commission_tolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE,
              fundingLinesBTL: row.funding_lines_btl || FUNDING_LINES_BTL,
              fundingLinesBridge: row.funding_lines_bridge || FUNDING_LINES_BRIDGE
            };
          } else if (row.value) {
            const v = row.value;
            loadedData = {
              productLists: v.productLists || DEFAULT_PRODUCT_TYPES_LIST,
              feeColumns: v.feeColumns || DEFAULT_FEE_COLUMNS,
              flatAboveCommercialRule: v.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
              marketRates: v.marketRates || DEFAULT_MARKET_RATES,
              brokerRoutes: v.brokerRoutes || DEFAULT_BROKER_ROUTES,
              brokerCommissionDefaults: v.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS,
              brokerCommissionTolerance: v.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE,
              fundingLinesBTL: v.fundingLinesBTL || FUNDING_LINES_BTL,
              fundingLinesBridge: v.fundingLinesBridge || FUNDING_LINES_BRIDGE
            };
          }
          
          if (loadedData && mounted) {
            // Update state
            setProductLists(loadedData.productLists);
            setFeeColumns(loadedData.feeColumns);
            setFlatAboveCommercialRule(loadedData.flatAboveCommercialRule);
            setMarketRates(loadedData.marketRates);
            setBrokerRoutes(loadedData.brokerRoutes);
            setBrokerCommissionDefaults(loadedData.brokerCommissionDefaults);
            setBrokerCommissionTolerance(loadedData.brokerCommissionTolerance);
            setFundingLinesBTL(loadedData.fundingLinesBTL || FUNDING_LINES_BTL);
            setFundingLinesBridge(loadedData.fundingLinesBridge || FUNDING_LINES_BRIDGE);
            
            // Update localStorage to match
            writeOverrides(loadedData);
            
            // Update tempValues to reflect loaded data
            const tv = {};
            Object.keys(loadedData.productLists).forEach((pt) => {
              const arr = loadedData.productLists[pt];
              tv[`productLists:${pt}`] = Array.isArray(arr) ? arr.join(', ') : String(arr || '');
            });
            Object.keys(loadedData.feeColumns).forEach((k) => {
              const arr = loadedData.feeColumns[k];
              tv[`feeColumns:${k}`] = Array.isArray(arr) ? arr.join(', ') : String(arr || '');
            });
            Object.keys(loadedData.marketRates).forEach(k => {
              tv[`marketRates:${k}`] = ((loadedData.marketRates[k] ?? 0) * 100).toFixed(2);
            });
            tv['flatAbove:scopeMatcher'] = loadedData.flatAboveCommercialRule?.scopeMatcher || '';
            tv['flatAbove:tier2'] = String(loadedData.flatAboveCommercialRule?.tierLtv?.['2'] ?? '');
            tv['flatAbove:tier3'] = String(loadedData.flatAboveCommercialRule?.tierLtv?.['3'] ?? '');
            Object.keys(loadedData.brokerRoutes).forEach(k => {
              tv[`brokerRoutes:${k}`] = loadedData.brokerRoutes[k];
            });
            Object.keys(loadedData.brokerCommissionDefaults).forEach(k => {
              tv[`brokerCommission:${k}`] = String(loadedData.brokerCommissionDefaults[k]);
            });
            tv['brokerTolerance'] = String(loadedData.brokerCommissionTolerance);
            tv['fundingLines'] = (loadedData.fundingLines || FUNDING_LINES).join(', ');
            setTempValues(tv);
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
      setBrokerRoutes(parsed.brokerRoutes || DEFAULT_BROKER_ROUTES);
      setBrokerCommissionDefaults(parsed.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS);
      setBrokerCommissionTolerance(parsed.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE);
      writeOverrides({ 
        productLists: parsed.productLists, 
        feeColumns: parsed.feeColumns, 
        flatAboveCommercialRule: parsed.flatAboveCommercialRule, 
        marketRates: parsed.marketRates,
        brokerRoutes: parsed.brokerRoutes,
        brokerCommissionDefaults: parsed.brokerCommissionDefaults,
        brokerCommissionTolerance: parsed.brokerCommissionTolerance
      });
      setMessage('Imported and saved to localStorage.');
    } catch (e) {
      setMessage('Invalid JSON: ' + (e.message || e));
    }
  };

  const saveToStorage = async () => {
    const payload = { 
      productLists, 
      feeColumns, 
      flatAboveCommercialRule, 
      marketRates, 
      brokerRoutes, 
      brokerCommissionDefaults, 
      brokerCommissionTolerance,
      fundingLinesBTL,
      fundingLinesBridge
    };
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
          broker_routes: payload.brokerRoutes || null,
          broker_commission_defaults: payload.brokerCommissionDefaults || null,
          broker_commission_tolerance: payload.brokerCommissionTolerance ?? null,
          funding_lines_btl: payload.fundingLinesBTL || null,
          funding_lines_bridge: payload.fundingLinesBridge || null,
        };
        try {
          const { data: inserted, error: insertErr } = await supabase.from('app_constants').insert([insertRow]).select('*');
          setSaving(false);
          if (insertErr) {
            console.warn('Failed to insert structured constants to Supabase', insertErr);
            setMessage('Saved locally, but failed to persist structured constants to Supabase. See console.');
            // fallback to storing as `value`
            const { error: fallbackErr } = await saveToSupabase(payload);
            setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Save failed: could not persist structured constants to Supabase. Falling back to legacy storage.' });
            if (fallbackErr) console.warn('Fallback saveToSupabase also failed', fallbackErr);
          } else {
            setMessage('Saved to localStorage and persisted structured constants to Supabase.');
            setNotification({ show: true, type: 'success', title: 'Success', message: 'Save successful — structured constants persisted.' });
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
          setNotification({ show: true, type: 'error', title: 'Error', message: 'Save failed with exception — falling back to legacy save.' });
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
    setBrokerRoutes(DEFAULT_BROKER_ROUTES);
    setBrokerCommissionDefaults(DEFAULT_BROKER_COMMISSION_DEFAULTS);
    setBrokerCommissionTolerance(DEFAULT_BROKER_COMMISSION_TOLERANCE);
    setFundingLinesBTL(FUNDING_LINES_BTL);
    setFundingLinesBridge(FUNDING_LINES_BRIDGE);
    const payload = { 
      productLists: DEFAULT_PRODUCT_TYPES_LIST, 
      feeColumns: DEFAULT_FEE_COLUMNS, 
      flatAboveCommercialRule: DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE, 
      marketRates: DEFAULT_MARKET_RATES,
      brokerRoutes: DEFAULT_BROKER_ROUTES,
      brokerCommissionDefaults: DEFAULT_BROKER_COMMISSION_DEFAULTS,
      brokerCommissionTolerance: DEFAULT_BROKER_COMMISSION_TOLERANCE,
      fundingLinesBTL: FUNDING_LINES_BTL,
      fundingLinesBridge: FUNDING_LINES_BRIDGE
    };
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
          broker_routes: payload.brokerRoutes,
          broker_commission_defaults: payload.brokerCommissionDefaults,
          broker_commission_tolerance: payload.brokerCommissionTolerance,
          funding_lines_btl: payload.fundingLinesBTL,
          funding_lines_bridge: payload.fundingLinesBridge,
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
  const updateProductList = async (propType, csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    const newProductLists = { ...(productLists || {}), [propType]: arr };
    setProductLists(newProductLists);
    // persist this section separately - use CURRENT state values for all fields
    const currentOverrides = {
      productLists: newProductLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates
    };
    writeOverrides(currentOverrides);
    
    // Save to Supabase using comprehensive save logic
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
          product_lists: currentOverrides.productLists,
          fee_columns: currentOverrides.feeColumns,
          flat_above_commercial_rule: currentOverrides.flatAboveCommercialRule,
          market_rates: currentOverrides.marketRates,
          funding_lines_btl: fundingLinesBTL,
          funding_lines_bridge: fundingLinesBridge,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        
        if (error) {
          console.warn('Failed to save product_lists to Supabase', error);
          setMessage('Saved locally but failed to persist product lists to database. See console.');
        } else {
          setMessage('Product list saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save product_lists to Supabase', error);
        setMessage('Saved locally but failed to persist product lists to database. See console.');
      } else {
        setMessage('Product list saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving product_lists', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  const updateFeeColumns = async (key, csv) => {
    const arr = csv.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    const newFeeColumns = { ...(feeColumns || {}), [key]: arr };
    setFeeColumns(newFeeColumns);
    // persist with CURRENT state values for all fields
    const currentOverrides = {
      productLists: productLists,
      feeColumns: newFeeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates
    };
    writeOverrides(currentOverrides);
    
    // Save to Supabase using comprehensive save logic
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
          product_lists: currentOverrides.productLists,
          fee_columns: currentOverrides.feeColumns,
          flat_above_commercial_rule: currentOverrides.flatAboveCommercialRule,
          market_rates: currentOverrides.marketRates,
           funding_lines_btl: fundingLinesBTL,
           funding_lines_bridge: fundingLinesBridge,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        
        if (error) {
          console.warn('Failed to save fee_columns to Supabase', error);
          setMessage('Saved locally but failed to persist fee columns to database. See console.');
        } else {
          setMessage('Fee columns saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save fee_columns to Supabase', error);
        setMessage('Saved locally but failed to persist fee columns to database. See console.');
      } else {
        setMessage('Fee columns saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving fee_columns', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  const updateFlatAboveCommercial = async (changes) => {
    const newRule = { ...(flatAboveCommercialRule || {}), ...changes };
    setFlatAboveCommercialRule(newRule);
    // persist with CURRENT state values for all fields
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: newRule,
      marketRates: marketRates
    };
    writeOverrides(currentOverrides);
    
    // Save to Supabase using comprehensive save logic
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
          product_lists: currentOverrides.productLists,
          fee_columns: currentOverrides.feeColumns,
          flat_above_commercial_rule: currentOverrides.flatAboveCommercialRule,
          market_rates: currentOverrides.marketRates,
           funding_lines_btl: fundingLinesBTL,
           funding_lines_bridge: fundingLinesBridge,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        
        if (error) {
          console.warn('Failed to save flat_above_commercial_rule to Supabase', error);
          setMessage('Saved locally but failed to persist flat-above-commercial rule to database. See console.');
        } else {
          setMessage('Flat-above-commercial rule saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save flat_above_commercial_rule to Supabase', error);
        setMessage('Saved locally but failed to persist flat-above-commercial rule to database. See console.');
      } else {
        setMessage('Flat-above-commercial rule saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving flat_above_commercial_rule', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  const updateMarketRates = async (changes) => {
    const newRates = { ...(marketRates || {}), ...changes };
    setMarketRates(newRates);
    // persist with CURRENT state values for all fields
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: newRates,
      brokerRoutes: brokerRoutes,
      brokerCommissionDefaults: brokerCommissionDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance
    };
    writeOverrides(currentOverrides);
    
    // Save to Supabase using comprehensive save logic
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
          product_lists: currentOverrides.productLists,
          fee_columns: currentOverrides.feeColumns,
          flat_above_commercial_rule: currentOverrides.flatAboveCommercialRule,
          market_rates: currentOverrides.marketRates,
           funding_lines_btl: fundingLinesBTL,
           funding_lines_bridge: fundingLinesBridge,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        
        if (error) {
          console.warn('Failed to save market_rates to Supabase', error);
          setMessage('Saved locally but failed to persist market rates to database. See console.');
        } else {
          setMessage('Market rates saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save market_rates to Supabase', error);
        setMessage('Saved locally but failed to persist market rates to database. See console.');
      } else {
        setMessage('Market rates saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving market_rates', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  const updateBrokerRoutes = async (changes) => {
    const newRoutes = { ...(brokerRoutes || {}), ...changes };
    setBrokerRoutes(newRoutes);
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: newRoutes,
      brokerCommissionDefaults: brokerCommissionDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance
    };
    writeOverrides(currentOverrides);
    setMessage('Broker routes saved to localStorage.');
  };

  const updateBrokerCommissionDefaults = async (changes) => {
    const newDefaults = { ...(brokerCommissionDefaults || {}), ...changes };
    setBrokerCommissionDefaults(newDefaults);
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: brokerRoutes,
      brokerCommissionDefaults: newDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance
    };
    writeOverrides(currentOverrides);
    setMessage('Broker commission defaults saved to localStorage.');
  };

  const updateBrokerCommissionTolerance = async (newTolerance) => {
    setBrokerCommissionTolerance(newTolerance);
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: brokerRoutes,
      brokerCommissionDefaults: brokerCommissionDefaults,
      brokerCommissionTolerance: newTolerance
    };
    writeOverrides(currentOverrides);
    setMessage('Broker commission tolerance saved to localStorage.');
  };

  // Update funding lines (comma-separated string)
  // Update funding lines for BTL (comma-separated string)
  const updateFundingLinesBTL = async (csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    setFundingLinesBTL(arr);
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: brokerRoutes,
      brokerCommissionDefaults: brokerCommissionDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance,
      fundingLinesBTL: arr,
      fundingLinesBridge: fundingLinesBridge
    };
    writeOverrides(currentOverrides);
    setMessage('BTL funding lines saved to localStorage.');

    // Persist using same strategy as other fields
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
          product_lists: productLists,
          fee_columns: feeColumns,
          flat_above_commercial_rule: flatAboveCommercialRule,
          market_rates: marketRates,
          funding_lines_btl: arr,
          funding_lines_bridge: fundingLinesBridge,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        if (error) {
          console.warn('Failed to save funding_lines_btl to Supabase', error);
          setMessage('Saved locally but failed to persist BTL funding lines to database. See console.');
        } else {
          setMessage('BTL funding lines saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save funding_lines_btl to Supabase (fallback)', error);
        setMessage('Saved locally but failed to persist BTL funding lines to database.');
      } else {
        setMessage('BTL funding lines saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving funding_lines_btl', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  // Update funding lines for Bridge (comma-separated string)
  const updateFundingLinesBridge = async (csv) => {
    const arr = csv.split(',').map((s) => s.trim()).filter(Boolean);
    setFundingLinesBridge(arr);
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: brokerRoutes,
      brokerCommissionDefaults: brokerCommissionDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance,
      fundingLinesBTL: fundingLinesBTL,
      fundingLinesBridge: arr
    };
    writeOverrides(currentOverrides);
    setMessage('Bridge funding lines saved to localStorage.');

    // Persist using same strategy as other fields
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
          product_lists: productLists,
          fee_columns: feeColumns,
          flat_above_commercial_rule: flatAboveCommercialRule,
          market_rates: marketRates,
          funding_lines_btl: fundingLinesBTL,
          funding_lines_bridge: arr,
        };
        const { error } = await supabase.from('app_constants').upsert([upsertRow], { returning: 'minimal' });
        setSaving(false);
        if (error) {
          console.warn('Failed to save funding_lines_bridge to Supabase', error);
          setMessage('Saved locally but failed to persist Bridge funding lines to database. See console.');
        } else {
          setMessage('Bridge funding lines saved locally and persisted to Supabase.');
        }
        return { error };
      }

      // Fallback
      const { error } = await saveToSupabase(currentOverrides);
      setSaving(false);
      if (error) {
        console.warn('Failed to save funding_lines_bridge to Supabase (fallback)', error);
        setMessage('Saved locally but failed to persist Bridge funding lines to database.');
      } else {
        setMessage('Bridge funding lines saved locally and persisted to Supabase.');
      }
      return { error };
    } catch (e) {
      setSaving(false);
      console.error('Unexpected error saving funding_lines_bridge', e);
      setMessage('Saved locally but unexpected error persisting to database.');
      return { error: e };
    }
  };

  // Add new broker route
  const addBrokerRoute = async () => {
    // Validate inputs
    if (!newRouteKey.trim()) {
      setMessage('Error: Route key cannot be empty');
      return;
    }
    if (!newRouteDisplayName.trim()) {
      setMessage('Error: Display name cannot be empty');
      return;
    }
    
    // Convert key to uppercase and replace spaces with underscores
    const formattedKey = newRouteKey.trim().toUpperCase().replace(/\s+/g, '_');
    
    // Check if key already exists
    if (brokerRoutes[formattedKey]) {
      setMessage(`Error: Route key "${formattedKey}" already exists`);
      return;
    }
    
    // Add to broker routes
    const newRoutes = { ...brokerRoutes, [formattedKey]: newRouteDisplayName.trim() };
    setBrokerRoutes(newRoutes);
    
    // Add to commission defaults
    const commission = parseFloat(newRouteCommission) || 0.9;
    const newDefaults = { ...brokerCommissionDefaults, [newRouteDisplayName.trim()]: commission };
    setBrokerCommissionDefaults(newDefaults);
    
    // Save to localStorage
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: newRoutes,
      brokerCommissionDefaults: newDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance
    };
    writeOverrides(currentOverrides);
    
    // Reset form and close
    setNewRouteKey('');
    setNewRouteDisplayName('');
    setNewRouteCommission('0.9');
    setShowAddRouteForm(false);
    setMessage(`Added new broker route: ${formattedKey} (${newRouteDisplayName.trim()})`);
  };

  // Delete broker route
  const deleteBrokerRoute = async (routeKey) => {
    // Show modal instead of confirm dialog
    const displayName = brokerRoutes[routeKey];
    setDeleteConfirmation({ show: true, routeKey, displayName });
  };

  // Confirm deletion from modal
  const confirmDeleteBrokerRoute = async () => {
    const { routeKey, displayName } = deleteConfirmation;
    
    // Remove from broker routes
    const newRoutes = { ...brokerRoutes };
    delete newRoutes[routeKey];
    setBrokerRoutes(newRoutes);
    
    // Remove from commission defaults
    const newDefaults = { ...brokerCommissionDefaults };
    delete newDefaults[displayName];
    setBrokerCommissionDefaults(newDefaults);
    
    // Save to localStorage
    const currentOverrides = {
      productLists: productLists,
      feeColumns: feeColumns,
      flatAboveCommercialRule: flatAboveCommercialRule,
      marketRates: marketRates,
      brokerRoutes: newRoutes,
      brokerCommissionDefaults: newDefaults,
      brokerCommissionTolerance: brokerCommissionTolerance
    };
    writeOverrides(currentOverrides);
    
    setMessage(`Deleted broker route: ${routeKey}`);
    setDeleteConfirmation({ show: false, routeKey: '', displayName: '' });
  };

  // Cancel deletion from modal
  const cancelDeleteBrokerRoute = () => {
    setDeleteConfirmation({ show: false, routeKey: '', displayName: '' });
  };

  // Save a single named column to Supabase table `app_constants`.
  // Column names used: product_lists, fee_columns, flat_above_commercial_rule, market_rates
  const saveFieldToSupabase = async (column, value) => {
    if (!supabase) {
      console.warn('Supabase client unavailable');
      return { error: 'Supabase client unavailable' };
    }
    
    console.log(`saveFieldToSupabase called: column=${column}`, value);
    
    try {
      // If structured columns supported, try a structured-column upsert first
      let tryStructured = structuredSupported;
      if (tryStructured === null) {
        console.log('Detecting structured support...');
        tryStructured = await detectStructuredSupport();
        setStructuredSupported(tryStructured);
      }
      
      console.log(`tryStructured: ${tryStructured}`);
      
      if (tryStructured) {
        try {
          // Fetch existing structured row and merge to avoid overwriting other structured columns with NULL
          console.log('Fetching existing row from app_constants...');
          const { data: existingStruct, error: fetchErr } = await supabase.from('app_constants').select('*').eq('key', 'app.constants').single();
          
          if (fetchErr && fetchErr.code !== 'PGRST116') {
            console.warn('Error fetching existing row:', fetchErr);
          }
          
          const currentStruct = existingStruct || {};
          console.log('Existing data:', currentStruct);
          
          const mapStruct = {
            product_lists: 'product_lists',
            fee_columns: 'fee_columns',
            flat_above_commercial_rule: 'flat_above_commercial_rule',
            market_rates: 'market_rates',
            funding_lines_btl: 'funding_lines_btl',
            funding_lines_bridge: 'funding_lines_bridge',
          };
          const targetCol = mapStruct[column] || column;
          
          // Use current state values as fallbacks if DB has nulls
          const newRow = {
            key: 'app.constants',
            product_lists: currentStruct.product_lists || productLists || null,
            fee_columns: currentStruct.fee_columns || feeColumns || null,
            flat_above_commercial_rule: currentStruct.flat_above_commercial_rule || flatAboveCommercialRule || null,
            market_rates: currentStruct.market_rates || marketRates || null,
          };
          
          // set the changed column
          newRow[targetCol] = value;
          
          console.log('Upserting to app_constants:', newRow);
          const { error } = await supabase.from('app_constants').upsert([newRow], { returning: 'minimal' });
          
          if (!error) {
            console.log('Successfully saved to Supabase (structured)');
            return { error: null };
          }
          
          // if structured upsert failed, we'll attempt alternatives below
          console.warn('Structured upsert returned error, will try fallbacks', error);
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
              funding_lines: 'funding_lines',
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
          funding_lines_btl: 'fundingLinesBTL',
          funding_lines_bridge: 'fundingLinesBridge',
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

      <p className="helper-text">Edit product lists, fee columns and LTV thresholds.</p>
      <div className="button-group-end">
        <button className="slds-button slds-button_brand" onClick={saveToStorage} disabled={saving}>
          {saving ? 'Saving...' : 'Save All to Database'}
        </button>
        <button className="slds-button slds-button_outline-brand" onClick={exportJson}>Export JSON</button>
        <button className="slds-button slds-button_destructive" onClick={resetToDefaults}>Reset defaults</button>
      </div>

      <section className="slds-box slds-m-bottom_medium section-divider">
        <h3 className="section-header">Product lists per property type</h3>
        <div className="grid-auto-fit">
          {Object.keys(safeProductLists).map((pt) => {
            const key = `productLists:${pt}`;
            return (
              <div key={pt} className="slds-form-element">
                <label className="slds-form-element__label">{pt}</label>
                <div className="slds-form-element__control form-control-inline">
                  <input
                    className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                    value={editingFields[key] ? (tempValues[key] ?? '') : String(Array.isArray(productLists[pt]) ? productLists[pt].join(', ') : (productLists[pt] ?? ''))}
                    onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                    disabled={!editingFields[key]}
                  />
                  {!editingFields[key] ? (
                    <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (Array.isArray(safeProductLists[pt]) ? safeProductLists[pt].join(', ') : String(safeProductLists[pt] ?? '')))}>Edit</button>
                  ) : (
                    <>
                      <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                      <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                    </>
                  )}
                </div>
                {/*<div className="helper-text">Comma-separated list of product names shown in the calculator product select.</div>*/}
              </div>
            );
          })}
        </div>
      </section>

      <section className="slds-box slds-m-bottom_medium section-divider">
        <h3 className="section-header">Fee columns</h3>
        <div className="grid-auto-fit">
          {Object.keys(safeFeeColumns).map((k) => {
            const key = `feeColumns:${k}`;
            return (
              <div key={k} className="slds-form-element">
                <label className="slds-form-element__label">{k}</label>
                <div className="slds-form-element__control form-control-inline">
                  <input
                    className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                    value={editingFields[key] ? (tempValues[key] ?? '') : String(Array.isArray(feeColumns[k]) ? feeColumns[k].join(', ') : (feeColumns[k] ?? ''))}
                    onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                    disabled={!editingFields[key]}
                  />
                  {!editingFields[key] ? (
                    <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, (Array.isArray(safeFeeColumns[k]) ? safeFeeColumns[k].join(', ') : String(safeFeeColumns[k] ?? '')))}>Edit</button>
                  ) : (
                    <>
                      <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                      <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                    </>
                  )}
                </div>
                {/*<div className="helper-text">Comma-separated numbers used to render fee columns in results for this key.</div>*/}
              </div>
            );
          })}
        </div>
      </section>

      {/* Max LTV by Tier removed from Constants per user request; values are maintained in the rates table. */}

      <section className="slds-box slds-m-bottom_medium section-divider">
        <h3 className="section-header">Flat-above-commercial override</h3>
        <div className="grid-3-col">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Scope matcher</label>
            <div className="slds-form-element__control form-control-inline">
              {(() => {
                const key = 'flatAbove:scopeMatcher';
                return (
                  <>
                    <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (flatAboveCommercialRule.scopeMatcher || '')} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
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
            <label className="slds-form-element__label">Tier 2 (Effective max LTV)</label>
            <div className="slds-form-element__control form-control-inline">
              {(() => {
                const key = 'flatAbove:tier2';
                return (
                  <>
                    <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['2'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
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

          <div>
            <label className="slds-form-element__label">Tier 3 (Effective max LTV)</label>
            <div className="slds-form-element__control form-control-inline">
              {(() => {
                const key = 'flatAbove:tier3';
                return (
                  <>
                    <input className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`} value={editingFields[key] ? (tempValues[key] ?? '') : (String(flatAboveCommercialRule.tierLtv?.['3'] ?? ''))} disabled={!editingFields[key]} onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))} />
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

      <section className="slds-box slds-m-bottom_medium section-divider">
        <h3 className="section-header">Market / Base Rates</h3>
  <p className="helper-text"></p>

        <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
          <div className="slds-col min-width-260">
            <label className="slds-form-element__label">Standard BBR</label>
            <div className="slds-form-element__control slds-grid grid-align-center-gap">
              {(() => {
                const key = 'marketRates:STANDARD_BBR';
                return (
                  <>
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STANDARD_BBR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    <div className="percent-unit">%</div>
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

          <div className="slds-col min-width-260">
            <label className="slds-form-element__label">Stress BBR</label>
            <div className="slds-form-element__control slds-grid grid-align-center-gap">
              {(() => {
                const key = 'marketRates:STRESS_BBR';
                return (
                  <>
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.STRESS_BBR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    <div className="percent-unit">%</div>
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

          <div className="slds-col min-width-260">
            <label className="slds-form-element__label">Current MVR</label>
            <div className="slds-form-element__control slds-grid grid-align-center-gap">
              {(() => {
                const key = 'marketRates:CURRENT_MVR';
                return (
                  <>
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFields[key] ? (tempValues[key] ?? '') : ((marketRates?.CURRENT_MVR ?? 0) * 100).toFixed(2)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    <div className="percent-unit">%</div>
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

      <section className="slds-box slds-m-bottom_medium section-divider">
        <h3 className="section-header">Broker Settings</h3>
        <p className="helper-text">Configure broker routes, commission defaults, and tolerance settings.</p>
<br></br>
        <div className="slds-m-bottom_medium">
          <div className="display-flex justify-content-space-between align-items-center margin-bottom-1">
            
            <h5>Broker Routes</h5>
            <button 
              className="slds-button slds-button_brand" 
              onClick={() => setShowAddRouteForm(!showAddRouteForm)}
            >
              {showAddRouteForm ? 'Cancel' : 'Add New Route'}
            </button>
          </div>

          {showAddRouteForm && (
            <div className="slds-box slds-box_small slds-m-bottom_small padding-1 background-gray-light">
              <h5 className="margin-bottom-1">Add New Broker Route</h5>
              <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1 margin-bottom-1">
                <div className="slds-col min-width-200">
                  <label className="slds-form-element__label">Route Key (e.g., SOLICITOR)</label>
                  <input
                    className="slds-input"
                    type="text"
                    placeholder="SOLICITOR"
                    value={newRouteKey}
                    onChange={(e) => setNewRouteKey(e.target.value)}
                  />
                  <div className="helper-text">Uppercase, underscores for spaces</div>
                </div>
                <div className="slds-col min-width-200">
                  <label className="slds-form-element__label">Display Name</label>
                  <input
                    className="slds-input"
                    type="text"
                    placeholder="Solicitor"
                    value={newRouteDisplayName}
                    onChange={(e) => setNewRouteDisplayName(e.target.value)}
                  />
                  <div className="helper-text">Name shown in dropdown</div>
                </div>
                <div className="slds-col min-width-150">
                  <label className="slds-form-element__label">Default Commission (%)</label>
                  <input
                    className="slds-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0.9"
                    value={newRouteCommission}
                    onChange={(e) => setNewRouteCommission(e.target.value)}
                  />
                  <div className="helper-text">Default percentage</div>
                </div>
              </div>
              <div className="slds-button-group">
                <button className="slds-button slds-button_brand" onClick={addBrokerRoute}>
                  Add Route
                </button>
                <button className="slds-button slds-button_neutral" onClick={() => {
                  setShowAddRouteForm(false);
                  setNewRouteKey('');
                  setNewRouteDisplayName('');
                  setNewRouteCommission('0.9');
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
            {Object.keys(brokerRoutes || DEFAULT_BROKER_ROUTES).map(routeKey => {
              const key = `brokerRoutes:${routeKey}`;
              return (
                <div key={routeKey} className="slds-col min-width-260">
                  <label className="slds-form-element__label">{routeKey}</label>
                  <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="text"
                      value={editingFields[key] ? (tempValues[key] ?? '') : (brokerRoutes[routeKey] ?? DEFAULT_BROKER_ROUTES[routeKey])}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    {!editingFields[key] ? (
                      <>
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, brokerRoutes[routeKey] ?? DEFAULT_BROKER_ROUTES[routeKey])}>Edit</button>
                        <button className="slds-button slds-button_destructive" onClick={() => deleteBrokerRoute(routeKey)}>Delete</button>
                      </>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </div>
                  {/*<div className="helper-text">Display name for {routeKey} broker route.</div>*/}
                </div>
              );
            })}
          </div>
        </div>

        <div className="slds-m-bottom_medium">
          <br/>
          <h5>Broker Commission Defaults (%)</h5>
          <div className="slds-grid slds-wrap slds-gutters_small flex-gap-1">
            {Object.keys(brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS).map(route => {
              const key = `brokerCommission:${route}`;
              return (
                <div key={route} className="slds-col min-width-260">
                  <label className="slds-form-element__label">{route}</label>
                  <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingFields[key] ? (tempValues[key] ?? '') : (brokerCommissionDefaults[route] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[route] ?? 0.9)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    <div className="percent-unit">%</div>
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(brokerCommissionDefaults[route] ?? DEFAULT_BROKER_COMMISSION_DEFAULTS[route] ?? 0.9))}>Edit</button>
                    ) : (
                      <>
                        <button className="slds-button slds-button_brand" onClick={() => saveEdit(key)}>Save</button>
                        <button className="slds-button slds-button_neutral" onClick={() => cancelEdit(key, true)}>Cancel</button>
                      </>
                    )}
                  </div>
                  {/*<div className="helper-text">Default commission percentage for {route}.</div>*/}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h5>Commission Tolerance</h5>
          <div className="slds-col min-width-260 max-width-400">
            <label className="slds-form-element__label">Tolerance (±%)</label>
            <div className="slds-form-element__control slds-grid align-items-center flex-gap-05">
              {(() => {
                const key = 'brokerTolerance';
                return (
                  <>
                    <input
                      className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={editingFields[key] ? (tempValues[key] ?? '') : (brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE)}
                      onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                      disabled={!editingFields[key]}
                    />
                    <div className="percent-unit">%</div>
                    {!editingFields[key] ? (
                      <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, String(brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE))}>Edit</button>
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
            <div className="helper-text">Allowable deviation from default commission (e.g., 0.2 means ±0.2%).</div>
          </div>
        </div>
        
          <div className="slds-m-top_small">
            <h5>Funding Lines</h5>
            
            <div className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label">BTL Funding Lines (comma-separated)</label>
              <div className="slds-form-element__control form-control-inline">
                {(() => {
                  const key = 'fundingLinesBTL';
                  return (
                    <>
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : (Array.isArray(fundingLinesBTL) ? fundingLinesBTL.join(', ') : '')}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, Array.isArray(fundingLinesBTL) ? fundingLinesBTL.join(', ') : '')}>Edit</button>
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
              <div className="helper-text">Update options used in the BTL DIP "Funding Line" dropdown.</div>
            </div>

            <div className="slds-form-element">
              <label className="slds-form-element__label">Bridge Funding Lines (comma-separated)</label>
              <div className="slds-form-element__control form-control-inline">
                {(() => {
                  const key = 'fundingLinesBridge';
                  return (
                    <>
                      <input
                        className={`slds-input ${!editingFields[key] ? 'constants-disabled' : ''}`}
                        value={editingFields[key] ? (tempValues[key] ?? '') : (Array.isArray(fundingLinesBridge) ? fundingLinesBridge.join(', ') : '')}
                        onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editingFields[key]}
                      />
                      {!editingFields[key] ? (
                        <button className="slds-button slds-button_neutral" onClick={() => startEdit(key, Array.isArray(fundingLinesBridge) ? fundingLinesBridge.join(', ') : '')}>Edit</button>
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
              <div className="helper-text">Update options used in the Bridge DIP "Funding Line" dropdown.</div>
            </div>
          </div>
      </section>

      {/* Flat-above-commercial override removed — rule is now hard-coded in calculator logic per user request. */}

      <div className="slds-button-group">
        <button className="slds-button slds-button_brand" onClick={saveToStorage} disabled={saving}>
          {saving ? 'Saving...' : 'Save All to Database'}
        </button>
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
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="slds-modal slds-fade-in-open" role="dialog" aria-modal="true">
          <div className="slds-modal__container">
            <header className="slds-modal__header">
              <h2 className="slds-text-heading_medium">Confirm Deletion</h2>
            </header>
            <div className="slds-modal__content slds-p-around_medium">
              <p className="margin-bottom-1">
                Are you sure you want to delete the route <strong>"{deleteConfirmation.routeKey}"</strong>?
              </p>
              <div className="slds-notify slds-notify_alert slds-alert_warning margin-top-1" role="alert">
                <span className="slds-assistive-text">warning</span>
                <h2 className="subsection-header">
                  Warning
                </h2>
                <div className="slds-notify__content">
                  <p>Existing quotes using this route will still reference it in the database. The route will simply not appear in the dropdown for new quotes.</p>
                </div>
              </div>
            </div>
            <footer className="slds-modal__footer">
              <button className="slds-button slds-button_neutral" onClick={cancelDeleteBrokerRoute}>
                Cancel
              </button>
              <button className="slds-button slds-button_destructive" onClick={confirmDeleteBrokerRoute}>
                Delete Route
              </button>
            </footer>
          </div>
        </div>
      )}
      {deleteConfirmation.show && <div className="slds-backdrop slds-backdrop_open"></div>}

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
