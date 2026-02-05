import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/criteria
 * Returns all criteria configuration data for calculators
 * This is public data used for loan criteria questions
 * 
 * Query params:
 *   - criteria_set: Filter by criteria set (e.g., 'BTL', 'Bridging')
 *   - product_scope: Filter by product scope (e.g., 'Residential', 'Commercial')
 */
router.get('/', asyncHandler(async (req, res) => {
  const { criteria_set, product_scope } = req.query;

  log.info('GET /api/criteria - fetching criteria config', { criteria_set, product_scope });

  let query = supabase.from('criteria_config_flat').select('*');

  // Apply optional filters
  if (criteria_set) {
    query = query.ilike('criteria_set', criteria_set);
  }
  if (product_scope) {
    query = query.ilike('product_scope', product_scope);
  }

  // Order by display_order for consistent ordering
  query = query.order('display_order', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    log.error('❌ Error fetching criteria', error);
    throw ErrorTypes.database('Failed to fetch criteria configuration');
  }

  res.json({ criteria: data || [] });
}));

/**
 * GET /api/criteria/filter-options
 * Returns available filter options for criteria admin table
 * Requires authentication
 */
router.get('/filter-options', authenticateToken, asyncHandler(async (req, res) => {
  log.info('GET /api/criteria/filter-options - fetching filter options');

  const { data, error } = await supabase
    .from('criteria_config_flat')
    .select('criteria_set, product_scope, question_group');

  if (error) {
    log.error('❌ Error fetching criteria filter options', error);
    throw ErrorTypes.database('Failed to fetch criteria filter options');
  }

  const criteriaSets = [...new Set(data.map(c => c.criteria_set).filter(Boolean))];
  const productScopes = [...new Set(data.map(c => c.product_scope).filter(Boolean))];
  const questionGroups = [...new Set(data.map(c => c.question_group).filter(Boolean))];

  res.json({
    criteriaSets,
    productScopes,
    questionGroups
  });
}));

/**
 * POST /api/criteria
 * Create a new criteria record
 * Requires admin role
 */
router.post('/', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { criteria } = req.body;

  if (!criteria) {
    throw ErrorTypes.validation('Criteria data is required');
  }

  log.info('POST /api/criteria - creating new criteria', { criteria_set: criteria.criteria_set });

  // Remove id and timestamps if present
  const { id, created_at, updated_at, ...cleanCriteria } = criteria;

  const { data, error } = await supabase
    .from('criteria_config_flat')
    .insert([cleanCriteria])
    .select();

  if (error) {
    log.error('❌ Error creating criteria', error);
    throw ErrorTypes.database('Failed to create criteria');
  }

  res.status(201).json({ criteria: data[0], message: 'Criteria created successfully' });
}));

/**
 * PUT /api/criteria/:id
 * Update an existing criteria record by ID
 * Requires admin role
 */
router.put('/:id', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { criteria } = req.body;

  if (!criteria) {
    throw ErrorTypes.validation('Criteria data is required');
  }

  log.info('PUT /api/criteria/:id - updating criteria', { id });

  // Remove id and timestamps
  const { id: _, created_at, updated_at, ...cleanCriteria } = criteria;

  const { data, error } = await supabase
    .from('criteria_config_flat')
    .update(cleanCriteria)
    .eq('id', id)
    .select();

  if (error) {
    log.error('❌ Error updating criteria', error);
    throw ErrorTypes.database('Failed to update criteria');
  }

  if (!data || data.length === 0) {
    throw ErrorTypes.notFound('Criteria not found');
  }

  res.json({ criteria: data[0], message: 'Criteria updated successfully' });
}));

/**
 * PUT /api/criteria/by-key
 * Update criteria by composite key (criteria_set, product_scope, question_key, option_label)
 * Requires admin role
 */
router.put('/by-key', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { criteria, matchKey } = req.body;

  if (!criteria || !matchKey) {
    throw ErrorTypes.validation('Criteria data and match key are required');
  }

  log.info('PUT /api/criteria/by-key - updating criteria by composite key', matchKey);

  // Remove id and timestamps
  const { id, created_at, updated_at, ...cleanCriteria } = criteria;

  const { data, error } = await supabase
    .from('criteria_config_flat')
    .update(cleanCriteria)
    .match(matchKey)
    .select();

  if (error) {
    log.error('❌ Error updating criteria by key', error);
    throw ErrorTypes.database('Failed to update criteria');
  }

  res.json({ criteria: data?.[0] || null, message: 'Criteria updated successfully' });
}));

/**
 * DELETE /api/criteria/:id
 * Delete a criteria record by ID
 * Requires admin role
 */
router.delete('/:id', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { id } = req.params;

  log.info('DELETE /api/criteria/:id - deleting criteria', { id });

  const { error } = await supabase
    .from('criteria_config_flat')
    .delete()
    .eq('id', id);

  if (error) {
    log.error('❌ Error deleting criteria', error);
    throw ErrorTypes.database('Failed to delete criteria');
  }

  res.json({ message: 'Criteria deleted successfully' });
}));

/**
 * DELETE /api/criteria/by-key
 * Delete criteria by composite key
 * Requires admin role
 */
router.delete('/by-key', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { criteria_set, product_scope, question_key, option_label } = req.body;

  if (!criteria_set || !product_scope || !question_key) {
    throw ErrorTypes.validation('Composite key fields are required (criteria_set, product_scope, question_key, option_label)');
  }

  log.info('DELETE /api/criteria/by-key - deleting criteria by composite key', { criteria_set, product_scope, question_key });

  let query = supabase
    .from('criteria_config_flat')
    .delete()
    .eq('criteria_set', criteria_set)
    .eq('product_scope', product_scope)
    .eq('question_key', question_key);

  // option_label may be null for some records
  if (option_label !== undefined && option_label !== null) {
    query = query.eq('option_label', option_label);
  }

  const { error } = await query;

  if (error) {
    log.error('❌ Error deleting criteria by key', error);
    throw ErrorTypes.database('Failed to delete criteria');
  }

  res.json({ message: 'Criteria deleted successfully' });
}));

/**
 * POST /api/criteria/bulk-delete
 * Bulk delete criteria records
 * Requires admin role
 */
router.post('/bulk-delete', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { criteria } = req.body;

  if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
    throw ErrorTypes.validation('Array of criteria to delete is required');
  }

  log.info('POST /api/criteria/bulk-delete - deleting multiple criteria', { count: criteria.length });

  let deletedCount = 0;
  const errors = [];

  for (const item of criteria) {
    try {
      let query = supabase
        .from('criteria_config_flat')
        .delete()
        .eq('criteria_set', item.criteria_set)
        .eq('product_scope', item.product_scope)
        .eq('question_key', item.question_key);

      if (item.option_label !== undefined && item.option_label !== null) {
        query = query.eq('option_label', item.option_label);
      }

      const { error } = await query;
      if (error) {
        errors.push({ item, error: error.message });
      } else {
        deletedCount++;
      }
    } catch (err) {
      errors.push({ item, error: err.message });
    }
  }

  if (errors.length > 0) {
    log.warn('Some criteria deletions failed', { errors });
  }

  res.json({
    message: `Deleted ${deletedCount} of ${criteria.length} criteria`,
    deletedCount,
    errors: errors.length > 0 ? errors : undefined
  });
}));

/**
 * POST /api/criteria/import
 * Bulk import/upsert criteria records
 * Requires admin role
 */
router.post('/import', authenticateToken, requireAccessLevel(3), asyncHandler(async (req, res) => {
  const { records, onConflict } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    throw ErrorTypes.validation('Array of records is required');
  }

  log.info('POST /api/criteria/import - importing criteria', { count: records.length });

  const conflictCols = onConflict || 'criteria_set,product_scope,question_key,option_label';

  // Clean records - remove id and timestamps
  const cleanedRecords = records.map(r => {
    const { id, created_at, updated_at, ...clean } = r;
    return clean;
  });

  // Try bulk upsert first
  const chunkSize = 50;
  let successCount = 0;
  const errors = [];

  for (let i = 0; i < cleanedRecords.length; i += chunkSize) {
    const chunk = cleanedRecords.slice(i, i + chunkSize);
    try {
      const { error } = await supabase
        .from('criteria_config_flat')
        .upsert(chunk, { onConflict: conflictCols });

      if (error) {
        // Fallback to per-record upsert
        for (const rec of chunk) {
          try {
            const matchObj = {
              criteria_set: rec.criteria_set,
              product_scope: rec.product_scope,
              question_key: rec.question_key,
              option_label: rec.option_label
            };

            const { data: existing } = await supabase
              .from('criteria_config_flat')
              .select('id')
              .match(matchObj)
              .limit(1);

            if (existing && existing.length > 0) {
              const { error: upErr } = await supabase
                .from('criteria_config_flat')
                .update(rec)
                .match(matchObj);
              if (upErr) throw upErr;
            } else {
              const { error: insErr } = await supabase
                .from('criteria_config_flat')
                .insert(rec);
              if (insErr) throw insErr;
            }
            successCount++;
          } catch (recErr) {
            errors.push({ record: rec, error: recErr.message });
          }
        }
      } else {
        successCount += chunk.length;
      }
    } catch (chunkErr) {
      errors.push({ chunk: i, error: chunkErr.message });
    }
  }

  res.json({
    message: `Imported ${successCount} of ${cleanedRecords.length} criteria`,
    successCount,
    errors: errors.length > 0 ? errors : undefined
  });
}));

export default router;
