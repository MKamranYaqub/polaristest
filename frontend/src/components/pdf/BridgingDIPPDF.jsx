import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlDipStyles } from './shared/BTLDIPStyles';
import PDFFooter from './shared/PDFFooter';
import * as BridgingDIPHelpers from './utils/bridgingDipHelpers';

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
 * Bridging DIP PDF - Matches BTL DIP format
 *
 * Conditional scenarios implemented:
 * - Product Type: Fusion vs Fixed Bridge vs Variable Bridge
 * - Property Type: Residential vs Commercial vs Semi-Commercial declarations
 * - Rolled Months: Show/hide based on whether interest is rolled
 * - Retention: Show/hide based on retention facility
 * - Number of Applicants: 1-4 signature blocks
 * - Exit Strategy: Checkboxes for borrower confirmation
 */
const BridgingDIPPDF = ({ quote, dipData, brokerSettings = {} }) => {
  // Extract all values using helpers
  const h = BridgingDIPHelpers;

  const borrowerName = h.getBorrowerName(quote, dipData, brokerSettings);
  const securityAddress = h.getSecurityAddress(dipData);
  const dipDate = h.formatDateLong(dipData.dip_date);
  const dipExpiryDate = h.formatDateLong(dipData.dip_expiry_date);

  // Loan details
  const grossLoan = h.getGrossLoan(quote);
  const netLoan = h.getNetLoan(quote);
  const propertyValue = h.getPropertyValue(quote);
  const productFeePercent = h.getProductFeePercent(quote);
  const productFeeAmount = h.getProductFeeAmount(quote);
  const ltv = h.getLTV(quote);

  // Product and term
  const productName = h.getProductName(quote);
  const isFusion = h.isFusion(quote);
  const bridgingTerm = h.getBridgingTerm(quote);
  const chargeType = h.getChargeType(quote);

  // Rate information
  const interestRate = h.getInterestRate(quote);
  const monthlyInterestCost = h.getMonthlyInterestCost(quote);

  // Interest handling
  const hasRolledMonths = h.hasRolledMonths(quote);
  const rolledMonths = h.getRolledMonths(quote);
  const rolledInterestAmount = h.getRolledInterestAmount(quote);

  // Retention
  const hasRetention = h.hasRetention(quote);
  const retentionAmount = h.getRetentionAmount(quote);

  // Fees
  const adminFee = h.getAdminFee(quote, dipData);
  const valuationFee = h.getValuationFee(quote, dipData);
  const legalFees = h.getLegalFees(quote, dipData);
  const exitFee = h.getExitFee(quote);
  const hasBrokerFees = h.hasBrokerFees(brokerSettings);
  const brokerCommission = h.getBrokerCommission(quote, brokerSettings);
  const brokerClientFee = h.getBrokerClientFee(quote, brokerSettings);

  // Property type for declarations
  const propertyType = h.getPropertyType(quote, dipData);
  const isCommercial = propertyType.toLowerCase().includes('commercial') && !propertyType.toLowerCase().includes('semi');
  const isSemiCommercial = propertyType.toLowerCase().includes('semi');
  const isResidential = !isCommercial && !isSemiCommercial;

  // Number of applicants for signature blocks
  const numApplicants = h.getNumberOfApplicants(dipData);

  // Title insurance
  const hasTitleInsurance = h.hasTitleInsurance(quote, dipData);
  const titleInsuranceCost = h.getTitleInsuranceCost(quote);

  // Minimum term for ERC
  const minimumTerm = h.getMinimumTerm(quote);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo - appears on ALL pages */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Date - Compact header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 5, borderBottom: '1pt solid #dddbda' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000000' }}>Decision in Principle - Bridging Finance</Text>
          <Text style={{ fontSize: 9, color: '#706e6b' }}>{dipDate}</Text>
        </View>

        {/* Proposed Loan To */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Proposed Loan to:</Text>
          <Text style={btlDipStyles.summaryValue}>{borrowerName}</Text>
        </View>

        {/* Security Property */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security Property:</Text>
          <Text style={btlDipStyles.summaryValue}>{securityAddress}</Text>
        </View>

        {/* Introduction Text */}
        <View style={btlDipStyles.introSection}>
          <Text style={btlDipStyles.introText}>
            We Market Financial Solutions Limited (hereinafter "MFS", "we", "us") propose to arrange a bridging loan facility
            to you on the terms, financial particulars and conditions set out below ("the Loan").
          </Text>
          <Text style={btlDipStyles.introText}>
            The Loan itself will be subject to the receipt of a signed Decision in Principle (this document),
            payment of the Admin and Valuation Fees referred to below, a signed contract, a valuation,
            responses to MFS enquiries, due diligence, confirmation of a clear exit strategy, and will be subject to the
            terms and conditions of a loan agreement (Loan Agreement) which shall be secured by our standard form Security.
          </Text>
        </View>

        {/* THE SUMMARY Section */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#000000', textDecoration: 'underline' }}>The Summary</Text>
        </View>

        {/* Borrower */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Borrower ("you"):</Text>
          <Text style={btlDipStyles.summaryValue}>{borrowerName}</Text>
        </View>

        {/* Product Type */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Type:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {propertyType} Bridging Finance - {productName}
          </Text>
        </View>

        {/* Bridging Term */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Loan Term:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {bridgingTerm} {bridgingTerm === 1 ? 'month' : 'months'}. This is a short-term bridging facility and must be repaid within the agreed term.
          </Text>
        </View>

        {/* Interest Rate */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Interest Rate:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {interestRate}% per annum for the duration of the loan.
          </Text>
        </View>

        {/* Monthly Interest Cost */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Monthly Interest Cost:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrencyWithPence(monthlyInterestCost)}
            {hasRetention ? ' (to be serviced from retention facility)' : ' (payable monthly)'}
          </Text>
        </View>

        {/* Gross Loan Amount */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Gross Loan Amount:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(grossLoan)} on estimated valuation of {h.formatCurrency(propertyValue)} ({ltv}% LTV).
            The Gross Loan is the total principal owed, and is made up of the Net Loan advanced, and the following:
          </Text>
        </View>

        {/* Net Loan */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Net Loan (advanced at completion):</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(netLoan)}{hasBrokerFees ? ' (including the Broker Client Fee, as below)' : ''}
          </Text>
        </View>

        {/* Product Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {productFeePercent.toFixed(2)}% ({h.formatCurrency(productFeeAmount)}) of the Gross Loan Amount
          </Text>
        </View>

        {/* Months Interest Rolled Up - CONDITIONAL */}
        {hasRolledMonths && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Months Interest Rolled Up:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {rolledMonths} month{rolledMonths !== 1 ? 's' : ''}, equivalent to {h.formatCurrency(rolledInterestAmount)} (deducted from Net Loan at completion)
            </Text>
          </View>
        )}

        {/* Retention Facility - CONDITIONAL */}
        {hasRetention && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Retention Facility:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(retentionAmount)} retained to service monthly interest payments. Interest will be deducted from this facility each month.
            </Text>
          </View>
        )}

        {/* Broker's Commission - CONDITIONAL */}
        {hasBrokerFees && brokerCommission > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker's Commission:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerCommission)} (to be deducted from the Product Fee)
            </Text>
          </View>
        )}

        {/* Broker Client Fee - CONDITIONAL */}
        {hasBrokerFees && brokerClientFee > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker Client Fee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerClientFee)} (to be deducted from the Net Loan Amount)
            </Text>
          </View>
        )}

        {/* Early Repayment - CONDITIONAL based on product type */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Early Repayment:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isFusion
              ? 'No early repayment charges apply. You may exit the loan at any time during the term without penalty.'
              : `Minimum term: ${minimumTerm} month${minimumTerm !== 1 ? 's' : ''}. Early exit within minimum term may incur interest charges for the minimum period.`
            }
          </Text>
        </View>

        {/* Charge Type */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {chargeType} legal charge over the Security Property.
          </Text>
        </View>

        {/* Admin Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Admin Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A non-refundable fee of {h.formatCurrency(adminFee)} per property payable to MFS along with the Valuation Fee.
          </Text>
        </View>

        {/* Valuation Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Valuation Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A non-refundable Valuation Fee of {valuationFee} is to be paid to us or an associated company
            as directed by us prior to instructing valuers.
          </Text>
        </View>

        {/* Legal Fees */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Legal Fees:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {legalFees === 'TBC' || legalFees === 'TBC by the Underwriter' ? legalFees : `${legalFees} to be payable by you.`}
          </Text>
        </View>

        {/* Exit Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Exit Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(exitFee)} payable upon redemption of the loan.
          </Text>
        </View>

        {/* Title Insurance - CONDITIONAL */}
        {hasTitleInsurance && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Title Insurance Cost:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrencyWithPence(titleInsuranceCost)} (to be deducted from the net loan amount)
            </Text>
          </View>
        )}

        {/* Guarantee (if Corporate) */}
        {dipData.applicant_type === 'Corporate' && dipData.guarantor_name && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Guarantee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              Personal guarantee from {dipData.guarantor_name}.
            </Text>
          </View>
        )}

        <PDFFooter />
      </Page>

      {/* PAGE 2 - Exit Strategy & Terms */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Exit Strategy Section */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#000000', textDecoration: 'underline' }}>EXIT STRATEGY</Text>
        </View>

        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsText}>
            As this is a short-term bridging facility, you must have a clear and credible exit strategy in place.
            Please confirm your intended exit strategy by checking the appropriate box(es):
          </Text>
          <Text style={{ ...btlDipStyles.termsText, marginTop: 8 }}>☐ Sale of security property</Text>
          <Text style={btlDipStyles.termsText}>☐ Refinance to term mortgage</Text>
          <Text style={btlDipStyles.termsText}>☐ Sale of other assets</Text>
          <Text style={btlDipStyles.termsText}>☐ Other (please specify): _______________________</Text>
        </View>

        {/* DIP Expiry */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>DIP Expiry</Text>
          <Text style={btlDipStyles.termsText}>
            Please note that the terms offered are valid for 14 days from the date of this document
            (until {dipExpiryDate}). If this document is signed and accepted by all applicants within
            this time, the Loan as per the terms offered within The Summary above must be drawn down
            within 28 days of the solicitor being instructed. If the drawdown of the Loan isn't complete
            by this date you will need to contact us to see if an extension can be granted or to make new
            arrangements. If the Loan is not drawn you will be liable to pay our costs incurred including
            our solicitors' abortive legal fees and disbursements.
          </Text>
        </View>

        {/* Important Information */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Important Information</Text>
          <Text style={btlDipStyles.termsText}>
            • This Decision in Principle is subject to satisfactory valuation, legal checks, and full underwriting.
          </Text>
          <Text style={btlDipStyles.termsText}>
            • The actual rate offered may differ from this indication based on final assessment.
          </Text>
          <Text style={btlDipStyles.termsText}>
            • This DIP is valid for 90 days from the date shown above.
          </Text>
          <Text style={btlDipStyles.termsText}>
            • A full loan offer will be issued subject to satisfactory completion of all checks.
          </Text>
          <Text style={btlDipStyles.termsText}>
            • Bridging finance is a short-term facility and must be repaid within the agreed term.
          </Text>
          <Text style={btlDipStyles.termsText}>
            • You must have a clear exit strategy in place before drawdown.
          </Text>
        </View>

        {/* Borrower Declaration - CONDITIONAL based on property type */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Borrower Declaration</Text>
          {isCommercial && (
            <Text style={btlDipStyles.termsText}>
              I/We confirm that the property is commercial in nature and will not be used as a dwelling.
            </Text>
          )}
          {isSemiCommercial && (
            <Text style={btlDipStyles.termsText}>
              I/We confirm that the property is semi-commercial in nature.
            </Text>
          )}
          {isResidential && (
            <Text style={btlDipStyles.termsText}>
              I/We confirm that the security property will not be used as my/our main residence during the term of this loan.
            </Text>
          )}
          <Text style={{ ...btlDipStyles.termsText, marginTop: 8 }}>
            I/We confirm that all information provided in support of this application is true and accurate.
          </Text>
          <Text style={btlDipStyles.termsText}>
            I/We understand that providing false or misleading information may result in the withdrawal of any offer.
          </Text>
          <Text style={btlDipStyles.termsText}>
            I/We consent to the lender carrying out credit and identity checks as required.
          </Text>
          <Text style={btlDipStyles.termsText}>
            I/We have been advised to seek independent legal and financial advice regarding this transaction.
          </Text>
          <Text style={btlDipStyles.termsText}>
            I/We understand this is a short-term bridging facility and have a clear exit strategy in place.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 3 - Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Signature Section - CONDITIONAL based on number of applicants */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#000000', textDecoration: 'underline' }}>Signed by each Borrower</Text>
        </View>

        <View style={btlDipStyles.signatureGrid}>
          {/* Applicant 1 - Always shown */}
          <View style={btlDipStyles.signatureBlock}>
            <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
            <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
            <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
            <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
          </View>

          {/* Applicant 2 - Show if >= 2 applicants */}
          {numApplicants >= 2 && (
            <View style={btlDipStyles.signatureBlock}>
              <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
              <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
            </View>
          )}
        </View>

        {/* Additional applicants 3-4 */}
        {numApplicants >= 3 && (
          <View style={btlDipStyles.signatureGrid}>
            <View style={btlDipStyles.signatureBlock}>
              <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
              <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
            </View>

            {numApplicants >= 4 && (
              <View style={btlDipStyles.signatureBlock}>
                <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
                <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
                <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
                <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 8, color: '#706e6b', textAlign: 'center' }}>
            Market Financial Solutions is authorised and regulated by the Financial Conduct Authority.
          </Text>
          <Text style={{ fontSize: 8, color: '#706e6b', textAlign: 'center' }}>
            This document is for information purposes only and does not constitute a binding offer of finance.
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default BridgingDIPPDF;
