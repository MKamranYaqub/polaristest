/**
 * Bridge & Fusion Calculation Engine
 * 
 * Implements comprehensive financial calculations for Bridge and Fusion products
 * based on integration/bridgeFusionCalculations.js formulas.
 * 
 * Features:
 * - LTV bucket determination (60%, 70%, 75%)
 * - Rolled interest calculations (interest added to loan upfront)
 * - Deferred interest calculations (interest paid at term end)
 * - Serviced interest calculations (interest paid monthly)
 * - APR/APRC calculations
 * - Monthly payment calculations
 * - Net proceeds calculations
 * - ICR (Interest Coverage Ratio) for Fusion products
 * - BBR (Bank Base Rate) handling for variable products
 */

import { parseNumber } from './calculator/numberFormatting';

export class BridgeFusionCalculator {
  /**
   * Round a number up to the nearest step (default: 1000)
   */
  static roundUpTo(value, step = 1000) {
    return value > 0 ? Math.ceil(value / step) * step : 0;
  }

  /**
   * Determine LTV bucket based on gross loan and property value
   * Returns 60, 70, or 75 based on LTV percentage
   */
  static getLtvBucket(gross, propertyValue) {
    if (!propertyValue || propertyValue <= 0) return 75;
    const ltvPct = (gross / propertyValue) * 100;
    if (ltvPct <= 60) return 60;
    if (ltvPct <= 70) return 70;
    return 75;
  }

  /**
   * Get the margin rate for variable bridge products
   * Returns monthly margin rate (as decimal, e.g. 0.005 = 0.5%)
   */
  static getBridgeVarMargin(ltvBucket, rateRecord) {
    // Rate from database is already the monthly margin
    // e.g., 0.5 in CSV = 0.5% monthly margin
    return (parseNumber(rateRecord.rate) || 0) / 100;
  }

  /**
   * Get the coupon rate for fixed bridge products
   * Returns monthly coupon rate (as decimal, e.g. 0.0085 = 0.85%)
   */
  static getBridgeFixCoupon(ltvBucket, rateRecord) {
    // Rate from database is the monthly coupon
    // e.g., 0.85 in CSV = 0.85% monthly coupon
    return (parseNumber(rateRecord.rate) || 0) / 100;
  }

  /**
   * Get Fusion product tier name and margin based on loan size
   * Returns object with annualRate and tierName
   */
  static getFusionTierInfo(gross, rateRecord, bbrAnnual) {
    // Fusion rates in database are the MARGIN (excluding BBR)
    // e.g., 4.79% annual margin (BBR is added separately)
    const marginAnnual = (parseNumber(rateRecord.rate) || 0) / 100;
    const fullAnnualRate = marginAnnual + bbrAnnual; // Full rate = margin + BBR
    const tierName = rateRecord.product || 'Standard';
    
    return {
      annualRate: fullAnnualRate,
      tierName: tierName,
      marginAnnual: marginAnnual // Already the margin from DB
    };
  }

  /**
   * Main calculation method for Bridge and Fusion products
   * 
   * @param {Object} params - Calculation parameters
   * @param {string} params.productKind - 'bridge-var', 'bridge-fix', or 'fusion'
   * @param {number} params.grossLoan - Gross loan amount
   * @param {number} params.propertyValue - Property value
   * @param {Object} params.rateRecord - Rate record from database
   * @param {boolean} params.isCommercial - Is commercial property
   * @param {number} params.bbrAnnual - Annual BBR as decimal (e.g., 0.04 = 4%)
   * @param {number} params.rentPm - Monthly rent
   * @param {number} params.topSlicingPm - Monthly top slicing income
   * @param {number} params.termMonths - Loan term in months
   * @param {number} params.rolledMonths - Months of rolled interest
   * @param {number} params.arrangementPct - Arrangement fee as percentage (decimal)
   * @param {number} params.deferredAnnualRate - Deferred interest rate (annual decimal)
   * @param {number} params.procFeePct - Proc fee percentage
   * @param {number} params.brokerFeeFlat - Flat broker fee amount
   * @param {number} params.brokerClientFee - Broker client fee from additional fees
   * @param {number} params.adminFee - Admin fee amount
   * 
   * @returns {Object} Calculation results
   */
  static solve(params) {
    const {
      productKind,
      grossLoan,
      propertyValue,
      rateRecord,
      isCommercial = false,
      bbrAnnual = 0.04, // Default 4% BBR
      rentPm = 0,
      topSlicingPm = 0,
      termMonths = 12,
      rolledMonths = 0,
      arrangementPct = 0.02, // Default 2%
      deferredAnnualRate = 0,
      procFeePct = 0,
      brokerFeeFlat = 0,
      brokerClientFee = 0,
      adminFee = 0,
      useSpecificNet = false,
      specificNetLoan = 0,
    } = params;

    let gross = parseNumber(grossLoan);
    const pv = parseNumber(propertyValue);
    const rent = parseNumber(rentPm);
    const topSlice = parseNumber(topSlicingPm);
    const term = parseNumber(termMonths) || 12;
    const rolled = Math.min(parseNumber(rolledMonths) || 0, term);
    const adminFeeAmt = parseNumber(adminFee) || 0;
    const targetNet = parseNumber(specificNetLoan);

    // Validate inputs
    if (isNaN(gross) || gross <= 0) {
      if (useSpecificNet && !isNaN(targetNet) && targetNet > 0) {
        // We'll calculate gross from net below
        gross = 0; // Placeholder
      } else {
        console.error('Invalid gross loan and no specific net provided');
        // Return empty result
        return {
          gross: 0,
          netLoanGBP: 0,
          npb: 0,
          grossLTV: 0,
          netLTV: 0,
          ltv: 0,
          fullAnnualRate: 0,
          fullRateMonthly: 0,
          fullCouponRateMonthly: 0,
          payRateMonthly: 0,
          marginMonthly: 0,
          bbrMonthly: 0,
          fullRateText: 'N/A',
          arrangementFeeGBP: 0,
          arrangementFeePct: 0,
          procFeePct: 0,
          procFeeGBP: 0,
          brokerFeeGBP: 0,
          adminFee: 0,
          productFeePercent: 0,
          productFeePounds: 0,
          termMonths: term,
          rolledMonths: 0,
          servicedMonths: term,
          rolledInterestGBP: 0,
          rolledIntCoupon: 0,
          rolledIntBBR: 0,
          deferredGBP: 0,
          deferredInterestRate: 0,
          servicedInterestGBP: 0,
          totalInterest: 0,
          monthlyPaymentGBP: 0,
          directDebit: 0,
          aprcAnnual: 0,
          aprcMonthly: 0,
          totalAmountRepayable: 0,
          tier: null,
          tierName: null,
          icr: null,
          productKind,
          propertyValue: pv,
          rent: rent,
          topSlicing: topSlice,
          error: 'No valid gross loan or specific net loan provided'
        };
      }
    }

    // If using specific net loan, we need to reverse-calculate the gross loan
    // Net = Gross - ArrangementFee - RolledInterest - DeferredInterest - ProcFee - BrokerFee - AdminFee
    // This requires iterative calculation since fees depend on gross
    if (useSpecificNet && targetNet > 0) {
      // Start with an estimate: gross = net / (1 - estimated total fee %)
      // Typical fees: 2% arrangement + rolled interest + deferred + proc fee
      // We'll iterate to find the exact gross loan
      let estimatedGross = targetNet / 0.85; // Start with 85% net (15% fees estimate)
      
      // Iterate up to 10 times to find accurate gross loan
      for (let i = 0; i < 10; i++) {
        const tempGross = estimatedGross;
        
        // Calculate fees based on current gross estimate
        const tempArrangementFee = tempGross * arrangementPct;
        const tempProcFee = tempGross * (procFeePct / 100);
        const tempBrokerFee = parseNumber(brokerFeeFlat) || 0;
        
        // Estimate rates for rolled/deferred interest
        // We need to do a quick rate lookup based on estimated LTV
        const estimatedLtvBucket = this.getLtvBucket(tempGross, pv);
        let tempCouponMonthly = 0;
        let tempBbrMonthly = bbrAnnual / 12;
        
        // Get approximate rates
        if (productKind === 'bridge-var') {
          tempCouponMonthly = this.getBridgeVarMargin(estimatedLtvBucket, rateRecord);
        } else if (productKind === 'bridge-fix') {
          tempCouponMonthly = this.getBridgeFixCoupon(estimatedLtvBucket, rateRecord);
          tempBbrMonthly = 0;
        } else if (productKind === 'fusion') {
          const tierInfo = this.getFusionTierInfo(tempGross, rateRecord, bbrAnnual);
          tempCouponMonthly = tierInfo.marginAnnual / 12;
          tempBbrMonthly = bbrAnnual / 12;
        }
        
        // Calculate rolled and deferred interest
        const tempRolledIntCoupon = tempGross * tempCouponMonthly * rolled;
        const tempRolledIntBBR = ['bridge-var', 'fusion'].includes(productKind)
          ? tempGross * tempBbrMonthly * rolled
          : 0;
        const tempRolledInterest = tempRolledIntCoupon + tempRolledIntBBR;
        
        const tempDeferredMonthlyRate = deferredAnnualRate / 12;
        const tempDeferred = productKind === 'fusion' 
          ? tempGross * tempDeferredMonthlyRate * term 
          : 0;
        
        // Calculate what net would be with this gross
        const calculatedNet = tempGross - tempArrangementFee - tempRolledInterest - tempDeferred - tempProcFee - tempBrokerFee - adminFeeAmt;
        
        // Check if we're close enough
        const diff = Math.abs(calculatedNet - targetNet);
        if (diff < 0.01) {
          gross = tempGross;
          break;
        }
        
        // Adjust estimate: if calculated net is too low, increase gross; if too high, decrease gross
        if (calculatedNet < targetNet) {
          estimatedGross = tempGross + (targetNet - calculatedNet);
        } else {
          estimatedGross = tempGross - (calculatedNet - targetNet);
        }
      }
    }

    // Calculate LTV bucket
    const ltvBucket = this.getLtvBucket(gross, pv);

    // Determine rates based on product kind
    let fullAnnualRate = 0; // Full annual rate (including BBR for variable)
    let couponMonthly = 0; // Monthly coupon/margin rate
    let marginMonthly = 0; // Monthly margin (for variable products)
    let marginAnnual = 0; // Annual margin (for Fusion pay rate calculation)
    let tierName = null;
    let bbrMonthly = bbrAnnual / 12;

    switch (productKind) {
      case 'bridge-var': {
        // Variable Bridge: margin + BBR
        marginMonthly = this.getBridgeVarMargin(ltvBucket, rateRecord);
        couponMonthly = marginMonthly;
        fullAnnualRate = (marginMonthly + bbrMonthly) * 12;
        break;
      }

      case 'bridge-fix': {
        // Fixed Bridge: fixed coupon rate
        couponMonthly = this.getBridgeFixCoupon(ltvBucket, rateRecord);
        marginMonthly = couponMonthly;
        fullAnnualRate = couponMonthly * 12;
        bbrMonthly = 0; // No BBR for fixed products
        break;
      }

      case 'fusion': {
        // Fusion: variable rate with tier-based pricing
        const tierInfo = this.getFusionTierInfo(gross, rateRecord, bbrAnnual);
        fullAnnualRate = tierInfo.annualRate;
        tierName = tierInfo.tierName;
        marginAnnual = tierInfo.marginAnnual; // Store annual margin for pay rate calculation
        marginMonthly = tierInfo.marginAnnual / 12;
        couponMonthly = marginMonthly;
        bbrMonthly = bbrAnnual / 12;
        break;
      }

      default:
        throw new Error(`Invalid product kind: ${productKind}`);
    }

    // === FEE CALCULATIONS ===
    const arrangementFeeGBP = gross * arrangementPct;
    const procFeeGBP = gross * (procFeePct / 100);
    const brokerFeeGBP = parseNumber(brokerFeeFlat) || 0;
    const brokerClientFeeGBP = parseNumber(brokerClientFee) || 0;

    // === TITLE INSURANCE COST (same formula as BTL) ===
    let titleInsuranceCost = null;
    if (gross > 0 && gross <= 3000000) {
      const base = gross * 0.0013; // 0.13%
      const withIpt = base * 1.12; // +12% IPT
      titleInsuranceCost = Math.max(392, withIpt);
    } else {
      titleInsuranceCost = null; // outside range -> not applicable
    }

    // === INTEREST CALCULATIONS ===
    const servicedMonths = Math.max(term - rolled, 0);
    
    // Deferred interest (annual rate applied to full term, typically for Fusion)
    const deferredMonthlyRate = deferredAnnualRate / 12;
    const deferredGBP = productKind === 'fusion' 
      ? gross * deferredMonthlyRate * term 
      : 0;

    // Rolled interest (upfront interest added to loan)
    // Coupon portion (margin only)
    const rolledIntCoupon = gross * (couponMonthly - deferredMonthlyRate) * rolled;
    
    // BBR portion (for variable products only)
    const rolledIntBBR = ['bridge-var', 'fusion'].includes(productKind)
      ? gross * bbrMonthly * rolled
      : 0;
    
    const rolledInterestGBP = rolledIntCoupon + rolledIntBBR;

    // Serviced interest (monthly interest paid during term)
    // For Fusion: exclude deferred rate from serviced interest
    // For Bridge: use full rate (no deferred component)
    const servicedRate = productKind === 'fusion' 
      ? (fullAnnualRate - deferredAnnualRate) 
      : fullAnnualRate;
    const servicedInterestGBP = gross * (servicedRate / 12) * servicedMonths;

    // Total interest over loan term
    const totalInterest = deferredGBP + rolledInterestGBP + servicedInterestGBP;

    // === NET PROCEEDS ===
    const netLoanGBP = Math.max(
      0,
      gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP - procFeeGBP - brokerFeeGBP - brokerClientFeeGBP - adminFeeAmt - (titleInsuranceCost || 0)
    );

    // === MONTHLY PAYMENT ===
    // Monthly payment = serviced interest divided by serviced months
    // When interest is rolled or deferred, monthly payment should be reduced
    const monthlyPaymentGBP = servicedMonths > 0 
      ? servicedInterestGBP / servicedMonths 
      : 0;

    // === LTV CALCULATIONS ===
    const grossLTV = pv > 0 ? (gross / pv) * 100 : 0;
    const netLTV = pv > 0 ? (netLoanGBP / pv) * 100 : 0;

    // === APR/APRC CALCULATION ===
    // APRC = Annual Percentage Rate of Charge
    // Formula: ((Total Repayable / Net Proceeds) - 1) / (Term in years) * 100
    const totalAmountRepayable = gross + totalInterest;
    const aprcAnnual = netLoanGBP > 0 
      ? ((totalAmountRepayable / netLoanGBP - 1) / (term / 12)) * 100
      : 0;
    const aprcMonthly = aprcAnnual / 12;

    // === ICR (Interest Coverage Ratio) - Fusion only ===
    // Formula: ((rent + topslice) * 24) / (((yearly_rate - deferred) * grossloan * 2) - rolled_interest)
    // This represents: 2 years of income / 2 years of net interest costs
    let icr = null;
    if (productKind === 'fusion') {
      const totalIncome = rent + topSlice;
      if (totalIncome > 0) {
        // Calculate 2 years of income
        const annualIncome = totalIncome * 24; // 24 months = 2 years
        
        // Calculate 2 years of interest costs (net of deferred) minus rolled
        const yearlyRate = fullAnnualRate; // Already as decimal (e.g., 0.10 for 10%)
        const twoYearsInterest = (yearlyRate - deferredAnnualRate) * gross * 2;
        const netInterestCost = twoYearsInterest - rolledInterestGBP;
        
        if (netInterestCost > 0) {
          icr = (annualIncome / netInterestCost) * 100;
        }
      }
    }

    // === RETURN RESULTS ===
    return {
      // Basic loan metrics
      gross,
      netLoanGBP,
      npb: netLoanGBP, // Net Proceeds to Borrower
      grossLTV,
      netLTV,
      ltv: ltvBucket,

      // Rates
      fullAnnualRate: fullAnnualRate * 100, // As percentage
      fullRateMonthly: (fullAnnualRate / 12) * 100, // Monthly percentage
      fullCouponRateMonthly: couponMonthly * 100, // Coupon/margin monthly percentage
      
      // Pay Rate: For Fusion = annual margin - deferred (shown yearly), For Bridge = coupon monthly
      payRateMonthly: productKind === 'fusion' 
        ? ((marginAnnual - deferredAnnualRate) * 100)  // Fusion: annual % (margin - deferred)
        : (couponMonthly * 100), // Bridge: monthly coupon rate %
      
      marginMonthly: marginMonthly * 100, // Margin monthly percentage
      bbrMonthly: bbrMonthly * 100, // BBR monthly percentage
      
      // fullRateText: Show annual margin for Fusion, monthly coupon for Bridge
      fullRateText: productKind === 'fusion'
        ? `${(marginAnnual * 100).toFixed(2)}% + BBR` // Fusion: annual margin
        : `${(couponMonthly * 100).toFixed(2)}%${productKind === 'bridge-var' ? ' + BBR' : ''}`, // Bridge: monthly

      // Fees
      arrangementFeeGBP,
      arrangementFeePct: arrangementPct * 100,
      procFeePct,
      procFeeGBP,
      brokerFeeGBP,
      brokerClientFee: brokerClientFeeGBP,
      adminFee: adminFeeAmt,
      productFeePercent: arrangementPct * 100,
      productFeePounds: arrangementFeeGBP,
      titleInsuranceCost,

      // Commitment Fee and Exit Fee (typically 1% each for Bridge/Fusion products)
      commitmentFeePercent: 1, // 1% standard
      commitmentFeePounds: grossLoan * 0.01, // 1% of gross loan
      exitFeePercent: 1, // 1% standard  
      exitFee: grossLoan * 0.01, // 1% of gross loan

      // ERC (Early Repayment Charges) - Fusion only (pulled from rate record, not hardcoded)
      erc1Percent: productKind === 'fusion' ? (parseNumber(rateRecord.erc_1) || 0) : 0,
      erc2Percent: productKind === 'fusion' ? (parseNumber(rateRecord.erc_2) || 0) : 0,
      erc1Pounds: productKind === 'fusion' ? grossLoan * ((parseNumber(rateRecord.erc_1) || 0) / 100) : 0,
      erc2Pounds: productKind === 'fusion' ? grossLoan * ((parseNumber(rateRecord.erc_2) || 0) / 100) : 0,

      // Interest components
      termMonths: term,
      rolledMonths: rolled,
      servicedMonths,
      rolledInterestGBP,
      rolledIntCoupon,
      rolledIntBBR,
      deferredGBP,
      deferredInterestRate: deferredAnnualRate * 100,
      servicedInterestGBP,
      totalInterest,

      // Payment
      monthlyPaymentGBP,
      directDebit: monthlyPaymentGBP,

      // APR
      aprcAnnual,
      aprcMonthly,
      totalAmountRepayable,

      // Other
      tier: tierName,
      tierName: tierName,
      icr,
      productKind,
      
      // Additional fields for UI display
      propertyValue: pv,
      rent: rent,
      topSlicing: topSlice,
    };
  }

  /**
   * Convenience method to calculate for a specific rate record
   * Automatically determines product kind from rate record
   */
  static calculateForRate(rateRecord, inputs) {
    const {
      grossLoan,
      propertyValue,
      monthlyRent = 0,
      topSlicing = 0,
      useSpecificNet = false,
      specificNetLoan = 0,
      termMonths,
      bbrAnnual = 0.04,
      procFeePct = 1,
      brokerFeeFlat = 0,
      brokerClientFee = 0,
      rolledMonthsOverride,
      deferredRateOverride,
      // Broker settings for automatic fee calculation
      brokerSettings = null,
    } = inputs;

    // Calculate broker client fee from broker settings if provided
    let calculatedBrokerClientFee = brokerClientFee;
    if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
      const grossValue = parseNumber(grossLoan);
      const feeAmount = parseNumber(brokerSettings.additionalFeeAmount);
      
      if (brokerSettings.feeCalculationType === 'percentage' && grossValue > 0) {
        calculatedBrokerClientFee = grossValue * (feeAmount / 100);
      } else {
        calculatedBrokerClientFee = feeAmount;
      }
    }

    // Calculate broker commission percentage from broker settings
    let calculatedProcFeePct = procFeePct;
    if (brokerSettings?.clientType === 'Broker') {
      calculatedProcFeePct = parseNumber(brokerSettings.brokerCommissionPercent) || 0.9;
    } else if (brokerSettings?.clientType === 'Direct') {
      calculatedProcFeePct = 0;
    }

    // Determine product kind from rate record
    const setKey = (rateRecord.set_key || '').toString().toLowerCase();
    let productKind = 'bridge-fix';
    
    if (setKey === 'fusion') {
      productKind = 'fusion';
    } else if (setKey.includes('var')) {
      productKind = 'bridge-var';
    } else if (setKey.includes('fix')) {
      productKind = 'bridge-fix';
    }

    // Determine if commercial
    const property = (rateRecord.property || '').toString().toLowerCase();
    const isCommercial = property.includes('commercial') && !property.includes('semi');

    // Get term: Fusion always uses 24 months, Bridge uses provided term or rate record
    const term = productKind === 'fusion' 
      ? 24 
      : (termMonths || parseNumber(rateRecord.max_term) || 12);

    // Get arrangement fee from rate record
    const arrangementPct = (parseNumber(rateRecord.product_fee) || 2) / 100;

    // Get admin fee from rate record
    const adminFee = parseNumber(rateRecord.admin_fee) || 0;

    // Determine rolled months and deferred rate
    let rolledMonths = 0;
    let deferredAnnualRate = 0;

    if (productKind === 'fusion') {
      // Fusion typically has rolled interest (6-12 months, independent of term)
      const minRolled = parseNumber(rateRecord.min_rolled_months) || 6;
      const maxRolled = parseNumber(rateRecord.max_rolled_months) || 12;
      rolledMonths = rolledMonthsOverride !== undefined 
        ? Math.min(Math.max(rolledMonthsOverride, minRolled), maxRolled)
        : minRolled;

      // Fusion: deferred interest defaults to 0, user can adjust up to max_defer_int
      const maxDefer = parseNumber(rateRecord.max_defer_int) || 0;
      deferredAnnualRate = deferredRateOverride !== undefined
        ? Math.min(deferredRateOverride / 100, maxDefer / 100)
        : 0; // Default to 0, not max
    } else {
      // Bridge products: rolled months cannot exceed loan term
      const minRolled = parseNumber(rateRecord.min_rolled_months) || 3;
      const maxRolledFromRate = parseNumber(rateRecord.max_rolled_months) || 18;
      const maxRolled = Math.min(maxRolledFromRate, term); // Cap at loan term
      
      rolledMonths = rolledMonthsOverride !== undefined
        ? Math.min(Math.max(rolledMonthsOverride, minRolled), maxRolled)
        : minRolled;
      
      // Bridge products: deferred interest is always 0 (not supported)
      deferredAnnualRate = 0;
    }

    // Run the calculation
    return this.solve({
      productKind,
      grossLoan,
      propertyValue,
      rateRecord,
      isCommercial,
      bbrAnnual,
      rentPm: monthlyRent,
      topSlicingPm: topSlicing,
      termMonths: term,
      rolledMonths,
      arrangementPct,
      deferredAnnualRate,
      procFeePct: calculatedProcFeePct,
      brokerFeeFlat,
      brokerClientFee: calculatedBrokerClientFee,
      adminFee,
      useSpecificNet,
      specificNetLoan,
    });
  }
}

/**
 * Named export for compatibility
 */
export const solveBridgeFusion = BridgeFusionCalculator.solve.bind(BridgeFusionCalculator);
export const calculateBridgeFusionForRate = BridgeFusionCalculator.calculateForRate.bind(BridgeFusionCalculator);
