import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = express.Router();

// Bridging/Fusion set keys use a different table
const BRIDGING_SET_KEYS = ['Bridging_Var', 'Bridging_Fix', 'Fusion'];

// GET /api/rates
// Returns rows from rates_flat (BTL) or bridge_fusion_rates_full (Bridging/Fusion)
// Supports filtering by status and date range for rate lifecycle management
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
    // Rate lifecycle filters
    rate_status,
    active_only, // Convenience filter: only return rates that are Active AND within date range
    // sorting / pagination
    sort = 'set_key',
    order = 'asc',
    limit = '500',
    offset = '0',
    table // Optional: explicitly specify table ('btl', 'bridging', or 'all')
  } = req.query;

  // Determine which table to query based on set_key or explicit table parameter
  let tableName;
  let isBridgingRate = set_key && BRIDGING_SET_KEYS.includes(set_key);
  
  // Explicit table parameter takes precedence
  if (table === 'bridging') {
    tableName = 'bridge_fusion_rates_full';
    isBridgingRate = true;
  } else if (table === 'btl') {
    tableName = 'rates_flat';
    isBridgingRate = false;
  } else if (table === 'all') {
    // Fetch from both tables and merge results
    log.info('GET /api/rates - fetching ALL rates from both tables');
    
    const [btlResult, bridgingResult] = await Promise.all([
      supabase.from('rates_flat').select('*'),
      supabase.from('bridge_fusion_rates_full').select('*')
    ]);
    
    if (btlResult.error) {
      log.error('❌ Error fetching BTL rates', btlResult.error);
      throw ErrorTypes.database('Failed to fetch BTL rates');
    }
    if (bridgingResult.error) {
      log.error('❌ Error fetching bridging rates', bridgingResult.error);
      throw ErrorTypes.database('Failed to fetch bridging rates');
    }
    
    const allRates = [...(btlResult.data || []), ...(bridgingResult.data || [])];
    return res.json({ rates: allRates });
  } else {
    // Default behavior based on set_key
    tableName = isBridgingRate ? 'bridge_fusion_rates_full' : 'rates_flat';
  }

  log.info('GET /api/rates - fetching rates', { set_key, property, tableName, rate_type, tier, product, sort, order, limit, offset });

  let query = supabase.from(tableName).select('*');

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

  // Rate lifecycle filtering
  if (rate_status) {
    query = query.eq('rate_status', rate_status);
  }

  // Active only filter: returns rates that are Active AND currently within date range
  // Logic: rate_status = 'Active' AND (start_date IS NULL OR start_date <= today) AND (end_date IS NULL OR end_date >= today)
  if (active_only === 'true' || active_only === '1') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    query = query
      .eq('rate_status', 'Active')
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`);
    
    log.info('Active only filter applied', { today, active_only });
  }

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

// PATCH /api/rates/:id
// Update a rate value (Admin only)
router.patch('/:id', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { field, value, tableName, oldValue, context } = req.body;

  // Validate required fields
  if (!id || !field || value === undefined || !tableName) {
    throw ErrorTypes.validation('Missing required fields: id, field, value, tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  // Validate field name (only allow specific fields to be updated)
  const allowedFields = ['rate', 'min_loan', 'max_loan', 'product_fee', 'min_term', 'max_term', 'rate_status', 'start_date', 'end_date'];
  if (!allowedFields.includes(field)) {
    throw ErrorTypes.validation(`Field '${field}' is not editable`);
  }

  // Validate rate value if updating rate
  if (field === 'rate') {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      throw ErrorTypes.validation('Rate must be a number between 0 and 100');
    }
  }

  // Validate rate_status if updating status
  if (field === 'rate_status') {
    if (!['Active', 'Inactive'].includes(value)) {
      throw ErrorTypes.validation('Rate status must be either "Active" or "Inactive"');
    }
  }

  // Validate date fields
  if (field === 'start_date' || field === 'end_date') {
    if (value !== null && value !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        throw ErrorTypes.validation('Date must be in YYYY-MM-DD format');
      }
    }
  }

  log.info('PATCH /api/rates/:id - updating rate', { 
    id, 
    field, 
    oldValue, 
    newValue: value, 
    tableName,
    userId: req.user.id,
    userEmail: req.user.email 
  });

  // Update the rate (rates tables don't have updated_at column)
  const { data: updatedRate, error: updateError } = await supabase
    .from(tableName)
    .update({ [field]: value })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    log.error('❌ Error updating rate', updateError);
    throw ErrorTypes.database('Failed to update rate');
  }

  // Create audit log entry
  const auditEntry = {
    table_name: tableName,
    record_id: parseInt(id),
    field_name: field,
    old_value: oldValue !== undefined ? String(oldValue) : null,
    new_value: String(value),
    set_key: context?.set_key || updatedRate?.set_key,
    product: context?.product || updatedRate?.product,
    property: context?.property || updatedRate?.property,
    min_ltv: context?.min_ltv || updatedRate?.min_ltv,
    max_ltv: context?.max_ltv || updatedRate?.max_ltv,
    user_id: req.user.id,
    user_email: req.user.email,
    user_name: req.user.name || req.user.email
  };

  const { error: auditError } = await supabase
    .from('rate_audit_log')
    .insert(auditEntry);

  if (auditError) {
    // Log but don't fail the request - the rate was updated successfully
    log.error('⚠️ Failed to create audit log entry', auditError);
  } else {
    log.info('✅ Audit log entry created', { recordId: id, field });
  }

  res.json({ 
    success: true, 
    rate: updatedRate,
    message: `${field} updated successfully`
  });
}));

// POST /api/rates/bulk-status
// Bulk update rate status (Admin only)
// Used for activating/deactivating multiple rates at once
router.post('/bulk-status', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { ids, status, tableName } = req.body;

  // Validate required fields
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ErrorTypes.validation('Missing or invalid ids array');
  }
  if (!status || !['Active', 'Inactive'].includes(status)) {
    throw ErrorTypes.validation('Status must be either "Active" or "Inactive"');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  log.info('POST /api/rates/bulk-status - bulk updating rate status', {
    ids,
    status,
    tableName,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Update all rates in the ids array
  const { data: updatedRates, error: updateError } = await supabase
    .from(tableName)
    .update({ rate_status: status })
    .in('id', ids)
    .select();

  if (updateError) {
    log.error('❌ Error bulk updating rate status', updateError);
    throw ErrorTypes.database('Failed to bulk update rate status');
  }

  // Create audit log entries for each updated rate
  const auditEntries = (updatedRates || []).map(rate => ({
    table_name: tableName,
    record_id: rate.id,
    field_name: 'rate_status',
    old_value: rate.rate_status === status ? status : (status === 'Active' ? 'Inactive' : 'Active'),
    new_value: status,
    set_key: rate.set_key,
    product: rate.product,
    property: rate.property,
    min_ltv: rate.min_ltv,
    max_ltv: rate.max_ltv,
    user_id: req.user.id,
    user_email: req.user.email,
    user_name: req.user.name || req.user.email
  }));

  if (auditEntries.length > 0) {
    const { error: auditError } = await supabase
      .from('rate_audit_log')
      .insert(auditEntries);

    if (auditError) {
      log.error('⚠️ Failed to create audit log entries for bulk status update', auditError);
    } else {
      log.info('✅ Audit log entries created for bulk status update', { count: auditEntries.length });
    }
  }

  res.json({
    success: true,
    updatedCount: updatedRates?.length || 0,
    message: `${updatedRates?.length || 0} rates updated to ${status}`
  });
}));

// GET /api/rates/audit-log
// Get rate change audit history (Admin only)
router.get('/audit-log', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { 
    set_key, 
    limit = '50', 
    offset = '0' 
  } = req.query;

  log.info('GET /api/rates/audit-log', { set_key, limit, offset });

  let query = supabase
    .from('rate_audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (set_key) {
    query = query.eq('set_key', set_key);
  }

  const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const offsetNum = Math.max(Number(offset) || 0, 0);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data, error } = await query;

  if (error) {
    log.error('❌ Error fetching audit log', error);
    throw ErrorTypes.database('Failed to fetch audit log');
  }

  res.json({ auditLog: data || [] });
}));

// POST /api/rates
// Create a new rate record (Admin only)
router.post('/', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { rate, tableName } = req.body;

  // Validate required fields
  if (!rate || typeof rate !== 'object') {
    throw ErrorTypes.validation('Missing rate data');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  // Remove id field if present (let database auto-generate)
  const { id, ...rateData } = rate;

  log.info('POST /api/rates - creating new rate', {
    tableName,
    set_key: rateData.set_key,
    product: rateData.product,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Insert the new rate
  const { data: insertedRate, error: insertError } = await supabase
    .from(tableName)
    .insert([{ ...rateData }])
    .select()
    .single();

  if (insertError) {
    log.error('❌ Error creating rate', insertError);
    throw ErrorTypes.database('Failed to create rate');
  }

  // Create audit log entry
  const auditEntry = {
    table_name: tableName,
    record_id: insertedRate.id,
    field_name: 'created',
    old_value: null,
    new_value: JSON.stringify(insertedRate),
    set_key: insertedRate.set_key,
    product: insertedRate.product,
    property: insertedRate.property,
    min_ltv: insertedRate.min_ltv,
    max_ltv: insertedRate.max_ltv,
    user_id: req.user.id,
    user_email: req.user.email,
    user_name: req.user.name || req.user.email
  };

  const { error: auditError } = await supabase
    .from('rate_audit_log')
    .insert(auditEntry);

  if (auditError) {
    log.error('⚠️ Failed to create audit log entry for new rate', auditError);
  }

  res.status(201).json({
    success: true,
    rate: insertedRate,
    message: 'Rate created successfully'
  });
}));

// PUT /api/rates/:id
// Full update of a rate record (Admin only)
router.put('/:id', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rate, tableName } = req.body;

  // Validate required fields
  if (!id) {
    throw ErrorTypes.validation('Missing rate id');
  }
  if (!rate || typeof rate !== 'object') {
    throw ErrorTypes.validation('Missing rate data');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  log.info('PUT /api/rates/:id - updating rate', {
    id,
    tableName,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Update the rate
  const { data: updatedRate, error: updateError } = await supabase
    .from(tableName)
    .update({ ...rate })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    log.error('❌ Error updating rate', updateError);
    throw ErrorTypes.database('Failed to update rate');
  }

  res.json({
    success: true,
    rate: updatedRate,
    message: 'Rate updated successfully'
  });
}));

// DELETE /api/rates/:id
// Delete a single rate (Admin only)
router.delete('/:id', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tableName } = req.query;

  // Validate required fields
  if (!id) {
    throw ErrorTypes.validation('Missing rate id');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName query parameter');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  log.info('DELETE /api/rates/:id - deleting rate', {
    id,
    tableName,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Delete the rate
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (deleteError) {
    log.error('❌ Error deleting rate', deleteError);
    throw ErrorTypes.database('Failed to delete rate');
  }

  res.json({
    success: true,
    message: 'Rate deleted successfully'
  });
}));

// DELETE /api/rates/bulk
// Delete multiple rates (Admin only)
router.delete('/bulk', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { ids, tableName } = req.body;

  // Validate required fields
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ErrorTypes.validation('Missing or invalid ids array');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  log.info('DELETE /api/rates/bulk - deleting multiple rates', {
    ids,
    tableName,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Delete the rates
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .in('id', ids);

  if (deleteError) {
    log.error('❌ Error bulk deleting rates', deleteError);
    throw ErrorTypes.database('Failed to bulk delete rates');
  }

  res.json({
    success: true,
    deletedCount: ids.length,
    message: `${ids.length} rates deleted successfully`
  });
}));

// POST /api/rates/import
// Bulk import/upsert rates from CSV (Admin only)
router.post('/import', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { records, tableName, onConflict } = req.body;

  // Validate required fields
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw ErrorTypes.validation('Missing or invalid records array');
  }
  if (!tableName) {
    throw ErrorTypes.validation('Missing tableName');
  }

  // Validate table name
  const allowedTables = ['bridge_fusion_rates_full', 'rates_flat'];
  if (!allowedTables.includes(tableName)) {
    throw ErrorTypes.validation('Invalid table name');
  }

  log.info('POST /api/rates/import - bulk importing rates', {
    recordCount: records.length,
    tableName,
    onConflict,
    userId: req.user.id,
    userEmail: req.user.email
  });

  // Process in chunks
  const chunkSize = 200;
  let totalUpserted = 0;
  const errors = [];

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(chunk, { onConflict: onConflict || undefined })
      .select();

    if (error) {
      log.error(`❌ Error importing chunk ${i / chunkSize + 1}`, error);
      errors.push({ chunk: i / chunkSize + 1, error: error.message });
    } else {
      totalUpserted += data?.length || chunk.length;
    }
  }

  if (errors.length > 0 && totalUpserted === 0) {
    throw ErrorTypes.database('Failed to import rates: ' + errors.map(e => e.error).join(', '));
  }

  res.json({
    success: true,
    importedCount: totalUpserted,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 
      ? `Imported ${totalUpserted} rates with ${errors.length} chunk errors`
      : `${totalUpserted} rates imported successfully`
  });
}));

export default router;
