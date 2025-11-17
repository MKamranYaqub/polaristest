import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

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

    // Determine which results table to use
    const isBridge = quote.calculator_type === 'BRIDGING';
    const resultsTable = isBridge ? 'bridge_quote_results' : 'quote_results';

    // Fetch results for this quote
    const { data: resultsData, error: resultsError } = await supabase
      .from(resultsTable)
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });
    
    if (resultsError) {
      console.error('Error fetching quote results:', resultsError);
    }
    
    const results = resultsData || [];

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
  // Funding Line (new field)
  doc.text(`Funding Line: ${quote.funding_line || 'N/A'}`);
    
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
    
    doc.moveDown(1.5);

    // Rate Calculation Results Section
    if (results && results.length > 0) {
      doc.fontSize(16).text('Rate Calculation Results', { underline: true });
      doc.moveDown(0.5);
      
      console.log('DIP PDF - Total results:', results.length);
      console.log('DIP PDF - Fee type selection:', quote.fee_type_selection);
      console.log('DIP PDF - Is Bridge:', isBridge);
      
      // Log all result product names for debugging
      if (results.length > 0) {
        console.log('DIP PDF - Result product names:', results.map(r => r.product_name));
      }
      
      // Filter results by selected fee type if specified
      let displayResults = results;
      
      if (quote.fee_type_selection) {
        console.log('Filtering results by fee type selection');
        
        if (isBridge) {
          // For Bridging: filter by product name (Fusion, Variable Bridge, Fixed Bridge)
          displayResults = results.filter(result => {
            const productName = (result.product_name || '').toString().toLowerCase().trim();
            const selectedType = (quote.fee_type_selection || '').toString().toLowerCase().trim();
            const match = productName === selectedType || productName.includes(selectedType) || selectedType.includes(productName);
            console.log(`Comparing product_name "${result.product_name}" with fee_type_selection "${quote.fee_type_selection}": ${match}`);
            return match;
          });
        } else {
          // For BTL: filter by fee column
          displayResults = results.filter(result => {
            const feeCol = (result.fee_column || '').toString();
            const match = quote.fee_type_selection.includes(feeCol) || quote.fee_type_selection.includes(`${feeCol}%`);
            console.log(`Comparing fee_column "${result.fee_column}" with fee_type_selection "${quote.fee_type_selection}": ${match}`);
            return match;
          });
        }
        
        console.log('Filtered results count:', displayResults.length);
      } else {
        console.log('No fee type selection - showing all results');
      }
      
      if (displayResults.length > 0) {
        displayResults.forEach((result, idx) => {
          // For Bridging, show product name; for BTL, show fee percentage
          const optionLabel = isBridge && result.product_name 
            ? `${result.product_name}` 
            : result.fee_column 
              ? `Fee ${result.fee_column}%` 
              : `Option ${idx + 1}`;
          
          doc.fontSize(13).fillColor('#0176d3').text(`${optionLabel}`, { underline: false });
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
          if (result.direct_debit) doc.text(`  Direct Debit: £${Number(result.direct_debit).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.product_fee_pounds) doc.text(`  Product Fee: £${Number(result.product_fee_pounds).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.admin_fee) doc.text(`  Admin Fee: £${Number(result.admin_fee).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.rolled_months) doc.text(`  Rolled Months: ${result.rolled_months}`);
          if (result.rolled_months_interest) doc.text(`  Rolled Interest: £${Number(result.rolled_months_interest).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.deferred_interest_percent) doc.text(`  Deferred Interest %: ${Number(result.deferred_interest_percent).toFixed(2)}%`);
          if (result.deferred_interest_pounds) doc.text(`  Deferred Interest £: £${Number(result.deferred_interest_pounds).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.serviced_interest) doc.text(`  Serviced Interest: £${Number(result.serviced_interest).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.nbp) doc.text(`  NBP: £${Number(result.nbp).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.exit_fee) doc.text(`  Exit Fee: £${Number(result.exit_fee).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.erc) doc.text(`  ERC: ${result.erc}`);
          if (result.aprc) doc.text(`  APRC: ${Number(result.aprc).toFixed(2)}%`);
          if (result.total_cost_to_borrower) doc.text(`  Total Cost: £${Number(result.total_cost_to_borrower).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.total_loan_term) doc.text(`  Total Term: ${result.total_loan_term} months`);
          if (result.broker_client_fee) doc.text(`  Broker Client Fee: £${Number(result.broker_client_fee).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.broker_commission_proc_fee_pounds) doc.text(`  Broker Commission: £${Number(result.broker_commission_proc_fee_pounds).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          if (result.product_name) doc.text(`  Product: ${result.product_name}`);
          
          doc.moveDown(0.8);
        });
      } else {
        doc.fontSize(11).text('No matching results found for the selected fee type.');
      }
      
      doc.moveDown(1);
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
