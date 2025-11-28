import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlDipStyles } from './shared/BTLDIPStyles';
import PDFHeader from './shared/PDFHeader';
import PDFFooter from './shared/PDFFooter';
import * as BTLDIPHelpers from './utils/btlDipHelpers';

/**
 * BTL DIP PDF - Matches Excel DIP sheet formatting and conditional scenarios
 * 
 * Conditional scenarios implemented:
 * - Product Type: Fixed vs Tracker rate text
 * - Revert Rate: BBR vs MVR based revert text
 * - Property Type: Residential BTL vs Commercial vs Semi-Commercial declarations
 * - Rolled Months: Show/hide based on whether interest is rolled
 * - Deferred Interest: Show/hide based on whether deferred rate is used
 * - Broker Fees: Show/hide broker commission and client fee sections
 * - Number of Applicants: 1-4 signature blocks
 * - Title Insurance: Conditional text about valuation
 */
const BTLDIPPDF = ({ quote, dipData, brokerSettings = {} }) => {
  // Extract all values using helpers
  const h = BTLDIPHelpers;
  
  const borrowerName = h.getBorrowerName(quote, brokerSettings);
  const securityAddress = h.getSecurityAddress(dipData);
  const dipDate = h.formatDateLong(dipData.dip_date);
  const dipExpiryDate = h.formatDateLong(dipData.dip_expiry_date);
  
  // Loan details
  const grossLoan = h.getGrossLoan(quote);
  const netLoan = h.getNetLoan(quote);
  const propertyValue = h.getPropertyValue(quote);
  const productFeePercent = h.getProductFeePercent(quote);
  const productFeeAmount = h.getProductFeeAmount(quote);
  
  // Rate information
  const isTracker = h.isTrackerProduct(quote);
  const isFixed = h.isFixedProduct(quote);
  const initialTerm = h.getInitialTerm(quote);
  const fullTerm = h.getFullTerm(quote);
  const annualRate = h.getAnnualRate(quote);
  const revertRate = h.getRevertRate(quote);
  const isMVRRevert = h.isMVRRevert(quote);
  const aprc = h.getAPRC(quote);
  const monthlyInterestCost = h.getMonthlyInterestCost(quote);
  
  // Interest handling
  const hasRolledMonths = h.hasRolledMonths(quote);
  const rolledMonths = h.getRolledMonths(quote);
  const rolledInterestAmount = h.getRolledInterestAmount(quote);
  const hasDeferredInterest = h.hasDeferredInterest(quote);
  const deferredRate = h.getDeferredRate(quote);
  const deferredAmount = h.getDeferredAmount(quote);
  const payRate = h.getPayRate(quote);
  
  // Fees
  const adminFee = h.getAdminFee(quote, dipData);
  const valuationFee = h.getValuationFee(quote, dipData);
  const legalFees = h.getLegalFees(quote, dipData);
  const brokerCommission = h.getBrokerCommission(quote, brokerSettings);
  const brokerClientFee = h.getBrokerClientFee(quote, brokerSettings);
  const hasBrokerFees = h.hasBrokerFees(brokerSettings);
  
  // ERC
  const ercText = h.getERCText(quote);
  const overpaymentText = h.getOverpaymentText(quote, dipData);
  
  // Direct Debit
  const directDebit = h.getDirectDebit(quote);
  const ddStartMonth = h.getDDStartMonth(quote);
  
  // Property type for declarations
  const propertyType = h.getPropertyType(quote, dipData);
  const isCommercial = propertyType === 'Commercial';
  const isSemiCommercial = propertyType === 'Semi-Commercial';
  const isResidentialBTL = propertyType === 'Residential' || propertyType === 'Residential BTL';
  
  // ICR
  const icr = h.getICR(quote);
  
  // Number of applicants for signature blocks
  const numApplicants = h.getNumberOfApplicants(dipData);
  
  // Title insurance
  const hasTitleInsurance = h.hasTitleInsurance(quote);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with branding */}
        <PDFHeader
          title="Decision in Principle"
          subtitle="Buy to Let Mortgage"
          referenceNumber={quote.reference_number}
        />

        {/* Date */}
        <View style={btlDipStyles.dateRow}>
          <Text style={btlDipStyles.dateText}>Decision in Principle</Text>
          <Text style={btlDipStyles.dateValue}>{dipDate}</Text>
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
            We Market Financial Solutions Limited (hereinafter "MFS", "we", "us") propose to arrange a loan facility 
            to you on the terms, financial particulars and conditions set out below ("the Loan").
          </Text>
          <Text style={btlDipStyles.introText}>
            The Loan itself will be subject to the receipt of a signed Decision in Principle (this document), 
            payment of the Admin and Valuation Fees referred to below, a signed contract, a valuation, 
            responses to MFS enquiries, due diligence, and will be subject to the terms and conditions of 
            a loan agreement (Loan Agreement) which shall be secured by our standard form Security and a 
            Guarantee (both defined in The Summary below).
          </Text>
        </View>

        {/* THE SUMMARY Section */}
        <View style={btlDipStyles.sectionHeader}>
          <Text style={btlDipStyles.sectionTitle}>The Summary</Text>
        </View>

        {/* Borrower */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Borrower ("you"):</Text>
          <Text style={btlDipStyles.summaryValue}>{borrowerName}</Text>
        </View>

        {/* Product Type - Conditional based on Fixed vs Tracker */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Type:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isTracker ? 'Tracker Rate BTL Mortgage' : 'Fixed Rate BTL Mortgage'}
          </Text>
        </View>

        {/* Total Loan Term - Conditional text based on Fixed vs Tracker */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Total Loan Term:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isTracker 
              ? `${fullTerm} years, made up of an initial tracker rate of ${initialTerm} years (the "Initial Tracker Rate Period"), then followed by a variable rate (the "Revert Rate") for the remaining term.`
              : `${fullTerm} years, made up of an initial fixed rate of ${initialTerm} years (the "Initial Fixed Rate Period"), then followed by a variable rate (the "Revert Rate") for the remaining term.`
            }
          </Text>
        </View>

        {/* Annual Interest Rate - Conditional based on MVR vs BBR revert */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Annual Interest Rate:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isTracker 
              ? `For the first ${initialTerm} years a tracker rate of ${annualRate}% (BBR + margin). ${initialTerm} years from the date of completion, the interest rate will change to ${isMVRRevert ? `the MFS Variable Rate (MVR), currently ${revertRate}%` : `BBR plus a margin, currently ${revertRate}%`} for the remaining ${fullTerm - initialTerm} years.`
              : `For the first ${initialTerm} years a fixed rate of ${annualRate}%. ${initialTerm} years from the date of completion, the interest rate will change to ${isMVRRevert ? `the MFS Variable Rate (MVR), currently ${revertRate}%` : `BBR plus a margin, currently ${revertRate}%`} for the remaining ${fullTerm - initialTerm} years.`
            }
          </Text>
        </View>

        {/* APRC */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>APRC:</Text>
          <Text style={btlDipStyles.summaryValue}>{aprc}%</Text>
        </View>

        {/* Monthly Interest Cost */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Monthly Interest Cost:</Text>
          <Text style={btlDipStyles.summaryValue}>{h.formatCurrency(monthlyInterestCost)}</Text>
        </View>

        {/* Gross Loan Amount */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Gross Loan Amount:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(grossLoan)}, on estimated valuation of {h.formatCurrency(propertyValue)}. 
            The Gross Loan is the total principal owed at the end of the term, and is made up of the 
            Net Loan advanced, and the following:
          </Text>
        </View>

        {/* Net Loan */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Net Loan (advanced day 1):</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(netLoan)}{hasBrokerFees ? ' (including the Broker Client Fee, as below)' : ''}
          </Text>
        </View>

        {/* Product Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {productFeePercent}% ({h.formatCurrency(productFeeAmount)}) of the Gross Loan Amount
          </Text>
        </View>

        {/* Months Interest Rolled Up - CONDITIONAL: Only show if rolled months > 0 */}
        {hasRolledMonths && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Months Interest Rolled Up:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {rolledMonths} months, equivalent to {h.formatCurrency(rolledInterestAmount)} (deducted from Net Loan at drawdown)
            </Text>
          </View>
        )}

        {/* Deferred Interest - CONDITIONAL: Only show if deferred rate > 0 */}
        {hasDeferredInterest && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Deferred Interest/Pay Rate:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {deferredRate}% deferred, equivalent to {h.formatCurrency(deferredAmount)} over {initialTerm * 12} months. 
              Pay Rate now {payRate}% for {isTracker ? 'Initial Tracker Rate Period' : 'Initial Fixed Rate Period'} only 
              (used for Direct Debit payments).
            </Text>
          </View>
        )}

        {/* Broker's Commission - CONDITIONAL: Only show if broker */}
        {hasBrokerFees && brokerCommission > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker's Commission:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerCommission)} (to be deducted from the Product Fee)
            </Text>
          </View>
        )}

        {/* Broker Client Fee - CONDITIONAL: Only show if broker client fee exists */}
        {hasBrokerFees && brokerClientFee > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker Client Fee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerClientFee)} (to be deducted from the Net Loan Amount)
            </Text>
          </View>
        )}

        {/* ERC */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Early Repayment Charge (ERC):</Text>
          <Text style={btlDipStyles.summaryValue}>{ercText}</Text>
        </View>

        {/* Overpayments */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Overpayments:</Text>
          <Text style={btlDipStyles.summaryValue}>{overpaymentText}</Text>
        </View>

        {/* Direct Debit */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Direct Debit & Start Date:</Text>
          <Text style={btlDipStyles.summaryValue}>
            Direct Debit of {h.formatCurrency(directDebit)} will start in month {ddStartMonth} following 
            drawdown from a valid UK bank account.
          </Text>
        </View>

        {/* Important DD Warning */}
        <View style={btlDipStyles.warningBox}>
          <Text style={btlDipStyles.warningText}>
            IMPORTANT: monthly payments shown in this illustration can be considerably different if a variable 
            rate changes. For example, for every £100,000 borrowed a 0.5% increase would raise the annual cost 
            by £500. Rates may increase by more than this, or be significantly different on the Revert rate so 
            make sure you can afford the monthly payment.
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
          <Text style={btlDipStyles.summaryValue}>{legalFees}, to be payable by you.</Text>
        </View>

        {/* Title Insurance conditional note */}
        {hasTitleInsurance && (
          <View style={btlDipStyles.infoBox}>
            <Text style={btlDipStyles.infoText}>
              Title Insurance is being used for this loan. The Title Insurance premium will be deducted 
              from the Net Loan at drawdown.
            </Text>
          </View>
        )}

        {/* Security */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A first legal charge over the Security Property.
          </Text>
        </View>

        {/* Financial Covenants / ICR */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Financial Covenants:</Text>
          <Text style={btlDipStyles.summaryValue}>
            Interest Cover to be at least {icr ? `${(icr * 100).toFixed(0)}%` : 'as per underwriting requirements'}.
          </Text>
        </View>

        <PDFFooter pageNumber={1} totalPages={3} />
      </Page>

      {/* PAGE 2 - Terms of Business */}
      <Page size="A4" style={styles.page}>
        <View style={btlDipStyles.sectionHeader}>
          <Text style={btlDipStyles.sectionTitle}>TERMS OF BUSINESS</Text>
        </View>

        {/* DIP Expiry */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>DIP Expiry</Text>
          <Text style={btlDipStyles.termsText}>
            Please note that the terms offered are valid for 14 days from the date of this document 
            (until {dipExpiryDate}). If this document is signed and accepted by all applicants within 
            this time, the Loan as per the terms offered within The Summary above must be drawn down 
            within 28 days of the solicitor being instructed. We will regularly check with our 
            solicitors for progress. If the drawdown of the Loan isn't complete by this date you 
            (or your broker/solicitor) will need to contact us to see if an extension can be granted 
            or to make new arrangements. If the Loan is not drawn you will be liable to pay our costs 
            incurred including our solicitors' abortive legal fees and disbursements.
          </Text>
        </View>

        {/* General & Privacy */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>General & Privacy</Text>
          <Text style={btlDipStyles.termsText}>
            MFS is arranging this transaction in respect of the proposed Loan. The Loan has been 
            approved in principle by us but remains conditional upon and subject to satisfactory 
            due diligence, payment of any admin and valuation fees, the valuation and enquiries 
            to us and our solicitors. We reserve the right to vary the terms or withdraw the Loan 
            at our discretion.
          </Text>
          <Text style={btlDipStyles.termsText}>
            By accepting these terms and signing this Decision in Principle, you authorise MFS 
            and its subsidiaries to conduct due diligence checks and data handling either to 
            assess the viability of the application or whilst the Loan is in effect.
          </Text>
        </View>

        {/* Loan Purpose - CONDITIONAL based on property type */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Loan Purpose</Text>
          <Text style={btlDipStyles.termsText}>
            More than 60% of the Loan provided is being used for business purposes, and by signing 
            this Decision in Principle you declare to us that the Loan is predominantly for the 
            purposes of a business, profession or trade carried on, or intended to be carried on by you.
          </Text>
          
          {/* Property Type specific declaration */}
          {isCommercial && (
            <Text style={btlDipStyles.termsText}>
              You confirm that less than 40% of the Security Property is used or intended to be 
              used as a dwelling.
            </Text>
          )}
          {isSemiCommercial && (
            <Text style={btlDipStyles.termsText}>
              You confirm that less than 40% of the Security Property is used or intended to be 
              used as a dwelling by you or any spouse, unmarried partner, civil partner, parents, 
              grandparents, siblings, children and grandchildren or any other related person in the future.
            </Text>
          )}
          {isResidentialBTL && (
            <Text style={btlDipStyles.termsText}>
              You confirm to us that the Security Property has never been used as a dwelling by you 
              or any spouse, unmarried partner, civil partner, parents, grandparents, siblings, 
              children and grandchildren or any other related person and will not be occupied by 
              you or any of the above-stated persons or any other related person in the future.
            </Text>
          )}
        </View>

        {/* Loan Amount and Deduction of Fees */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Loan Amount and Deduction of Fees</Text>
          <Text style={btlDipStyles.termsText}>
            Please note that the financial particulars in The Summary are, at this stage, estimates 
            only, and are subject to contract. These will only be varied in circumstances where our 
            enquiries reveal information which differs from that provided on initial application or 
            if there is reason to do so at our discretion.
          </Text>
          <Text style={btlDipStyles.termsText}>
            You authorise us to deduct (and/or to instruct our solicitor), any Product Fee (which 
            includes the Broker's Commission as specified in The Summary), Legal Fees and expenses, 
            any Interest (months of interest rolled and deferred until loan redemption), and any 
            other fees, costs, or expenses payable by you (which have not already been paid), from 
            the Gross Loan Amount upon completion of the Loan.
          </Text>
        </View>

        {/* Payments to Broker - CONDITIONAL */}
        {hasBrokerFees && (
          <View style={btlDipStyles.termsSection}>
            <Text style={btlDipStyles.termsSubtitle}>Payments to your Broker/Intermediary</Text>
            <Text style={btlDipStyles.termsText}>
              You authorise us to deduct the Broker Client Fee from the Net Loan Amount which is in 
              line with your agreement with your Broker/Intermediary and payable to your Broker/Intermediary. 
              No part of the Broker Client Fee is payable to us.
            </Text>
            <Text style={btlDipStyles.termsText}>
              In addition to any Broker Client Fee, Market Financial Solutions or its investors pay 
              a part of the Product Fee to your Introducer/Broker as Broker's Commission upon drawdown 
              of the Loan, in the amount as specified in The Summary. This means that your Broker/Intermediary 
              may be unable to provide impartial advice about the Loan to you.
            </Text>
          </View>
        )}

        {/* Interest Rate Applied */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Interest Rate Applied</Text>
          <Text style={btlDipStyles.termsText}>
            The rate of interest payable on the Gross Loan Amount will be the Interest Rate in The Summary. 
            This margin may change once the initial rate period has expired (as stated in The Summary). 
            Interest is calculated monthly, and payable by Direct Debit from a verified UK bank account.
          </Text>
          {isTracker && (
            <Text style={btlDipStyles.termsText}>
              If BBR is 0.5% per annum or less, then, for the purposes of calculating your relevant 
              tracker rate, we will treat BBR as 0.5% per annum and apply any margin to that.
            </Text>
          )}
        </View>

        {/* Term of Loan */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Term of Loan</Text>
          <Text style={btlDipStyles.termsText}>
            The Loan shall be for the Loan Term, which will commence from the date of drawdown of 
            the Loan. Please note that this is an interest only BTL Loan facility, and you must be 
            in a position to repay the capital in full at the end of the Term. You should not assume 
            that the Loan Term will be extended.
          </Text>
        </View>

        <PDFFooter pageNumber={2} totalPages={3} />
      </Page>

      {/* PAGE 3 - Tariff & Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Tariff of Charges */}
        <View style={btlDipStyles.sectionHeader}>
          <Text style={btlDipStyles.sectionTitle}>Tariff of Charges</Text>
        </View>

        <View style={btlDipStyles.tariffTable}>
          <View style={btlDipStyles.tariffHeader}>
            <Text style={btlDipStyles.tariffHeaderCell}>Fee</Text>
            <Text style={btlDipStyles.tariffHeaderCellRight}>Charges from</Text>
          </View>
          
          {/* Post Completion Fees */}
          <View style={btlDipStyles.tariffSubHeader}>
            <Text style={btlDipStyles.tariffSubHeaderText}>Post Completion Fees</Text>
          </View>
          
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Chaps Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Building Insurance</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Expiry/Renewal of Buildings Insurance</Text>
            <Text style={btlDipStyles.tariffCellRight}>£500</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Duplicate or Interim Statement</Text>
            <Text style={btlDipStyles.tariffCellRight}>£35</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Calculating Settlement Figures (3rd time onwards)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£55</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Deed of Postponement</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Repayment Administration Fee (per Property)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£475</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Part Repayment</Text>
            <Text style={btlDipStyles.tariffCellRight}>£75</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Unpaid/Declined Direct Debit</Text>
            <Text style={btlDipStyles.tariffCellRight}>£25</Text>
          </View>
        </View>

        {/* Important Notices */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>No Legally Binding Agreement</Text>
          <Text style={btlDipStyles.termsTextSmall}>
            You acknowledge and agree that we do not, and will not, provide any financial, accounting, 
            taxation or legal advice in relation to the Loan. You should seek your own independent 
            advice in relation to this Decision in Principle.
          </Text>
        </View>

        {/* Signature Section - CONDITIONAL based on number of applicants */}
        <View style={btlDipStyles.sectionHeader}>
          <Text style={btlDipStyles.sectionTitle}>Signed by each Borrower</Text>
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

        <PDFFooter pageNumber={3} totalPages={3} />
      </Page>
    </Document>
  );
};

export default BTLDIPPDF;
