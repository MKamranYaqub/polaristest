import express from 'express';
import { supabase } from '../config/supabase.js';
import { validate, createQuoteSchema, updateQuoteSchema } from '../middleware/validation.js';
import { asyncHandler, ErrorTypes } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = express.Router();

router.use(authenticateToken);

// Helper: parse numeric or return null (avoid inserting empty strings into numeric columns)
function toNullableNumber(v) {
  if (v === undefined || v === null) return null;
  // Accept numbers
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  // Accept numeric strings (strip commas/currency etc.)
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Create a new quote
router.post('/', validate(createQuoteSchema), asyncHandler(async (req, res) => {
  log.info('📝 POST /api/quotes - Creating new quote', { calculator_type: req.body.calculator_type });
  
  const { calculator_type, results, ...quoteData } = req.body;

  const isBridge = calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge';
  const table = isBridge ? 'bridge_quotes' : 'quotes';
  const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

  // Normalize calculator_type for consistency
  const normalizedType = isBridge ? 'BRIDGING' : 'BTL';
  
  // Generate reference number using database function
  const { data: refData, error: refError } = await supabase.rpc('generate_reference_number');
  if (refError) {
    log.error('Error generating reference number', refError);
  }
  const referenceNumber = refData || `MFS${Date.now()}`;
  
  // Add the normalized calculator_type and reference_number to the data
  const dataToInsert = { 
    ...quoteData,
    calculator_type: normalizedType,
    reference_number: referenceNumber
  };

  const { data, error } = await supabase.from(table).insert([dataToInsert]).select('*');
  if (error) {
    log.error('❌ Supabase insert error', error);
    throw ErrorTypes.database('Failed to create quote', error);
  }
  
  const savedQuote = data && data[0] ? data[0] : null;
  
  // Save results to the corresponding results table if provided
  if (savedQuote && results && Array.isArray(results) && results.length > 0) {
    const resultsToInsert = results.map(result => ({
      quote_id: savedQuote.id,
      ...result
    }));
    
    const { error: resultsError } = await supabase.from(resultsTable).insert(resultsToInsert);
    if (resultsError) {
      log.error('Error saving quote results', resultsError);
      // Don't fail the entire request if results saving fails
    }
  }
  
  return res.status(201).json({ quote: savedQuote });
}));

// List quotes (optional filters: user_id, calculator_type, limit, offset)
router.get('/', asyncHandler(async (req, res) => {
  log.info('GET /api/quotes - Request received', req.query);
  const { user_id, calculator_type, limit = 100, offset = 0 } = req.query;
  // If calculator_type indicates bridging, query bridge_quotes instead
  const isBridge = calculator_type && (calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge');
  const isBTL = calculator_type && calculator_type.toLowerCase() === 'btl';
  
  let allQuotes = [];
  
  if (isBridge) {
    // Only bridge quotes
    log.info('Fetching bridge quotes only');
    let query = supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (user_id) query = query.eq('user_id', user_id);
    const { data, error } = await query;
    if (error) {
      log.error('Error fetching bridge quotes', error);
      throw ErrorTypes.database('Failed to fetch bridge quotes', error);
    }
    allQuotes = data || [];
  } else if (isBTL) {
    // Only BTL quotes
    log.info('Fetching BTL quotes only');
    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (user_id) query = query.eq('user_id', user_id);
    const { data, error } = await query;
    if (error) {
      log.error('Error fetching BTL quotes', error);
      throw ErrorTypes.database('Failed to fetch BTL quotes', error);
    }
    allQuotes = data || [];
  } else {
    // No calculator_type specified: fetch from both tables
    log.info('Fetching from both quotes tables');
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    const [btlResult, bridgeResult] = await Promise.allSettled([
      supabase.from('quotes').select('*').order('created_at', { ascending: false }).range(offsetNum, offsetNum + limitNum - 1),
      supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false }).range(offsetNum, offsetNum + limitNum - 1)
    ]);
    
    let btlData = [];
    let bridgeData = [];
    
    if (btlResult.status === 'fulfilled' && !btlResult.value.error) {
      btlData = btlResult.value.data || [];
      log.info(`Fetched ${btlData.length} BTL quotes`);
    } else {
      log.error('Error fetching BTL quotes', btlResult.status === 'rejected' ? btlResult.reason : btlResult.value.error);
    }
    
    if (bridgeResult.status === 'fulfilled' && !bridgeResult.value.error) {
      bridgeData = bridgeResult.value.data || [];
      log.info(`Fetched ${bridgeData.length} bridge quotes`);
    } else {
      log.error('Error fetching bridge quotes', bridgeResult.status === 'rejected' ? bridgeResult.reason : bridgeResult.value.error);
    }
    
    allQuotes = [...btlData, ...bridgeData];
    // Sort combined results by created_at descending
    allQuotes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    // Apply limit again in case more than limit from each
    allQuotes = allQuotes.slice(0, limitNum);
  }
  
  log.info(`Returning ${allQuotes.length} quotes`);
  return res.json({ quotes: allQuotes });
}));

// Get a single quote by id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { include_results } = req.query; // Optional query param to include results
  
  // Try primary quotes table first, then bridge_quotes as fallback
  let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
  let isBridge = false;
  
  if (error && error.code !== 'PGRST116') throw ErrorTypes.database('Failed to fetch quote', error);
  
  if (!data) {
    // fallback to bridge_quotes
    const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
    if (berr) {
      if (berr.code === 'PGRST116') throw ErrorTypes.notFound('Quote not found');
      throw ErrorTypes.database('Failed to fetch quote', berr);
    }
    data = bdata;
    isBridge = true;
  }
  
  // Optionally fetch results from the corresponding results table
  if (include_results === 'true' && data) {
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });
    
    if (!resultsError) {
      data.results = resultsData || [];
    } else {
      log.error('Error fetching quote results', resultsError);
      data.results = [];
    }
  }
  
  return res.json({ quote: data });
}));

// Update a quote
router.put('/:id', validate(updateQuoteSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { calculator_type, results, ...updates } = req.body;
  updates.updated_at = new Date().toISOString();

  const isBridge = calculator_type && (calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge');
  const table = isBridge ? 'bridge_quotes' : 'quotes';
  const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

  const { data: updated, error: upErr } = await supabase.from(table).update(updates).eq('id', id).select('*');
  if (upErr) {
    // If the row is not in the guessed table, try the other one.
    if (upErr.code === 'PGRST116' || (upErr.details && upErr.details.includes('0 rows'))) {
      const fallbackTable = isBridge ? 'quotes' : 'bridge_quotes';
      const fallbackResultsTable = isBridge ? 'quote_results' : 'bridge_quote_results';
      const { data: fallbackUpdated, error: fallbackErr } = await supabase.from(fallbackTable).update(updates).eq('id', id).select('*');
      if (fallbackErr) throw ErrorTypes.database('Failed to update quote', fallbackErr);
      if (!fallbackUpdated || fallbackUpdated.length === 0) throw ErrorTypes.notFound('Quote not found in either table');
      
      // Handle results for fallback table
      if (results && Array.isArray(results) && results.length > 0) {
        await supabase.from(fallbackResultsTable).delete().eq('quote_id', id);
        const resultsToInsert = results.map(result => ({ quote_id: id, ...result }));
        const { error: resultsError } = await supabase.from(fallbackResultsTable).insert(resultsToInsert);
        if (resultsError) log.error('Error saving quote results', resultsError);
      }
      
      return res.json({ quote: fallbackUpdated[0] });
    }
    throw ErrorTypes.database('Failed to update quote', upErr);
  }
  if (!updated || updated.length === 0) throw ErrorTypes.notFound('Quote not found');
  
  // Update results: delete existing and insert new ones
  if (results && Array.isArray(results) && results.length > 0) {
    // Delete existing results
    await supabase.from(resultsTable).delete().eq('quote_id', id);
    
    // Insert new results
    const resultsToInsert = results.map(result => ({
      quote_id: id,
      ...result
    }));
    
    const { error: resultsError } = await supabase.from(resultsTable).insert(resultsToInsert);
    if (resultsError) {
      log.error('Error saving quote results', resultsError);
    }
  }
  
  return res.json({ quote: updated[0] });
}));

// Delete a quote
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // try deleting from primary table first
  let { data, error } = await supabase.from('quotes').delete().eq('id', id).select('*');
  if (error) {
    // if not found, try bridge table
    if (error.code === 'PGRST116') {
      const { data: bdel, error: berr } = await supabase.from('bridge_quotes').delete().eq('id', id).select('*');
      if (berr) throw ErrorTypes.database('Failed to delete quote', berr);
      return res.json({ deleted: bdel && bdel[0] ? bdel[0] : null });
    }
    throw ErrorTypes.database('Failed to delete quote', error);
  }
  return res.json({ deleted: data && data[0] ? data[0] : null });
}));

export default router;
