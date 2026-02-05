import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/admin/settings
 * Returns app_settings for the application
 * Query params:
 *   - keys: Comma-separated list of keys to fetch (optional, fetches all if not provided)
 */
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const { keys } = req.query;
  
  log.info('GET /api/admin/settings', { keys });

  let query = supabase.from('app_settings').select('*');
  
  if (keys) {
    const keyList = keys.split(',').map(k => k.trim()).filter(Boolean);
    if (keyList.length > 0) {
      query = query.in('key', keyList);
    }
  }

  const { data, error } = await query;

  if (error) {
    log.error('❌ Error fetching app settings', error);
    throw ErrorTypes.database('Failed to fetch app settings');
  }

  res.json({ settings: data || [] });
}));

/**
 * PUT /api/admin/settings
 * Save/update app_settings (Admin only - access level 1-3)
 * Body: { settings: [{ key: string, value: any }] }
 */
router.put('/settings', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { settings } = req.body;
  
  if (!settings || !Array.isArray(settings)) {
    throw ErrorTypes.validation('Settings must be an array');
  }

  log.info('PUT /api/admin/settings', { count: settings.length });

  const timestamp = new Date().toISOString();
  const rows = settings.map(s => ({
    key: s.key,
    value: s.value,
    updated_at: timestamp
  }));

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' })
    .select();

  if (error) {
    log.error('❌ Error saving app settings', error);
    throw ErrorTypes.database('Failed to save app settings');
  }

  log.info('✅ App settings saved', { count: rows.length });
  res.json({ settings: data || [] });
}));

/**
 * GET /api/admin/results-configuration
 * Returns results_configuration for calculator display settings
 * Query params:
 *   - calculator_type: Filter by calculator type (btl, bridge, core)
 *   - key: Filter by key (visibility, row_order, label_aliases, header_colors)
 */
router.get('/results-configuration', authenticateToken, asyncHandler(async (req, res) => {
  const { calculator_type, key } = req.query;
  
  log.info('GET /api/admin/results-configuration', { calculator_type, key });

  let query = supabase.from('results_configuration').select('*');
  
  if (calculator_type) {
    query = query.eq('calculator_type', calculator_type);
  }
  if (key) {
    query = query.eq('key', key);
  }

  const { data, error } = await query;

  if (error) {
    log.error('❌ Error fetching results configuration', error);
    throw ErrorTypes.database('Failed to fetch results configuration');
  }

  res.json({ configurations: data || [] });
}));

/**
 * PUT /api/admin/results-configuration
 * Save/update results_configuration (Admin only - access level 1-3)
 * Body: { configurations: [{ key: string, calculator_type: string, config: object }] }
 */
router.put('/results-configuration', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { configurations } = req.body;
  
  if (!configurations || !Array.isArray(configurations)) {
    throw ErrorTypes.validation('Configurations must be an array');
  }

  log.info('PUT /api/admin/results-configuration', { count: configurations.length });

  const timestamp = new Date().toISOString();
  const rows = configurations.map(c => ({
    key: c.key,
    calculator_type: c.calculator_type,
    config: c.config,
    updated_at: timestamp
  }));

  const { data, error } = await supabase
    .from('results_configuration')
    .upsert(rows, { onConflict: 'key,calculator_type' })
    .select();

  if (error) {
    log.error('❌ Error saving results configuration', error);
    throw ErrorTypes.database('Failed to save results configuration');
  }

  log.info('✅ Results configuration saved', { count: rows.length });
  res.json({ configurations: data || [] });
}));

/**
 * GET /api/admin/stats
 * Returns dashboard statistics (counts from various tables)
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  log.info('GET /api/admin/stats');

  // Get today's date at midnight for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Fetch all counts in parallel
  const [
    usersResult,
    btlRatesResult,
    bridgingRatesResult,
    btlQuotesResult,
    bridgeQuotesResult,
    supportResult,
    criteriaResult
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('rates_flat').select('*', { count: 'exact', head: true }),
    supabase.from('bridge_fusion_rates_full').select('*', { count: 'exact', head: true }),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('bridge_quotes').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('support_requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'pending']),
    supabase.from('criteria_config_flat').select('*', { count: 'exact', head: true })
  ]);

  // Log any errors
  const results = { usersResult, btlRatesResult, bridgingRatesResult, btlQuotesResult, bridgeQuotesResult, supportResult, criteriaResult };
  Object.entries(results).forEach(([key, result]) => {
    if (result.error) {
      log.error(`Error fetching ${key}:`, result.error.message);
    }
  });

  // Calculate combined quotes today
  const btlToday = btlQuotesResult.count || 0;
  const bridgeToday = bridgeQuotesResult.count || 0;

  res.json({
    stats: {
      users: usersResult.count || 0,
      btlRates: btlRatesResult.count || 0,
      bridgingRates: bridgingRatesResult.count || 0,
      quotesToday: btlToday + bridgeToday,
      supportRequests: supportResult.count || 0,
      criteriaRules: criteriaResult.count || 0
    }
  });
}));

/**
 * GET /api/admin/uw-requirements
 * Returns UW requirements configuration from app_constants
 */
router.get('/uw-requirements', authenticateToken, asyncHandler(async (req, res) => {
  log.info('GET /api/admin/uw-requirements');

  const { data, error } = await supabase
    .from('app_constants')
    .select('*')
    .eq('key', 'uw_requirements')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    log.error('❌ Error fetching UW requirements', error);
    throw ErrorTypes.database('Failed to fetch UW requirements');
  }

  // Parse the value if it exists
  let requirements = null;
  if (data && data.value) {
    try {
      requirements = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    } catch (parseErr) {
      log.warn('Failed to parse UW requirements, returning raw value');
      requirements = data.value;
    }
  }

  res.json({ requirements, updatedAt: data?.updated_at || null });
}));

/**
 * PUT /api/admin/uw-requirements
 * Save UW requirements configuration to app_constants (Admin only - access level 1-3)
 * Body: { requirements: array }
 */
router.put('/uw-requirements', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { requirements } = req.body;
  
  if (!requirements || !Array.isArray(requirements)) {
    throw ErrorTypes.validation('Requirements must be an array');
  }

  log.info('PUT /api/admin/uw-requirements', { count: requirements.length });

  const timestamp = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('app_constants')
    .upsert({
      key: 'uw_requirements',
      value: JSON.stringify(requirements),
      updated_at: timestamp
    }, { onConflict: 'key' })
    .select();

  if (error) {
    log.error('❌ Error saving UW requirements', error);
    throw ErrorTypes.database('Failed to save UW requirements');
  }

  log.info('✅ UW requirements saved', { count: requirements.length });
  res.json({ success: true, updatedAt: timestamp });
}));

export default router;
