import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';

const router = express.Router();

/**
 * Admin Data Access Variables (Vercel-style)
 * Secure CRUD for key/value variables used by Data team integrations
 * NOTE: These routes must be top-level, not nested inside other handlers.
 */
router.get('/data-access/variables', authenticateToken, requireAccessLevel(1), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('integration_variables')
      .select('id,name,key,value,description,scope,is_active,created_at,updated_at,created_by')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ variables: Array.isArray(data) ? data : [] });
  } catch (err) {
    next(err);
  }
});

router.post('/data-access/variables', authenticateToken, requireAccessLevel(1), async (req, res, next) => {
  try {
    const { name, key, value, description, scope, expires_at } = req.body || {};
    if (!name || !key || typeof value === 'undefined') {
      return res.status(400).json({ error: 'name, key, and value are required' });
    }
    const payload = {
      name: String(name),
      key: String(key),
      value: String(value),
      description: description ? String(description) : null,
      scope: scope ? String(scope) : 'general',
      is_active: true,
      created_by: req.user?.id || null,
    };
    if (expires_at) payload.expires_at = expires_at;

    const { data, error } = await supabase
      .from('integration_variables')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ variable: data });
  } catch (err) {
    next(err);
  }
});

router.put('/data-access/variables/:id', authenticateToken, requireAccessLevel(1), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { value, description, scope, is_active, name, key, expires_at } = req.body || {};
    const updates = { updated_at: new Date().toISOString() };
    if (typeof value !== 'undefined') updates.value = String(value);
    if (typeof description !== 'undefined') updates.description = description ? String(description) : null;
    if (typeof scope !== 'undefined') updates.scope = scope ? String(scope) : 'general';
    if (typeof is_active !== 'undefined') updates.is_active = !!is_active;
    if (typeof name !== 'undefined') updates.name = String(name);
    if (typeof key !== 'undefined') updates.key = String(key);
    if (typeof expires_at !== 'undefined') updates.expires_at = expires_at;

    const { data, error } = await supabase
      .from('integration_variables')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ variable: data });
  } catch (err) {
    next(err);
  }
});

router.delete('/data-access/variables/:id', authenticateToken, requireAccessLevel(1), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase
      .from('integration_variables')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ variable: data });
  } catch (err) {
    next(err);
  }
});

/**
 * Admin Data Health endpoint
 * GET /api/admin/data-health
 * Optional query params:
 *  - set_key (default: RATES_SPEC)
 *  - property (Residential | Commercial | Semi-Commercial | Core)
 *
 * Returns JSON with duplicate groups and quick stats so ops can remediate data issues quickly.
 */
router.get('/data-health', async (req, res, next) => {
  try {
    const setKey = (req.query.set_key || 'RATES_SPEC').toString();
    const property = req.query.property ? req.query.property.toString() : null;

    // Decide table based on set_key (align with /api/rates route logic)
    const BRIDGING_SET_KEYS = ['Bridging_Var', 'Bridging_Fix', 'Fusion'];
    const tableName = BRIDGING_SET_KEYS.includes(setKey) ? 'bridge_fusion_rates_full' : 'rates_flat';

    // Fetch minimal columns for analysis (schema differs between BTL and Bridging/Fusion)
    const selectColumns = BRIDGING_SET_KEYS.includes(setKey)
      ? 'id,set_key,property,product,product_fee,rate,max_ltv,updated_at,type,charge_type'
      : 'id,set_key,property,tier,product,product_fee,rate,max_ltv,updated_at,status';

    let query = supabase
      .from(tableName)
      .select(selectColumns)
      .eq('set_key', setKey);

    if (property) query = query.eq('property', property);

    const { data: rows, error } = await query; 
    if (error) throw error;

    const records = Array.isArray(rows) ? rows : [];

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const groupBy = (arr, keyFn) => {
      const map = new Map();
      for (const r of arr) {
        const key = keyFn(r);
        const prev = map.get(key) || [];
        prev.push(r);
        map.set(key, prev);
      }
      return map;
    };

    // Helper: unify the dimension akin to "tier" across schemas
    const tierLike = (r) => {
      if (Object.prototype.hasOwnProperty.call(r, 'tier')) return String(r.tier || '');
      const t = r.type ? String(r.type) : '';
      const c = r.charge_type ? String(r.charge_type) : '';
      return [t, c].filter(Boolean).join('/'); // e.g., "Fixed/First charge"
    };

    // 1) Exact-duplicate rows (same product, fee, tier-like, property, rate)
    const exactDupGroups = groupBy(records, r => [
      r.property || '',
      r.product || '',
      toNum(r.product_fee) ?? 'none',
      tierLike(r),
      String(r.rate || '')
    ].join('||'));

    const exactDuplicates = [];
    for (const [key, list] of exactDupGroups.entries()) {
      if (list.length > 1) {
        const [propertyKey, productKey, feeKey, tierKey, rateKey] = key.split('||');
        exactDuplicates.push({
          property: propertyKey,
          product: productKey,
          fee: feeKey,
          tier: tierKey,
          rate: rateKey,
          count: list.length,
          sampleIds: list.slice(0, 10).map(r => r.id)
        });
      }
    }

    // 2) Cross-tier-like duplicates (same product+fee within property regardless of tier/type)
    const crossTierGroups = groupBy(records, r => [
      r.property || '',
      r.product || '',
      toNum(r.product_fee) ?? 'none'
    ].join('||'));

    const crossTierDuplicates = [];
    for (const [key, list] of crossTierGroups.entries()) {
      // Only flag if more than 1 distinct tier-like value present
      const tiers = new Set(list.map(r => tierLike(r)));
      if (list.length > 1 && tiers.size > 1) {
        const [propertyKey, productKey, feeKey] = key.split('||');
        crossTierDuplicates.push({
          property: propertyKey,
          product: productKey,
          fee: feeKey,
          tiers: Array.from(tiers),
          count: list.length,
          sampleIds: list.slice(0, 10).map(r => r.id)
        });
      }
    }

    // 3) Anomalies (non-numeric product_fee, missing/zero max_ltv)
    const anomalies = {
      nonNumericFees: records
        .filter(r => r.product_fee !== null && r.product_fee !== '' && !Number.isFinite(Number(r.product_fee)))
        .map(r => ({ id: r.id, product: r.product, product_fee: r.product_fee })),
      missingMaxLtv: records
        .filter(r => !Number.isFinite(Number(r.max_ltv)))
        .map(r => ({ id: r.id, product: r.product, max_ltv: r.max_ltv })),
    };

    // Quick stats
    const stats = {
      set_key: setKey,
      property: property || 'ALL',
      totalRows: records.length,
      exactDuplicateGroups: exactDuplicates.length,
      crossTierDuplicateGroups: crossTierDuplicates.length,
      nonNumericFees: anomalies.nonNumericFees.length,
      missingMaxLtv: anomalies.missingMaxLtv.length,
    };

    res.json({ stats, exactDuplicates, crossTierDuplicates, anomalies });
  } catch (err) {
    next(err);
  }
});

export default router;
