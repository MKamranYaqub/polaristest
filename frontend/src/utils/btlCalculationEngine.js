/**
 * BTL Loan Calculation Engine
 * Handles all BTL loan calculations including gross loan, net loan, fees, ICR, LTV, etc.
 * Based on the integration/calculationEngine.js pattern
 */

import { parseNumber } from './calculator/numberFormatting';
import { LOAN_TYPES, PRODUCT_GROUPS, PROPERTY_TYPES, MARKET_RATES } from '../config/constants';

export class BTLCalculationEngine {
  constructor(params) {
    this.params = params;
    this.initialize();
  }

  /** Initialize all calculation parameters */
  initialize() {
    const {
      // Column/Rate identifiers
      colKey,
      selectedRate,
      overriddenRate,
      
      // Input values
      propertyValue,
      monthlyRent,
      specificNetLoan,
      specificGrossLoan,
      maxLtvInput,
      topSlicing,
      
      // Product/Type info
      loanType,
      productType,
      productScope,
      tier,
      selectedRange,
      
      // Criteria answers
      criteria,
      retentionChoice,
      retentionLtv,
      
      // Fee data
      productFeePercent,
      feeOverrides,
      
      // Limits from rate/config
      limits = {},
      
      // Manual slider values (optional)
      manualRolled,
      manualDeferred,
      
      // Broker fees
      brokerRoute,
      procFeePct,
      brokerFeePct,
      brokerFeeFlat,
    } = this.params;

    // --- Core identifiers
    this.colKey = colKey;
    this.selectedRate = selectedRate;
    this.overriddenRate = overriddenRate ?? null;
    this.productType = productType;
    this.productScope = productScope;
    this.tier = tier;
    this.selectedRange = selectedRange;
    this.criteria = criteria || {};
    this.retentionChoice = retentionChoice;
    this.retentionLtv = retentionLtv;
    this.loanType = loanType;
    this.limits = limits;
    this.brokerRoute = brokerRoute;

    // --- Numeric conversions
    this.propertyValue = parseNumber(propertyValue);
    this.monthlyRent = parseNumber(monthlyRent);
    this.specificNetLoan = parseNumber(specificNetLoan);
    this.specificGrossLoan = parseNumber(specificGrossLoan);
    this.maxLtvInput = parseNumber(maxLtvInput) / 100; // Convert to decimal
    this.topSlicing = parseNumber(topSlicing);

    // --- Fee percentage handling
    const feeValue = feeOverrides?.[colKey] != null ? feeOverrides[colKey] : productFeePercent;
    this.productFeePercent = parseNumber(feeValue);
    this.feePctDecimal = this.productFeePercent / 100;

    // --- Rate setup
    this.baseRate = selectedRate?.rate;
    this.actualRate = this.overriddenRate ?? this.baseRate;
    
    // Check if tracker product
    this.isTracker = /tracker/i.test(productType || '');
    
    // Check if Core/Residential (special rules)
    this.isCore = selectedRange === 'core' || productScope === 'Core';
    this.isResidential = productScope === 'Residential';
    
    // --- Manual slider overrides
    this.manualRolled = manualRolled;
    this.manualDeferred = manualDeferred;
    
    // --- Broker fees
    this.procFeePct = parseNumber(procFeePct) || 0;
    this.brokerFeePct = parseNumber(brokerFeePct) || 0;
    this.brokerFeeFlat = parseNumber(brokerFeeFlat) || 0;

    // --- Limits and constraints from rate record or defaults
    this.minLoan = selectedRate?.min_loan || limits.MIN_LOAN || 50000;
    this.maxLoan = selectedRate?.max_loan || limits.MAX_LOAN || 25000000;
    this.termMonths = selectedRate?.term_months || limits.TERM_MONTHS || 24;
    
    // ICR requirements
    this.minimumICR = this.isTracker ? 125 : 145; // Default ICR requirements
    if (selectedRate?.min_icr) {
      this.minimumICR = selectedRate.min_icr;
    }
    
    // Rolled and deferred limits from rate
    this.maxRolledMonths = selectedRate?.max_rolled_months || limits.MAX_ROLLED_MONTHS || 24;
    this.minRolledMonths = selectedRate?.min_rolled_months || 0;
    
    this.maxDeferredRate = selectedRate?.max_defer_int || limits.MAX_DEFERRED || 1.5;
    this.minDeferredRate = selectedRate?.min_defer_int || 0;
    
    // Market rates
    this.standardBBR = MARKET_RATES.STANDARD_BBR || 0.04;
    this.stressBBR = MARKET_RATES.STRESS_BBR || 0.0425;
  }

  /** Compute display rate and stress rate */
  computeRates() {
    const { actualRate, isTracker, standardBBR, stressBBR } = this;
    
    // For tracker, add BBR to get display rate
    const displayRate = isTracker 
      ? actualRate + standardBBR 
      : actualRate;
    
    // For stress calculations, use stress BBR for trackers
    const stressRate = isTracker 
      ? actualRate + stressBBR 
      : displayRate;

    return {
      displayRate: displayRate / 100, // Convert to decimal
      stressRate: stressRate / 100,   // Convert to decimal
    };
  }

  /** Get maximum LTV based on loan type and inputs */
  getMaxLTV() {
    const { loanType, maxLtvInput, specificGrossLoan, propertyValue } = this;
    
    // If specific gross loan is provided, calculate max LTV from that
    if (loanType === LOAN_TYPES.SPECIFIC_GROSS && specificGrossLoan > 0 && propertyValue > 0) {
      return specificGrossLoan / propertyValue;
    }
    
    // If max LTV loan type, use the input LTV
    if (loanType === LOAN_TYPES.MAX_LTV) {
      return maxLtvInput;
    }
    
    // Default to maxLtvInput
    return maxLtvInput;
  }

  /** Compute loan cap based on LTV and other constraints */
  computeLoanCap() {
    const { propertyValue, specificGrossLoan, specificNetLoan, loanType, maxLoan } = this;
    const maxLtv = this.getMaxLTV();
    
    // LTV-based cap
    const ltvCap = propertyValue > 0 ? maxLtv * propertyValue : Infinity;
    
    let loanCap = ltvCap;
    
    // Apply specific gross loan constraint
    if (loanType === LOAN_TYPES.SPECIFIC_GROSS && specificGrossLoan > 0) {
      loanCap = Math.min(loanCap, specificGrossLoan);
    }
    
    // Apply max loan limit
    loanCap = Math.min(loanCap, maxLoan);
    
    return loanCap;
  }

  /** Evaluate a specific loan scenario with rolled months and deferred rate */
  evaluateLoan(rolledMonths, deferredRate) {
    const {
      propertyValue,
      monthlyRent,
      topSlicing,
      loanType,
      specificNetLoan,
      termMonths,
      minimumICR,
      feePctDecimal,
      minLoan,
    } = this;

    const { displayRate, stressRate } = this.computeRates();
    
    // Calculate remaining months after rolled period
    const remainingMonths = Math.max(termMonths - rolledMonths, 1);
    
    // Adjust stress rate by deferred interest
    const stressAdjRate = Math.max(stressRate - (deferredRate / 100), 0.0001);
    
    // --- Calculate rental-based cap (ICR constraint)
    const effectiveRent = monthlyRent + (topSlicing || 0);
    const annualRent = effectiveRent * termMonths;
    
    let maxFromRent = Infinity;
    if (effectiveRent > 0 && stressAdjRate > 0) {
      // ICR = (Annual Rent) / (Annual Interest)
      // Annual Interest = Gross * (Rate/12) * RemainingMonths
      // Rearranging: Gross = (Annual Rent) / (ICR * (Rate/12) * RemainingMonths)
      maxFromRent = annualRent / (minimumICR / 100 * (stressAdjRate / 12) * remainingMonths);
    }
    
    // --- Calculate gross from net loan (if specific net loan type)
    let grossFromNet = Infinity;
    if (loanType === LOAN_TYPES.SPECIFIC_NET && specificNetLoan > 0 && feePctDecimal < 1) {
      const payRateAdj = Math.max(displayRate - (deferredRate / 100), 0);
      const denom = 1 - feePctDecimal - (payRateAdj / 12 * rolledMonths) - ((deferredRate / 100) / 12 * termMonths);
      
      if (denom > 0.0001) {
        grossFromNet = specificNetLoan / denom;
      }
    }
    
    // --- Determine eligible gross loan
    let eligibleGross = Math.min(
      this.computeLoanCap(),
      maxFromRent
    );
    
    if (loanType === LOAN_TYPES.SPECIFIC_NET) {
      eligibleGross = Math.min(eligibleGross, grossFromNet);
    }
    
    // Check minimum loan
    if (eligibleGross < minLoan) {
      eligibleGross = 0;
    }
    
    // --- Calculate loan components
    const payRateAdj = Math.max(displayRate - (deferredRate / 100), 0);
    const productFeeAmt = eligibleGross * feePctDecimal;
    const rolledInterestAmt = eligibleGross * payRateAdj * rolledMonths / 12;
    const deferredInterestAmt = eligibleGross * (deferredRate / 100) * termMonths / 12;
    const netLoan = eligibleGross - productFeeAmt - rolledInterestAmt - deferredInterestAmt;
    
    // Calculate LTV
    const ltv = propertyValue > 0 ? eligibleGross / propertyValue : null;
    
    // Calculate ICR
    const icr = this.computeICR(eligibleGross, payRateAdj, rolledMonths, remainingMonths, effectiveRent);
    
    // Calculate direct debit (monthly payment)
    const directDebit = eligibleGross > 0 ? eligibleGross * payRateAdj / 12 : 0;
    
    return {
      grossLoan: eligibleGross,
      netLoan,
      productFeeAmount: productFeeAmt,
      rolledInterestAmount: rolledInterestAmt,
      deferredInterestAmount: deferredInterestAmt,
      loanToValueRatio: ltv,
      rolledMonths,
      deferredRate,
      paymentRateAdjusted: payRateAdj,
      icr,
      directDebit,
      ddStartMonth: rolledMonths + 1,
    };
  }

  /** Calculate ICR = Annual Rent / Annualized Interest */
  computeICR(grossLoan, payRateAdj, rolledMonths, remainingMonths, effectiveRent) {
    if (!effectiveRent || grossLoan <= 0 || payRateAdj <= 0) return null;
    
    const annualRent = effectiveRent * 12;
    const monthlyInterest = grossLoan * (payRateAdj / 12);
    const annualizedInterest = (monthlyInterest * remainingMonths * 12) / this.termMonths;
    
    return annualRent / annualizedInterest;
  }

  /** Run full loan computation with optimization */
  compute() {
    const {
      isCore,
      isResidential,
      manualRolled,
      manualDeferred,
      maxRolledMonths,
      minRolledMonths,
      maxDeferredRate,
      minDeferredRate,
      termMonths,
      procFeePct,
      brokerFeePct,
      brokerFeeFlat,
      minLoan,
      maxLoan,
      isTracker,
      actualRate,
      standardBBR,
      productFeePercent,
    } = this;

    let bestLoan = null;

    // --- Core & Residential: no rolled/deferred allowed
    if (isCore && isResidential) {
      bestLoan = this.evaluateLoan(0, 0);
    }
    // --- Manual input override
    else if (manualRolled != null || manualDeferred != null) {
      const rolled = Math.min(
        Math.max(minRolledMonths, Number(manualRolled) || 0),
        maxRolledMonths
      );
      const deferred = Math.min(
        Math.max(minDeferredRate, Number(manualDeferred) || 0),
        maxDeferredRate
      );
      bestLoan = this.evaluateLoan(rolled, deferred);
    }
    // --- Auto-optimize across rolled/deferred combinations
    else {
      const step = 0.01; // 0.01% increments for deferred rate
      const deferredSteps = Math.round(maxDeferredRate / step);

      for (let r = minRolledMonths; r <= Math.min(maxRolledMonths, termMonths); r++) {
        for (let i = 0; i <= deferredSteps; i++) {
          const deferredVal = minDeferredRate + (i * step);
          const candidate = this.evaluateLoan(r, deferredVal);
          
          if (!bestLoan || candidate.netLoan > bestLoan.netLoan) {
            bestLoan = candidate;
          }
        }
      }
    }

    if (!bestLoan) return null;

    // --- Format output rates
    const displayRate = isTracker ? actualRate + standardBBR : actualRate;
    const fullRateText = `${displayRate.toFixed(2)}%${isTracker ? ' + BBR' : ''}`;
    const payRateText = `${(bestLoan.paymentRateAdjusted * 100).toFixed(2)}%${isTracker ? ' + BBR' : ''}`;

    // --- Calculate broker fees
    const procFeeValue = bestLoan.grossLoan * (procFeePct / 100);
    const brokerFeeValue = brokerFeeFlat > 0
      ? brokerFeeFlat
      : bestLoan.grossLoan * (brokerFeePct / 100);

    // --- Flags
    const belowMin = bestLoan.grossLoan > 0 && bestLoan.grossLoan < minLoan;
    const hitMax = Math.abs(bestLoan.grossLoan - maxLoan) < 1;

    // --- Calculate additional placeholders
    // APRC calculation (simplified - actual APRC requires complex APR calculation)
    const totalInterestCost = bestLoan.rolledInterestAmount + (bestLoan.directDebit * this.termMonths);
    const totalRepayment = bestLoan.grossLoan + totalInterestCost;
    const aprc = bestLoan.grossLoan > 0 
      ? ((totalRepayment - bestLoan.grossLoan) / bestLoan.grossLoan) * (12 / this.termMonths) * 100 
      : null;

    // Admin fee (from rate if available)
    const adminFee = this.selectedRate?.admin_fee || 0;

    // ERC (Early Repayment Charge) schedule from rate columns erc_1..erc_5
    const ercFields = ['erc_1','erc_2','erc_3','erc_4','erc_5'];
    const ercSchedule = [];
    const fmtPct = (n) => {
      const v = parseNumber(n);
      if (!Number.isFinite(v)) return null;
      const s = (v % 1 === 0) ? v.toFixed(0) : v.toFixed(2);
      return `${s}%`;
    };
    ercFields.forEach((key, idx) => {
      const val = this.selectedRate?.[key];
      const f = fmtPct(val);
      if (f) {
        ercSchedule.push({ year: idx + 1, percent: f });
      }
    });
    const ercText = ercSchedule.length > 0
      ? ercSchedule.map(e => `Yr${e.year}: ${e.percent}`).join(' | ')
      : null;

    // Exit fee (from rate if available)
    const exitFee = this.selectedRate?.exit_fee || 0;

    // Revert rate (index + optional margin) from BTL rates per column
    // Supported indexes: 'BBR' (uses MARKET_RATES.STANDARD_BBR), 'MVR' (uses MARKET_RATES.CURRENT_MVR),
    // or a numeric string representing a percent value.
    const revertIndexRaw = this.selectedRate?.revert_index ?? null;
    const revertMarginPct = parseNumber(this.selectedRate?.revert_margin) || 0;
    let revertIndexBasePct = null;
    let revertIndexLabel = null; // For display e.g., 'MVR' or 'BBR'
    if (revertIndexRaw != null && revertIndexRaw !== '') {
      const idx = String(revertIndexRaw).toLowerCase();
      if (idx.includes('bbr')) {
        const bbrDecimal = (this.standardBBR ?? MARKET_RATES.STANDARD_BBR);
        revertIndexBasePct = ((bbrDecimal != null ? bbrDecimal : 0) * 100); // decimals -> percent
        revertIndexLabel = 'BBR';
      } else if (idx.includes('mvr')) {
        revertIndexBasePct = (MARKET_RATES.CURRENT_MVR || 0) * 100; // decimal to percent
        revertIndexLabel = 'MVR';
      } else {
        const parsed = parseNumber(revertIndexRaw);
        if (Number.isFinite(parsed)) {
          revertIndexBasePct = parsed; // already a percent number
        }
      }
    }
    let revertRate = null;
    let revertRateText = null;
    if (revertIndexBasePct != null) {
      revertRate = revertIndexBasePct + (revertMarginPct > 0 ? revertMarginPct : 0);
      const marginText = revertMarginPct > 0 ? `+${revertMarginPct.toFixed(2)}%` : (revertMarginPct < 0 ? `${revertMarginPct.toFixed(2)}%` : '');
      if (revertIndexLabel) {
        // e.g., MVR+0.40%
        revertRateText = `${revertIndexLabel}${marginText}`;
      } else {
        // e.g., 5.25%+0.40% or just 5.25%
        const baseText = `${revertIndexBasePct.toFixed(2)}%`;
        revertRateText = `${baseText}${marginText}`;
      }
    }
    const revertRateDD = revertRate ? bestLoan.grossLoan * (revertRate / 100) / 12 : null;

    // NBP (Net Borrowing Position) - Net loan minus fees
    const nbp = bestLoan.netLoan - adminFee - exitFee;

    // Serviced Interest - interest that's paid monthly (not rolled/deferred)
    const servicedInterest = bestLoan.directDebit * (this.termMonths - bestLoan.rolledMonths);

    // Title Insurance Cost per product (based on gross loan):
    // Excel logic: IF(OR(Gross<=0, Gross>3,000,000), "NA", MAX(392, Gross*0.0013*1.12))
    // We return null for NA so UI shows '—'
    let titleInsuranceCost = null;
    if (bestLoan.grossLoan > 0 && bestLoan.grossLoan <= 3000000) {
      const base = bestLoan.grossLoan * 0.0013; // 0.13%
      const withIpt = base * 1.12; // +12%
      titleInsuranceCost = Math.max(392, withIpt);
    } else {
      titleInsuranceCost = null; // outside range -> not applicable
    }

    // Total Cost to Borrower - all fees and interest
    const totalCostToBorrower = 
      bestLoan.productFeeAmount + 
      bestLoan.rolledInterestAmount + 
      bestLoan.deferredInterestAmount + 
      servicedInterest +
      adminFee + 
      exitFee + 
      procFeeValue + 
      brokerFeeValue +
      titleInsuranceCost;

    return {
      // Product info
      productName: `${this.productType}, Tier ${this.tier}`,
      productType: this.productType,
      
      // Rates
      fullRateText,
      actualRateUsed: displayRate,
      isRateOverridden: this.overriddenRate != null,
      payRateText,
      
      // Loan amounts
      grossLoan: bestLoan.grossLoan,
      netLoan: bestLoan.netLoan,
      productFeeAmount: bestLoan.productFeeAmount,
      productFeePercent: productFeePercent,
      rolledInterestAmount: bestLoan.rolledInterestAmount,
      deferredInterestAmount: bestLoan.deferredInterestAmount,
      
      // Ratios
      ltv: bestLoan.loanToValueRatio,
      netLtv: bestLoan.loanToValueRatio, // Same as LTV for BTL
      icr: bestLoan.icr,
      
      // Payment info
      directDebit: bestLoan.directDebit,
      ddStartMonth: bestLoan.ddStartMonth,
      monthlyInterestCost: bestLoan.directDebit,
      
      // Slider values
      rolledMonths: bestLoan.rolledMonths,
      deferredCapPct: bestLoan.deferredRate,
      termMonths: this.termMonths,
      
      // Broker fees
      procFeePct,
      procFeeValue,
      brokerFeePct,
      brokerFeeValue,
      
      // Flags
      belowMin,
      hitMaxCap: hitMax,
      isManual: manualRolled != null || manualDeferred != null,
      
      // Additional fields for compatibility
      maxLtvRule: this.getMaxLTV(),
      
      // Additional placeholders
      aprc,
      adminFee,
      brokerClientFee: brokerFeeValue, // Alias for broker fee
        ercText,
      exitFee,
      nbp,
  revertRate,
  revertRateText,
      revertRateDD,
      servicedInterest,
      titleInsuranceCost,
      totalCostToBorrower,
      totalLoanTerm: this.termMonths,
    };
  }
}

/** Wrapper export for compatibility */
export const computeBTLLoan = (params) => new BTLCalculationEngine(params).compute();
