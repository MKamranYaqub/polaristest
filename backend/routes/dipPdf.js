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
    // Prevent any caching of generated PDFs
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Pipe PDF to response
    doc.pipe(res);

  // Header
  doc.fontSize(20).text('Decision in Principle (DIP)', { align: 'center' });
  doc.moveDown();
  // Visible layout/version marker to distinguish DIP generator
  doc.fontSize(10).fillColor('gray').text('Layout: DIP Detailed v2', { align: 'center' });
  doc.fillColor('black');
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
          
          // Add page break if this is not the first result and we're running low on space
          if (idx > 0 && doc.y > 650) {
            doc.addPage();
          }
          
          doc.fontSize(13).fillColor('#0176d3').text(`${optionLabel}`, { underline: false });
          doc.fillColor('black');
          doc.fontSize(9);
          doc.moveDown(0.3);
          
          // Helper function to format currency
          const formatCurrency = (value) => {
            if (value === null || value === undefined) return '—';
            return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          };
          
          // Helper function to format percentage
          const formatPercent = (value, decimals = 2) => {
            if (value === null || value === undefined) return '—';
            return `${Number(value).toFixed(decimals)}%`;
          };
          
          // Helper function to format number
          const formatNumber = (value, decimals = 2) => {
            if (value === null || value === undefined) return '—';
            return Number(value).toFixed(decimals);
          };
          
          // Display ALL financial details in organized sections
          
          // Loan Amounts Section
          doc.fontSize(10).fillColor('#555555').text('Loan Details:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.gross_loan !== undefined) doc.text(`  Gross Loan: ${formatCurrency(result.gross_loan)}`);
          if (result.net_loan !== undefined) doc.text(`  Net Loan: ${formatCurrency(result.net_loan)}`);
          if (result.property_value !== undefined) doc.text(`  Property Value: ${formatCurrency(result.property_value)}`);
          if (result.ltv_percentage !== undefined) doc.text(`  LTV: ${formatPercent(result.ltv_percentage)}`);
          if (result.net_ltv !== undefined) doc.text(`  Net LTV: ${formatPercent(result.net_ltv)}`);
          if (result.icr !== undefined) doc.text(`  ICR: ${formatPercent(result.icr)}`);
          doc.moveDown(0.3);
          
          // Rates Section
          doc.fontSize(10).fillColor('#555555').text('Interest Rates:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.initial_rate !== undefined) doc.text(`  Initial Rate: ${formatPercent(result.initial_rate)}`);
          if (result.pay_rate !== undefined) doc.text(`  Pay Rate: ${formatPercent(result.pay_rate)}`);
          if (result.revert_rate !== undefined) doc.text(`  Revert Rate: ${formatPercent(result.revert_rate)}`);
          if (result.revert_rate_dd !== undefined) doc.text(`  Revert Rate DD: ${formatPercent(result.revert_rate_dd)}`);
          if (result.full_rate !== undefined) doc.text(`  Full Rate: ${result.full_rate}`);
          if (result.aprc !== undefined) doc.text(`  APRC: ${formatPercent(result.aprc)}`);
          if (result.deferred_rate !== undefined) doc.text(`  Deferred Rate: ${formatPercent(result.deferred_rate)}`);
          doc.moveDown(0.3);
          
          // Fees Section
          doc.fontSize(10).fillColor('#555555').text('Fees:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.product_fee_percent !== undefined) doc.text(`  Product Fee %: ${formatPercent(result.product_fee_percent)}`);
          if (result.product_fee_pounds !== undefined) doc.text(`  Product Fee £: ${formatCurrency(result.product_fee_pounds)}`);
          if (result.admin_fee !== undefined) doc.text(`  Admin Fee: ${formatCurrency(result.admin_fee)}`);
          if (result.broker_client_fee !== undefined) doc.text(`  Broker Client Fee: ${formatCurrency(result.broker_client_fee)}`);
          if (result.broker_commission_proc_fee_percent !== undefined) doc.text(`  Broker Commission %: ${formatPercent(result.broker_commission_proc_fee_percent)}`);
          if (result.broker_commission_proc_fee_pounds !== undefined) doc.text(`  Broker Commission £: ${formatCurrency(result.broker_commission_proc_fee_pounds)}`);
          if (result.commitment_fee_pounds !== undefined) doc.text(`  Commitment Fee: ${formatCurrency(result.commitment_fee_pounds)}`);
          if (result.exit_fee !== undefined) doc.text(`  Exit Fee: ${formatCurrency(result.exit_fee)}`);
          if (result.title_insurance_cost !== undefined) doc.text(`  Title Insurance Cost: ${formatCurrency(result.title_insurance_cost)}`);
          doc.moveDown(0.3);
          
          // Interest Calculations Section
          doc.fontSize(10).fillColor('#555555').text('Interest Calculations:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.monthly_interest_cost !== undefined) doc.text(`  Monthly Interest Cost: ${formatCurrency(result.monthly_interest_cost)}`);
          if (result.rolled_months !== undefined) doc.text(`  Rolled Months: ${formatNumber(result.rolled_months, 0)} months`);
          if (result.rolled_months_interest !== undefined) doc.text(`  Rolled Months Interest: ${formatCurrency(result.rolled_months_interest)}`);
          if (result.deferred_interest_percent !== undefined) doc.text(`  Deferred Interest %: ${formatPercent(result.deferred_interest_percent)}`);
          if (result.deferred_interest_pounds !== undefined) doc.text(`  Deferred Interest £: ${formatCurrency(result.deferred_interest_pounds)}`);
          if (result.serviced_interest !== undefined) doc.text(`  Serviced Interest: ${formatCurrency(result.serviced_interest)}`);
          doc.moveDown(0.3);
          
          // Other Details Section
          doc.fontSize(10).fillColor('#555555').text('Other Details:', { underline: true });
          doc.fillColor('black').fontSize(9);
          if (result.direct_debit !== undefined && result.direct_debit !== null) doc.text(`  Direct Debit: ${formatCurrency(result.direct_debit)}`);
          if (result.erc !== undefined && result.erc !== null) doc.text(`  ERC: ${result.erc}`);
          if (result.erc_fusion_only !== undefined && result.erc_fusion_only !== null) doc.text(`  ERC (Fusion Only): ${result.erc_fusion_only}`);
          if (result.rent !== undefined) doc.text(`  Rent: ${formatCurrency(result.rent)}`);
          if (result.top_slicing !== undefined) doc.text(`  Top Slicing: ${formatCurrency(result.top_slicing)}`);
          if (result.nbp !== undefined) doc.text(`  NBP: ${formatCurrency(result.nbp)}`);
          if (result.total_cost_to_borrower !== undefined) doc.text(`  Total Cost to Borrower: ${formatCurrency(result.total_cost_to_borrower)}`);
          if (result.total_loan_term !== undefined) doc.text(`  Total Loan Term: ${formatNumber(result.total_loan_term, 0)} months`);
          if (result.product_name) doc.text(`  Product: ${result.product_name}`);
          
          doc.moveDown(1);
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
