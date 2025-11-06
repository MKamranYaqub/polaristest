import express from 'express';
import { supabase } from '../config/supabase.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

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
router.post('/', async (req, res) => {
  try {
    const { calculator_type, results, ...quoteData } = req.body;

    if (!calculator_type) {
      return res.status(400).json({ error: 'Missing calculator_type' });
    }

    const isBridge = calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge';
    const table = isBridge ? 'bridge_quotes' : 'quotes';
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

    // Normalize calculator_type for consistency
    const normalizedType = isBridge ? 'BRIDGING' : 'BTL';
    
    // Generate reference number using database function
    const { data: refData, error: refError } = await supabase.rpc('generate_reference_number');
    if (refError) {
      console.error('Error generating reference number:', refError);
    }
    const referenceNumber = refData || `MFS${Date.now()}`;
    
    // Add the normalized calculator_type and reference_number to the data
    const dataToInsert = { 
      ...quoteData,
      calculator_type: normalizedType,
      reference_number: referenceNumber
    };

    const { data, error } = await supabase.from(table).insert([dataToInsert]).select('*');
    if (error) throw error;
    
    const savedQuote = data && data[0] ? data[0] : null;
    
    // Save results to the corresponding results table if provided
    if (savedQuote && results && Array.isArray(results) && results.length > 0) {
      const resultsToInsert = results.map(result => ({
        quote_id: savedQuote.id,
        ...result
      }));
      
      const { error: resultsError } = await supabase.from(resultsTable).insert(resultsToInsert);
      if (resultsError) {
        console.error('Error saving quote results:', resultsError);
        // Don't fail the entire request if results saving fails
      }
    }
    
    return res.status(201).json({ quote: savedQuote });
  } catch (err) {
    console.error('Error creating quote:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// List quotes (optional filters: user_id, calculator_type, limit, offset)
router.get('/', async (req, res) => {
  try {
    const { user_id, calculator_type, limit = 100, offset = 0 } = req.query;
    // If calculator_type indicates bridging, query bridge_quotes instead
    const isBridge = calculator_type && (calculator_type.toLowerCase() === 'bridging' || calculator_type.toLowerCase() === 'bridge');
    const isBTL = calculator_type && calculator_type.toLowerCase() === 'btl';
    
    let allQuotes = [];
    
    if (isBridge) {
      // Only bridge quotes
      let query = supabase.from('bridge_quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query;
      if (error) throw error;
      allQuotes = data || [];
    } else if (isBTL) {
      // Only BTL quotes
      let query = supabase.from('quotes').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query;
      if (error) throw error;
      allQuotes = data || [];
    } else {
      // No calculator_type specified: fetch from both tables
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
      } else {
        console.error('Error fetching BTL quotes:', btlResult.status === 'rejected' ? btlResult.reason : btlResult.value.error);
      }
      
      if (bridgeResult.status === 'fulfilled' && !bridgeResult.value.error) {
        bridgeData = bridgeResult.value.data || [];
      } else {
        console.error('Error fetching bridge quotes:', bridgeResult.status === 'rejected' ? bridgeResult.reason : bridgeResult.value.error);
      }
      
      allQuotes = [...btlData, ...bridgeData];
      // Sort combined results by created_at descending
      allQuotes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      // Apply limit again in case more than limit from each
      allQuotes = allQuotes.slice(0, limitNum);
    }
    
    return res.json({ quotes: allQuotes });
  } catch (err) {
    console.error('Error listing quotes:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Get a single quote by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_results } = req.query; // Optional query param to include results
    
    // Try primary quotes table first, then bridge_quotes as fallback
    let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    let isBridge = false;
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // fallback to bridge_quotes
      const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
      if (berr) {
        if (berr.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
        throw berr;
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
        console.error('Error fetching quote results:', resultsError);
        data.results = [];
      }
    }
    
    return res.json({ quote: data });
  } catch (err) {
    console.error('Error fetching quote:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Update a quote
router.put('/:id', async (req, res) => {
  try {
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
            if (fallbackErr) throw fallbackErr;
            if (!fallbackUpdated || fallbackUpdated.length === 0) return res.status(404).json({ error: 'Not found in either table' });
            
            // Handle results for fallback table
            if (results && Array.isArray(results) && results.length > 0) {
              await supabase.from(fallbackResultsTable).delete().eq('quote_id', id);
              const resultsToInsert = results.map(result => ({ quote_id: id, ...result }));
              const { error: resultsError } = await supabase.from(fallbackResultsTable).insert(resultsToInsert);
              if (resultsError) console.error('Error saving quote results:', resultsError);
            }
            
            return res.json({ quote: fallbackUpdated[0] });
        }
        throw upErr;
    }
    if (!updated || updated.length === 0) return res.status(404).json({ error: 'Not found' });
    
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
        console.error('Error saving quote results:', resultsError);
      }
    }
    
    return res.json({ quote: updated[0] });
  } catch (err) {
    console.error('Error updating quote:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Delete a quote
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // try deleting from primary table first
    let { data, error } = await supabase.from('quotes').delete().eq('id', id).select('*');
    if (error) {
      // if not found, try bridge table
      if (error.code === 'PGRST116') {
        const { data: bdel, error: berr } = await supabase.from('bridge_quotes').delete().eq('id', id).select('*');
        if (berr) throw berr;
        return res.json({ deleted: bdel && bdel[0] ? bdel[0] : null });
      }
      throw error;
    }
    return res.json({ deleted: data && data[0] ? data[0] : null });
  } catch (err) {
    console.error('Error deleting quote:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Generate PDF for a quote with DIP data
router.post('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the quote from either table
    let quote = null;
    let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      quote = data;
    } else {
      // Try bridge_quotes
      const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
      if (berr) {
        if (berr.code === 'PGRST116') return res.status(404).json({ error: 'Quote not found' });
        throw berr;
      }
      quote = bdata;
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=DIP_${quote.reference_number || id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Decision in Principle (DIP)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Reference Number: ${quote.reference_number || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Quote Information Section
    doc.fontSize(16).text('Quote Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Name: ${quote.name || 'N/A'}`);
    doc.text(`Calculator Type: ${quote.calculator_type || 'N/A'}`);
    doc.text(`Borrower Type: ${quote.borrower_type || 'N/A'}`);
    if (quote.borrower_type === 'Company') {
      doc.text(`Company Name: ${quote.company_name || 'N/A'}`);
    } else {
      doc.text(`Borrower Name: ${quote.borrower_name || 'N/A'}`);
    }
    doc.text(`Created: ${quote.created_at ? new Date(quote.created_at).toLocaleString() : 'N/A'}`);
    doc.moveDown(1.5);

    // DIP Information Section
    doc.fontSize(16).text('DIP Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Residence Type: ${quote.commercial_or_main_residence || 'N/A'}`);
    doc.text(`DIP Date: ${quote.dip_date ? new Date(quote.dip_date).toLocaleDateString() : 'N/A'}`);
    doc.text(`DIP Expiry Date: ${quote.dip_expiry_date ? new Date(quote.dip_expiry_date).toLocaleDateString() : 'N/A'}`);
    doc.text(`Guarantor Name: ${quote.guarantor_name || 'N/A'}`);
    doc.text(`Lender Legal Fee: ${quote.lender_legal_fee ? `£${quote.lender_legal_fee.toLocaleString()}` : 'N/A'}`);
    doc.text(`Number of Applicants: ${quote.number_of_applicants || 'N/A'}`);
    doc.text(`Overpayments: ${quote.overpayments_percent || '10'}%`);
    doc.text(`Paying Network/Club: ${quote.paying_network_club || 'N/A'}`);
    doc.text(`Fee Type Selection: ${quote.fee_type_selection || 'N/A'}`);
    doc.text(`DIP Status: ${quote.dip_status || 'Not Issued'}`);
    doc.moveDown(1.5);

    // Security Properties Section
    if (quote.security_properties && Array.isArray(quote.security_properties) && quote.security_properties.length > 0) {
      doc.fontSize(16).text('Security Properties', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      quote.security_properties.forEach((prop, index) => {
        doc.text(`Property ${index + 1}:`, { underline: true });
        doc.text(`  Street: ${prop.street || 'N/A'}`);
        doc.text(`  City: ${prop.city || 'N/A'}`);
        doc.text(`  Postcode: ${prop.postcode || 'N/A'}`);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Calculation Details Section
    doc.fontSize(16).text('Calculation Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (quote.calculator_type === 'BTL') {
      doc.text(`Product Scope: ${quote.product_scope || 'N/A'}`);
      doc.text(`Product Type: ${quote.product_type || 'N/A'}`);
      doc.text(`Property Value: ${quote.property_value ? `£${quote.property_value.toLocaleString()}` : 'N/A'}`);
      doc.text(`Monthly Rent: ${quote.monthly_rent ? `£${quote.monthly_rent.toLocaleString()}` : 'N/A'}`);
      doc.text(`Retention: ${quote.retention_choice || 'N/A'}`);
      if (quote.retention_choice === 'Yes') {
        doc.text(`Retention LTV: ${quote.retention_ltv || 'N/A'}%`);
      }
      doc.text(`Target LTV: ${quote.target_ltv || 'N/A'}%`);
      doc.text(`Tier: ${quote.tier || 'N/A'}`);
      doc.text(`Top Slicing: ${quote.top_slicing || 'N/A'}`);
    } else if (quote.calculator_type === 'BRIDGING') {
      doc.text(`Product Scope: ${quote.product_scope || 'N/A'}`);
      doc.text(`Property Value: ${quote.property_value ? `£${quote.property_value.toLocaleString()}` : 'N/A'}`);
      doc.text(`Gross Loan: ${quote.gross_loan ? `£${quote.gross_loan.toLocaleString()}` : 'N/A'}`);
      doc.text(`Bridging Term: ${quote.bridging_loan_term || 'N/A'} months`);
      doc.text(`Charge Type: ${quote.charge_type || 'N/A'}`);
      doc.text(`Sub Product: ${quote.sub_product || 'N/A'}`);
      if (quote.use_specific_net_loan) {
        doc.text(`Specific Net Loan: ${quote.specific_net_loan ? `£${quote.specific_net_loan.toLocaleString()}` : 'N/A'}`);
      }
    }
    
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).text('This is a computer-generated document and does not require a signature.', {
      align: 'center',
      color: 'gray'
    });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

export default router;
