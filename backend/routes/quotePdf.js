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
    if (quote.property_value) doc.text(`Property Value: £${Number(quote.property_value).toLocaleString()}`);
    if (quote.loan_amount) doc.text(`Loan Amount: £${Number(quote.loan_amount).toLocaleString()}`);
    if (quote.target_ltv) doc.text(`LTV: ${quote.target_ltv}%`);
    if (quote.product_type) doc.text(`Product Type: ${quote.product_type}`);
    if (quote.product_scope) doc.text(`Product Scope: ${quote.product_scope}`);
    if (quote.retention_choice) doc.text(`Retention: ${quote.retention_choice}`);
    
    doc.moveDown(1.5);

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
