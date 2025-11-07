import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Generate Quote PDF (different from DIP PDF - shows multiple fee ranges)
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the quote from either table
    let quote = null;
    let isBridge = false;
    let { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      quote = data;
      isBridge = false;
    } else {
      // Try bridge_quotes
      const { data: bdata, error: berr } = await supabase.from('bridge_quotes').select('*').eq('id', id).single();
      if (berr) {
        if (berr.code === 'PGRST116') return res.status(404).json({ error: 'Quote not found' });
        throw berr;
      }
      quote = bdata;
      isBridge = true;
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Fetch results from the corresponding results table
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });
    
    if (resultsError) {
      console.error('Error fetching quote results:', resultsError);
    }
    
    console.log(`Fetching from ${resultsTable} for quote_id ${id}`);
    console.log(`Found ${resultsData?.length || 0} results`);
    if (resultsData && resultsData.length > 0) {
      console.log('First result:', JSON.stringify(resultsData[0], null, 2));
    }
    
    // Attach results to quote object
    quote.results = resultsData || [];

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Quote_${quote.reference_number || id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Mortgage Quote', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Reference Number: ${quote.reference_number || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Borrower Information
    if (quote.quote_borrower_name) {
      doc.fontSize(16).text('Borrower Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Name: ${quote.quote_borrower_name}`);
      doc.moveDown(1);
    }

    // Quote Information Section
    doc.fontSize(16).text('Quote Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (quote.calculator_type) doc.text(`Calculator Type: ${quote.calculator_type}`);
    if (quote.product_scope) doc.text(`Product Scope: ${quote.product_scope}`);
    if (quote.product_type) doc.text(`Product Type: ${quote.product_type}`);
    if (quote.selected_range) doc.text(`Product Range: ${quote.selected_range === 'specialist' ? 'Specialist' : 'Core'}`);
    
    // Retention information
    if (quote.retention_choice) {
      doc.text(`Retention: ${quote.retention_choice}`);
      if (quote.retention_choice !== 'No' && quote.retention_ltv) {
        doc.text(`Retention LTV: ${quote.retention_ltv}%`);
      }
    }
    
    doc.moveDown(1);

    // Loan Details Section
    doc.fontSize(16).text('Loan Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (quote.property_value) doc.text(`Property Value: £${Number(quote.property_value).toLocaleString('en-GB')}`);
    if (quote.monthly_rent) doc.text(`Monthly Rent: £${Number(quote.monthly_rent).toLocaleString('en-GB')}`);
    
    // BTL specific fields
    if (quote.calculator_type === 'BTL') {
      if (quote.loan_calculation_requested) doc.text(`Loan Type: ${quote.loan_calculation_requested}`);
      if (quote.specific_gross_loan) doc.text(`Specific Gross Loan: £${Number(quote.specific_gross_loan).toLocaleString('en-GB')}`);
      if (quote.specific_net_loan) doc.text(`Specific Net Loan: £${Number(quote.specific_net_loan).toLocaleString('en-GB')}`);
      if (quote.target_ltv) doc.text(`Target LTV: ${quote.target_ltv}%`);
      if (quote.top_slicing) doc.text(`Top Slicing: £${Number(quote.top_slicing).toLocaleString('en-GB')}`);
    }
    
    // Bridging specific fields
    if (quote.calculator_type === 'BRIDGING') {
      if (quote.gross_loan) doc.text(`Gross Loan: £${Number(quote.gross_loan).toLocaleString('en-GB')}`);
      if (quote.use_specific_net_loan !== undefined) doc.text(`Use Specific Net Loan: ${quote.use_specific_net_loan ? 'Yes' : 'No'}`);
      if (quote.specific_net_loan) doc.text(`Specific Net Loan: £${Number(quote.specific_net_loan).toLocaleString('en-GB')}`);
      if (quote.bridging_loan_term) doc.text(`Bridging Term: ${quote.bridging_loan_term} months`);
      if (quote.charge_type) doc.text(`Charge Type: ${quote.charge_type}`);
      if (quote.sub_product) doc.text(`Sub Product: ${quote.sub_product}`);
      if (quote.top_slicing) doc.text(`Top Slicing: £${Number(quote.top_slicing).toLocaleString('en-GB')}`);
    }
    
    doc.moveDown(1);

    // Additional Fees Section
    if (quote.add_fees_toggle) {
      doc.fontSize(16).text('Additional Fees', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      if (quote.fee_calculation_type) {
        doc.text(`Fee Type: ${quote.fee_calculation_type === 'pound' ? 'Fixed Amount (£)' : 'Percentage (%)'}`);
      }
      if (quote.additional_fee_amount) {
        const feeDisplay = quote.fee_calculation_type === 'pound' 
          ? `£${Number(quote.additional_fee_amount).toLocaleString('en-GB')}`
          : `${quote.additional_fee_amount}%`;
        doc.text(`Additional Fee: ${feeDisplay}`);
      }
      
      doc.moveDown(1);
    }

    // Criteria Questions and Answers
    if (quote.criteria_answers) {
      try {
        const answers = typeof quote.criteria_answers === 'string' 
          ? JSON.parse(quote.criteria_answers) 
          : quote.criteria_answers;
        
        if (answers && Object.keys(answers).length > 0) {
          doc.fontSize(16).text('Criteria Answers', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11);
          
          Object.entries(answers).forEach(([key, value]) => {
            if (value && value.label) {
              // Format the question key to be more readable
              const questionLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              doc.text(`${questionLabel}: ${value.label}`, {
                width: 500,
                align: 'left'
              });
            }
          });
          
          doc.moveDown(1);
        }
      } catch (e) {
        console.error('Error parsing criteria_answers:', e);
      }
    }
    
    doc.moveDown(0.5);

    // Selected Fee Ranges
    if (quote.quote_selected_fee_ranges && Array.isArray(quote.quote_selected_fee_ranges) && quote.quote_selected_fee_ranges.length > 0) {
      doc.fontSize(16).text('Selected Fee Options', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      quote.quote_selected_fee_ranges.forEach((feeRange, index) => {
        doc.text(`${index + 1}. ${feeRange}`);
      });
      
      doc.moveDown(1.5);
    }

    // Rate Calculation Details for Selected Fee Ranges
    if (quote.results && Array.isArray(quote.results) && quote.results.length > 0 && 
        quote.quote_selected_fee_ranges && Array.isArray(quote.quote_selected_fee_ranges)) {
      
      console.log('Selected fee ranges:', quote.quote_selected_fee_ranges);
      console.log('Total results available:', quote.results.length);
      
      doc.fontSize(16).text('Rate Details', { underline: true });
      doc.moveDown(0.5);
      
      // Filter results to only show selected fee ranges
      const selectedResults = quote.results.filter(result => {
        if (!result.fee_column) {
          console.log('Skipping result with no fee_column');
          return false;
        }
        const matches = quote.quote_selected_fee_ranges.some(selectedFee => {
          // Match fee ranges like "2%", "2.00", "Fee: 2%", etc.
          const feeValue = result.fee_column.toString();
          const match = selectedFee.includes(feeValue) || selectedFee.includes(`${feeValue}%`);
          console.log(`Comparing "${selectedFee}" with fee_column "${feeValue}": ${match}`);
          return match;
        });
        return matches;
      });
      
      console.log('Filtered results:', selectedResults.length);
      
      if (selectedResults.length > 0) {
        selectedResults.forEach((result, idx) => {
          console.log(`Rendering result ${idx + 1}:`, {
            fee_column: result.fee_column,
            gross_loan: result.gross_loan,
            net_loan: result.net_loan,
            ltv_percentage: result.ltv_percentage,
            initial_rate: result.initial_rate
          });
          
          doc.fontSize(13).fillColor('#0176d3').text(`Option ${idx + 1}: Fee ${result.fee_column}%`, { underline: false });
          doc.fillColor('black');
          doc.fontSize(10);
          doc.moveDown(0.3);
          
          // Display key financial details
          if (result.gross_loan) doc.text(`  Gross Loan: £${Number(result.gross_loan).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.net_loan) doc.text(`  Net Loan: £${Number(result.net_loan).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.ltv_percentage) doc.text(`  LTV: ${Number(result.ltv_percentage).toFixed(2)}%`);
          if (result.net_ltv) doc.text(`  Net LTV: ${Number(result.net_ltv).toFixed(2)}%`);
          if (result.initial_rate) doc.text(`  Initial Rate: ${Number(result.initial_rate).toFixed(2)}%`);
          if (result.pay_rate) doc.text(`  Pay Rate: ${Number(result.pay_rate).toFixed(2)}%`);
          if (result.icr) doc.text(`  ICR: ${Number(result.icr).toFixed(2)}%`);
          if (result.monthly_interest_cost) doc.text(`  Monthly Interest: £${Number(result.monthly_interest_cost).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.product_name) doc.text(`  Product: ${result.product_name}`);
          
          doc.moveDown(0.8);
        });
        doc.moveDown(0.5);
      }
    }

    // Assumptions
    if (quote.quote_assumptions && Array.isArray(quote.quote_assumptions) && quote.quote_assumptions.length > 0) {
      doc.fontSize(16).text('Assumptions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      
      quote.quote_assumptions.forEach((assumption, index) => {
        // Wrap long text
        doc.text(`${index + 1}. ${assumption}`, {
          width: 500,
          align: 'left'
        });
        doc.moveDown(0.3);
      });
      
      doc.moveDown(1);
    }

    // Additional Notes
    if (quote.quote_additional_notes) {
      doc.fontSize(16).text('Additional Notes', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(quote.quote_additional_notes, {
        width: 500,
        align: 'left'
      });
      doc.moveDown(1.5);
    }

    // Footer
    doc.fontSize(9);
    doc.text(`Quote generated on: ${new Date().toLocaleDateString()}`, {
      align: 'center'
    });
    
    if (quote.quote_issued_at) {
      doc.text(`Quote issued on: ${new Date(quote.quote_issued_at).toLocaleDateString()}`, {
        align: 'center'
      });
    }

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating quote PDF:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message ?? String(err) });
    }
  }
});

export default router;
