import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlQuoteStyles } from './shared/BTLQuoteStyles';
import PDFFooter from './shared/PDFFooter';
import { PDF_COLORS } from './shared/pdfColorConstants';
import * as h from './utils/bridgingQuoteHelpers';

// Logo path from public folder
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

// Fixed header styles for every page
const fixedHeaderStyles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 15,
    right: 40,
    width: 80,
    height: 32,
    zIndex: 10,
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
});

/**
 * Bridging Quote PDF - Shows indicative quote with three product columns
 * Columns: Fusion | Fixed Bridge | Variable Bridge
 */
const BridgingQuotePDF = ({ quote, brokerSettings = {}, clientDetails = {} }) => {
  // Get all results
  const allResults = quote.results || [];
  
  // Debug: Log results to help diagnose issues
  console.log('BridgingQuotePDF - Total results:', allResults.length);
  if (allResults.length > 0) {
    console.log('BridgingQuotePDF - Sample result:', {
      product_name: allResults[0].product_name,
      product_type: allResults[0].product_type,
      type: allResults[0].type,
      product: allResults[0].product,
    });
  }
  
  // Get available product types and filter results
  const productTypes = h.getProductTypes(allResults);
  console.log('BridgingQuotePDF - Detected product types:', productTypes);
  
  // Check if specific product types are selected from Issue Quote modal
  // The database field is quote_selected_fee_ranges (stores selected products like ["Fusion", "Fixed Bridge"])
  const selectedProductTypes = quote.quote_selected_fee_ranges || [];
  console.log('BridgingQuotePDF - Selected product types:', selectedProductTypes);
  
  // Use selected product types if provided, otherwise use all available
  let displayProductTypes;
  if (selectedProductTypes.length > 0) {
    // Filter selected types to only those that exist in results
    const filteredTypes = selectedProductTypes.filter(type => productTypes.includes(type));
    // If all available products are selected (or selected types match available), show all
    if (filteredTypes.length === productTypes.length || selectedProductTypes.length >= 3) {
      displayProductTypes = productTypes;
    } else {
      displayProductTypes = filteredTypes;
    }
  } else {
    displayProductTypes = productTypes;
  }
  
  // If no product types detected but we have results, show them anyway with generic labels
  let useDirectProductNames = false;
  if (displayProductTypes.length === 0 && allResults.length > 0) {
    console.warn('BridgingQuotePDF - No product types detected, showing all results');
    // Group results by unique product names or just show all
    const uniqueProducts = [...new Set(allResults.map(r => r.product_name || r.product || 'Product'))];
    displayProductTypes = uniqueProducts.slice(0, 3); // Max 3 columns
    useDirectProductNames = true;
  }
  
  // Helper function to get result for a column
  const getResultForColumn = (productType) => {
    if (useDirectProductNames) {
      // Direct match on product name
      return allResults.find(r => 
        (r.product_name || r.product || '') === productType
      ) || allResults[0]; // Fallback to first result
    } else {
      // Use the helper function for categorized types
      return h.getBestResultForProductType(allResults, productType);
    }
  };
  
  // If still no results, show error message
  if (displayProductTypes.length === 0 || allResults.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={{ fontSize: 12, marginTop: 100 }}>No results available for quote generation.</Text>
          <Text style={{ fontSize: 10, marginTop: 20, color: '#666' }}>
            Quote ID: {quote.id || 'N/A'}
          </Text>
          <Text style={{ fontSize: 10, marginTop: 10, color: '#666' }}>
            Results found: {allResults.length}
          </Text>
        </Page>
      </Document>
    );
  }
  
  // Calculate column widths based on number of columns
  const numColumns = displayProductTypes.length;
  const labelWidth = '22%';
  const valueWidth = `${(78 / numColumns).toFixed(2)}%`;

  // Quote metadata
  const quoteReference = quote.reference_number || quote.id || 'N/A';
  const clientName = h.getClientName(quote, brokerSettings);
  const brokerCompany = h.getBrokerCompany(brokerSettings);
  const brokerName = h.getBrokerName(brokerSettings);
  const brokerPhone = h.getBrokerPhone(brokerSettings);
  const brokerEmail = h.getBrokerEmail(brokerSettings);

  // Quote summary info
  const quoteType = h.getQuoteType(quote);
  const propertyValue = h.getPropertyValue(quote);
  const requestedAmount = h.getRequestedAmount(quote);
  const bridgingTerm = h.getBridgingTerm(quote);
  const chargeType = h.getChargeType(quote);
  const version = h.getVersion(quote);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo - appears on ALL pages */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Header */}
        <View style={btlQuoteStyles.headerRow}>
          <Text style={btlQuoteStyles.headerTitle}>Bridging Finance - Indicative Quote</Text>
          <Text style={{ fontSize: 10, color: 'var(--token-text-muted)' }}>Reference: {quoteReference}</Text>
        </View>

        {/* Summary Grid */}
        <View style={btlQuoteStyles.summaryGrid}>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Client Name</Text>
            <Text style={btlQuoteStyles.summaryValue}>{clientName}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Quote Type</Text>
            <Text style={btlQuoteStyles.summaryValue}>{quoteType}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Property Value</Text>
            <Text style={btlQuoteStyles.summaryValue}>{propertyValue}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Monthly Rent</Text>
            <Text style={btlQuoteStyles.summaryValue}>{h.getMonthlyRent(quote)}</Text>
          </View>
        </View>

        <View style={btlQuoteStyles.summaryGrid}>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Requested Amount</Text>
            <Text style={btlQuoteStyles.summaryValue}>{requestedAmount}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Loan Term</Text>
            <Text style={btlQuoteStyles.summaryValue}>{bridgingTerm}</Text>
          </View>
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Charge Type</Text>
            <Text style={btlQuoteStyles.summaryValue}>{chargeType}</Text>
          </View>
          {chargeType.includes('2nd') && (
            <View style={btlQuoteStyles.summaryColumn}>
              <Text style={btlQuoteStyles.summaryLabel}>First Charge Value</Text>
              <Text style={btlQuoteStyles.summaryValue}>{h.formatCurrency(quote.first_charge_value || 0)}</Text>
            </View>
          )}
          <View style={btlQuoteStyles.summaryColumn}>
            <Text style={btlQuoteStyles.summaryLabel}>Version</Text>
            <Text style={btlQuoteStyles.summaryValue}>{version}</Text>
          </View>
        </View>

        {/* Results Table */}
        <View style={btlQuoteStyles.resultsTable}>
          {/* Table Header with Colored Columns */}
          <View style={btlQuoteStyles.tableHeaderRow}>
            <Text style={[btlQuoteStyles.tableHeaderCell, { width: labelWidth, textAlign: 'left', backgroundColor: PDF_COLORS.bgMedium }]}>
              
            </Text>
            {displayProductTypes.map((productType, index) => {
              // Define colors for each column matching calculator: Navy, Navy 500, Orange
              const columnColors = [PDF_COLORS.columnNavy, PDF_COLORS.columnNavy500, PDF_COLORS.columnOrange];
              const bgColor = columnColors[index] || '#002855';
              return (
                <Text key={index} style={[btlQuoteStyles.tableHeaderCell, { width: valueWidth, backgroundColor: bgColor, color: PDF_COLORS.textWhite }]}>
                  {productType}
                </Text>
              );
            })}
          </View>

          {/* Initial Rate - with BBR suffix and (pa)/(pm) indicator */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Initial Rate</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValueHighlight, { width: valueWidth }]}>
                  {result ? h.getInitialRateFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Pay Rate - Only visible if Fusion is in the quote */}
          {displayProductTypes.includes('Fusion') && (
            <View style={btlQuoteStyles.tableRow}>
              <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Pay Rate</Text>
              {displayProductTypes.map((productType, index) => {
                const result = getResultForColumn(productType);
                return (
                  <Text key={index} style={[btlQuoteStyles.tableCellValueHighlight, { width: valueWidth }]}>
                    {result ? h.getPayRateFormatted(result) : 'N/A'}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Section: Loan Details */}
          <View style={btlQuoteStyles.tableRowSectionHeader}>
            <Text style={[btlQuoteStyles.tableCellLabel, { fontWeight: 'bold', width: labelWidth }]}>Loan Details</Text>
            {displayProductTypes.map((_, index) => (
              <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}></Text>
            ))}
          </View>

          {/* Gross Loan with LTV */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Gross Loan</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getGrossLoanWithLTV(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Net Loan with LTV */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Net Loan</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getNetLoanWithLTV(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Arrangement Fee with % */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Arrangement Fee</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              const amount = result ? h.getProductFeeAmount(result) : 0;
              const percent = result ? h.getProductFeePercent(result) : 0;
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? `${h.formatCurrency(amount)} (${percent}%)` : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Total Loan Term */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Total Loan Term</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              const term = result ? h.getTerm(result) : 0;
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {term} {term === 1 ? 'Month' : 'Months'}
                </Text>
              );
            })}
          </View>

          {/* Rolled Months Interest */}
          <View style={btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Rolled Months Interest</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getRolledInterestFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Monthly Payment */}
          <View style={btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Monthly Payment</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getMonthlyPaymentFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Deferred Interest - Only visible if Fusion is in the quote */}
          {displayProductTypes.includes('Fusion') && (
            <View style={btlQuoteStyles.tableRow}>
              <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Deferred Interest</Text>
              {displayProductTypes.map((productType, index) => {
                const result = getResultForColumn(productType);
                return (
                  <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                    {result ? h.getDeferredInterestFormatted(result) : 'N/A'}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Min Interest Period */}
          <View style={displayProductTypes.includes('Fusion') ? btlQuoteStyles.tableRowAlt : btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Min Interest Period</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getMinInterestPeriod(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* ERC/Exit Fee */}
          <View style={displayProductTypes.includes('Fusion') ? btlQuoteStyles.tableRow : btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>ERC/Exit Fee</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getERCExitFeeFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Proc Fee */}
          <View style={displayProductTypes.includes('Fusion') ? btlQuoteStyles.tableRowAlt : btlQuoteStyles.tableRow}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Proc Fee</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getProcFeeFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Broker Client Fee */}
          <View style={displayProductTypes.includes('Fusion') ? btlQuoteStyles.tableRow : btlQuoteStyles.tableRowAlt}>
            <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Broker Client Fee</Text>
            {displayProductTypes.map((productType, index) => {
              const result = getResultForColumn(productType);
              return (
                <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                  {result ? h.getBrokerClientFeeFormatted(result) : 'N/A'}
                </Text>
              );
            })}
          </View>

          {/* Title Insurance - Only shown if quote_include_title_insurance is explicitly true */}
          {(quote.quote_include_title_insurance === true || quote.quote_include_title_insurance === 'true') && (
            <View style={btlQuoteStyles.tableRowAlt}>
              <Text style={[btlQuoteStyles.tableCellLabel, { width: labelWidth }]}>Title Insurance</Text>
              {displayProductTypes.map((productType, index) => {
                const result = getResultForColumn(productType);
                const titleInsurance = result ? h.getTitleInsuranceCost(result) : 0;
                const grossLoan = result ? h.getGrossLoan(result) : 0;
                // Title Insurance only available for loans up to £3 million
                const isEligible = grossLoan <= 3000000;
                return (
                  <Text key={index} style={[btlQuoteStyles.tableCellValue, { width: valueWidth }]}>
                    {!isEligible ? 'Not eligible' : titleInsurance > 0 ? h.formatCurrencyWithPence(titleInsurance) : 'N/A'}
                  </Text>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 15 }}>
          {/* Left Column: Terms Section */}
          <View style={{ flex: 1 }}>
            <Text style={btlQuoteStyles.termsTitle}>Terms</Text>
            {/* Terms table with Label, Value, Description columns */}
            <View style={{ marginTop: 4 }}>
              {/* Commitment Fee Row */}
              <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0', paddingVertical: 3 }}>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>Commitment Fee</Text>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>
                  {(() => {
                    const firstResult = getResultForColumn(displayProductTypes[0]);
                    const fee = h.getCommitmentFee(firstResult);
                    return fee > 0 ? h.formatCurrency(fee) : '£0';
                  })()}
                </Text>
                <Text style={{ fontSize: 8, width: '50%', color: '#666' }}>Payable when DIP signed, refundable on completion</Text>
              </View>
              {/* Valuation Fee Row */}
              <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0', paddingVertical: 3 }}>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>Valuation Fee</Text>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>TBC by the Underwriter</Text>
                <Text style={{ fontSize: 8, width: '50%', color: '#666' }}>Payable when DIP is signed</Text>
              </View>
              {/* Lender Legal Fee Row */}
              <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0', paddingVertical: 3 }}>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>Lender Legal Fee</Text>
                <Text style={{ fontSize: 8, width: '25%', color: '#333' }}>TBC by the Underwriter</Text>
                <Text style={{ fontSize: 8, width: '50%', color: '#666' }}>Excludes the borrower's own legal cost</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Broker/Client Details */}
          <View style={{ flex: 1 }}>
            <View style={btlQuoteStyles.brokerDetailsBox}>
              <Text style={btlQuoteStyles.brokerDetailsTitle}>
                {((clientDetails?.clientType || quote?.client_type) === 'Direct') ? 'Client details' : 'Broker details'}
              </Text>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Name</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientName(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Company</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientCompany(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Email</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientEmail(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Telephone</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientTelephone(clientDetails, quote)}</Text>
              </View>
              <View style={btlQuoteStyles.brokerDetailsRow}>
                <Text style={btlQuoteStyles.brokerDetailsLabel}>Route</Text>
                <Text style={btlQuoteStyles.brokerDetailsValue}>{h.getClientRoute(clientDetails, quote)}</Text>
              </View>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* Page 2: DIP Packaging List */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo in top right (same as page 1) */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image src={MFS_LOGO_PATH} style={fixedHeaderStyles.logo} />
        </View>
        
        {/* Header with Packaging List */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderBottom: '1px solid #c9c9c9'
        }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: 'var(--token-color-brand-navy)' }}>
            Packaging List
          </Text>
          <View style={{ width: 80, height: 32 }} />
        </View>
        
        <View style={{ padding: '20px 40px' }}>
          {/* Product Type and Date Section */}
          <View style={{ 
            backgroundColor: PDF_COLORS.columnOrangeDark, 
            padding: '8px 16px', 
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: PDF_COLORS.textWhite }}>
              Bridging/Fusion – {quote.property_type || 'Residential'}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--token-color-white)' }}>
              {new Date(quote.created_at || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {/* Introduction Text */}
          <Text style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
            The following list comprises the standard information required for initial credit screening and approval to issue a DIP. Note that further information will be requested during the underwriting process, depending on the nature of the transaction, specific circumstances of the borrower and the type of property.
          </Text>

          {/* DIP List Header */}
          <View style={{ 
            backgroundColor: PDF_COLORS.columnNavyDark, 
            padding: '8px 12px', 
            marginBottom: 10
          }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: PDF_COLORS.textWhite, textAlign: 'center' }}>
              DIP List
            </Text>
          </View>

          {/* DIP List Items */}
          <View style={{ border: '1px solid var(--token-border-medium)', padding: 12 }}>
            {[
              {
                label: 'Property address and description:',
                value: 'details of the property or properties offered as security'
              },
              {
                label: 'Borrower name and nationality / jurisdiction:',
                value: 'list all individual borrowers or shareholders of corporate borrowers'
              },
              {
                label: 'Occupation and experience of key individual/s:',
                value: 'list occupation that provides the main source of income and detail experience relevant to managing the security property/ies'
              },
              {
                label: 'Annual income:',
                value: 'total annual income from employment including any salary, dividends, benefits, rental, pensions, investments etc'
              },
              {
                label: 'Asset and Liability Statement for any individual Borrowers, Shareholders or Guarantors:',
                value: 'include value of all assets owned in company or personal names along with any outstanding debts'
              },
              {
                label: 'Residential address of key individual/s:',
                value: 'address of main residence for any individual borrowers or shareholders > 25%'
              },
              {
                label: 'Details of any adverse credit:',
                value: 'list all overdue payments and credit provider (to be cleared on or before completion)'
              },
              {
                label: 'Loan Purpose:',
                value: 'what will the loan proceeds be used for? e.g. purchase, refinance, debt consolidation, equity release, refurbishment works'
              },
              {
                label: 'Agreed purchase price (if purchase):',
                value: 'price to be paid and declared on HM Land Registry'
              },
              {
                label: 'Details of outstanding charges and loan balances (if refinance or 2nd charge):',
                value: 'amount of outstanding loan/s and lender name/s'
              },
              {
                label: 'Breakdown of use of funds:',
                value: 'detail how the net loan balance will be used (including cost estimate for any proposed works)'
              },
              {
                label: 'Proposed exit strategy / source of repayment:',
                value: 'how will the loan be repaid? E.g. sale, refinance or liquidity event'
              },
              {
                label: 'Additional information:',
                value: 'any further information relevant to the transaction, property, or borrower'
              }
            ].map((item, index) => (
              <View key={index} style={{ 
                flexDirection: 'row', 
                marginBottom: 8,
                paddingLeft: 8
              }}>
                <Text style={{ fontSize: 10, width: 15, marginRight: 6 }}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: 700 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 9, color: 'var(--token-text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default BridgingQuotePDF;


