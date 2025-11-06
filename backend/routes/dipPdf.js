import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Generate PDF for a quote with DIP data
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
    
    // Add Product Range if available (BTL only)
    if (quote.calculator_type === 'BTL' && quote.product_range) {
      doc.text(`Product Range: ${quote.product_range.charAt(0).toUpperCase() + quote.product_range.slice(1)}`);
    }
    
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
    console.error('Error generating DIP PDF:', err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

export default router;
