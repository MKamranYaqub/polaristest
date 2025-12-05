import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import log from '../utils/logger.js';

const router = express.Router();

// GET /api/rates
// Returns rows from rates_flat with optional filters, sorting, and pagination
router.get('/', asyncHandler(async (req, res) => {
  const {
    // filters
    set_key,
    property,
    rate_type,
    tier,
    product,
    product_fee,
    initial_term,
    full_term,
    is_retention,
    is_tracker,
    // sorting / pagination
    sort = 'set_key',
    order = 'asc',
    limit = '500',
    offset = '0'
  } = req.query;

  log.info('GET /api/rates - fetching rates', { set_key, property, rate_type, tier, product, sort, order, limit, offset });

  let query = supabase.from('rates_flat').select('*');

  // Simple equals filters (numeric fields coerced when safe)
  const applyEq = (field, value, coerceNumber = false) => {
    if (value === undefined || value === null || value === '') return;
    if (coerceNumber) {
      const n = Number(value);
      if (!Number.isNaN(n)) {
        query = query.eq(field, n);
        return;
      }
    }
    query = query.eq(field, value);
  };

  applyEq('set_key', set_key);
  applyEq('property', property);
  applyEq('rate_type', rate_type);
  applyEq('tier', tier); // tier can be alphanumeric; don't force number here
  applyEq('product', product);
  applyEq('product_fee', product_fee, true);
  applyEq('initial_term', initial_term, true);
  applyEq('full_term', full_term, true);

  // Boolean handling for retention/tracker
  const applyBoolean = (field, value) => {
    if (value === undefined || value === null || value === '') return;
    const v = String(value).toLowerCase();
    if (['true', '1', 'yes'].includes(v)) query = query.eq(field, true);
    else if (['false', '0', 'no'].includes(v)) query = query.eq(field, false);
  };
  applyBoolean('is_retention', is_retention);
  applyBoolean('is_tracker', is_tracker);

  // Sorting and pagination
  const ascending = String(order).toLowerCase() !== 'desc';
  query = query.order(String(sort || 'set_key'), { ascending });

  const limitNum = Math.min(Math.max(Number(limit) || 500, 1), 2000);
  const offsetNum = Math.max(Number(offset) || 0, 0);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data, error } = await query;
  if (error) {
    log.error('❌ Error fetching rates', error);
    throw ErrorTypes.database('Failed to fetch rates');
  }

  res.json({ rates: data || [] });
}));

export default router;
