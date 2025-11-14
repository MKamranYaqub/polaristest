/**
 * Core Loan Calculation Engine
 * Refactored for readability, modularity, and clarity
 */

import { parseNumber } from './formatters';
import { getMaxLTV, applyFloorRate } from './rateSelectors';
import {
  LOAN_TYPES,
  PRODUCT_GROUPS,
  PROPERTY_TYPES,
} from '../config/constants';

export class CalculationEngine {
  constructor(params) {
    this.params = params;
    this.initialize();
  }

  /** Initialize all calculation parameters */
  initialize() {
    const {
      colKey,
      selected,
      overriddenRate,
      propertyValue,
      monthlyRent,
      specificNetLoan,
      specificGrossLoan,
      specificLTV,
      loanTypeRequired,
      productType,
      tier,
      criteria,
      propertyType,
      productGroup,
      isRetention,
      retentionLtv,
      limits,
      feeOverrides,
    } = this.params;

    // --- Core identifiers
    this.colKey = colKey;
    this.selected = selected;
    this.overriddenRate = overriddenRate ?? null;
    this.productType = productType;
    this.tier = tier;
    this.criteria = criteria;
    this.propertyType = propertyType;
    this.productGroup = productGroup;
    this.isRetention = isRetention;
    this.retentionLtv = retentionLtv;
    this.loanTypeRequired = loanTypeRequired;
    this.limits = limits;

    // --- Numeric conversions
    this.propertyValue = parseNumber(propertyValue);
    this.monthlyRent = parseNumber(monthlyRent);
    this.specificNetLoan = parseNumber(specificNetLoan);
    this.specificGrossLoan = parseNumber(specificGrossLoan);
    this.specificLTV = parseNumber(specificLTV);

    // --- Fee percentage handling
    const feeValue =
      feeOverrides?.[colKey] != null ? feeOverrides[colKey] : colKey;
    this.feePctDecimal = Number(feeValue) / 100;

    // --- Rate setup
    this.baseRate = selected?.[colKey];
    this.actualRate = this.overriddenRate ?? this.baseRate;
    this.isTracker = Boolean(selected?.isMargin);

    // --- Limits and terms
    this.minimumICR = productType.includes('Fix')
      ? limits.MIN_ICR_FIX
      : limits.MIN_ICR_TRK;

    this.termMonths = limits.TERM_MONTHS?.[productType] ?? 24;

    this.maxDeferredRate = this.isTracker
      ? limits.MAX_DEFERRED_TRACKER
      : limits.MAX_DEFERRED_FIX;

    // --- Derived maximum LTV
    this.maxLtvPct = getMaxLTV({
      propertyType: this.propertyType,
      isRetention: this.isRetention,
      retentionLtv: this.retentionLtv,
      propertyAnswers: this.criteria,
      tier: this.tier,
      productType: this.productType,
    });
  }

  /** Apply product floor rate rules */
  applyFloor(rate) {
    const { productGroup, propertyType } = this;
    const requiresFloor =
      productGroup === PRODUCT_GROUPS.CORE &&
      propertyType === PROPERTY_TYPES.RESIDENTIAL;

    return requiresFloor ? applyFloorRate(rate, productGroup, propertyType) : rate;
  }

  /** Compute display and stress rates */
  computeRates() {
    const { limits, isTracker, actualRate } = this;

    const displayBaseRate = isTracker
      ? actualRate + limits.STANDARD_BBR
      : actualRate;

    const stressBaseRate = isTracker
      ? actualRate + limits.STRESS_BBR
      : displayBaseRate;

    return {
      displayRate: this.applyFloor(displayBaseRate),
      stressRate: this.applyFloor(stressBaseRate),
    };
  }

  /** Compute loan cap based on LTV rules and type */
  computeLtvCap() {
    const {
      propertyValue,
      maxLtvPct,
      specificGrossLoan,
      specificLTV,
      loanTypeRequired,
      specificNetLoan,
      limits,
    } = this;

    const ltvCap = propertyValue ? maxLtvPct * propertyValue : Infinity;
    const specificLtvCap =
      loanTypeRequired === LOAN_TYPES.MAX_LTV && specificLTV
        ? propertyValue * specificLTV
        : Infinity;

    let loanCap =
      loanTypeRequired === LOAN_TYPES.MAX_LTV
        ? Math.min(specificLtvCap, ltvCap)
        : ltvCap;

    if (
      loanTypeRequired === LOAN_TYPES.SPECIFIC_GROSS &&
      specificGrossLoan > 0
    ) {
      loanCap = Math.min(loanCap, specificGrossLoan);
    }

    return Math.min(loanCap, limits.MAX_LOAN);
  }

  /** Evaluate loan combination (rolled months, deferred rate) */
  evaluateLoan(rolledMonths, deferredRate) {
    const {
      limits,
      propertyValue,
      monthlyRent,
      loanTypeRequired,
      specificNetLoan,
      termMonths,
      minimumICR,
      feePctDecimal,
    } = this;

    const { displayRate, stressRate } = this.computeRates();

    const remainingMonths = Math.max(termMonths - rolledMonths, 1);
    const stressAdjRate = Math.max(stressRate - deferredRate, 1e-6);

    // --- Rental-based cap (ICR)
    const annualRent = monthlyRent * termMonths;
    const maxFromRent =
      monthlyRent && stressAdjRate > 0
        ? annualRent / (minimumICR * (stressAdjRate / 12) * remainingMonths)
        : Infinity;

    // --- From net loan
    let grossFromNet = Infinity;
    if (
      loanTypeRequired === LOAN_TYPES.SPECIFIC_NET &&
      specificNetLoan &&
      feePctDecimal < 1
    ) {
      const payRateAdj = Math.max(displayRate - deferredRate, 0);
      const denom =
        1 -
        feePctDecimal -
        (payRateAdj / 12) * rolledMonths -
        (deferredRate / 12) * termMonths;

      if (denom > 1e-7) grossFromNet = specificNetLoan / denom;
    }

    // --- Determine eligible gross
    let eligibleGross = Math.min(
      this.computeLtvCap(),
      maxFromRent,
      limits.MAX_LOAN
    );

    if (loanTypeRequired === LOAN_TYPES.SPECIFIC_NET) {
      eligibleGross = Math.min(eligibleGross, grossFromNet);
    }

    if (eligibleGross < limits.MIN_LOAN) eligibleGross = 0;

    // --- Core computations
    const payRateAdj = Math.max(displayRate - deferredRate, 0);
    const feeAmt = eligibleGross * feePctDecimal;
    const rolledAmt = eligibleGross * (payRateAdj / 12) * rolledMonths;
    const deferredAmt = eligibleGross * (deferredRate / 12) * termMonths;
    const netLoan = eligibleGross - feeAmt - rolledAmt - deferredAmt;

    return {
      grossLoan: eligibleGross,
      netLoan,
      productFeeAmount: feeAmt,
      rolledInterestAmount: rolledAmt,
      deferredInterestAmount: deferredAmt,
      loanToValueRatio: propertyValue ? eligibleGross / propertyValue : null,
      rolledMonths,
      deferredRate,
      paymentRateAdjusted: payRateAdj,
      icr: this.computeICR(eligibleGross, payRateAdj, rolledMonths, termMonths),
    };
  }

  /** ICR = Annual Rent / Annualized Interest */
  computeICR(grossLoan, payRateAdj, rolledMonths, termMonths) {
    const { monthlyRent } = this;
    if (!monthlyRent || grossLoan <= 0 || payRateAdj <= 0) return null;

    const annualRent = monthlyRent * 12;
    const monthlyInterest = grossLoan * (payRateAdj / 12);
    const remainingMonths = Math.max(termMonths - rolledMonths, 1);
    const annualizedInterest = (monthlyInterest * remainingMonths * 12) / termMonths;

    return annualRent / annualizedInterest;
  }

  /** Run full loan computation */
  compute() {
    const {
      productGroup,
      propertyType,
      manualRolled,
      manualDeferred,
      limits,
      effectiveProcFeePct,
      brokerFeePct,
      brokerFeeFlat,
    } = this.params;

    let bestLoan = null;

    // --- Core & Residential: direct evaluation
    if (
      productGroup === PRODUCT_GROUPS.CORE &&
      propertyType === PROPERTY_TYPES.RESIDENTIAL
    ) {
      bestLoan = this.evaluateLoan(0, 0);
    }
    // --- Manual input override
    else if (manualRolled != null || manualDeferred != null) {
      const rolled = Math.min(
        Math.max(0, Number(manualRolled) || 0),
        limits.MAX_ROLLED_MONTHS
      );
      const deferred = Math.min(
        Math.max(0, Number(manualDeferred) || 0),
        this.maxDeferredRate
      );
      bestLoan = this.evaluateLoan(rolled, deferred);
    }
    // --- Auto-optimize across rolled/deferred combinations
    else {
      const maxRolled = Math.min(limits.MAX_ROLLED_MONTHS, this.termMonths);
      const step = 0.0001;
      const steps = Math.round(this.maxDeferredRate / step);

      for (let r = 0; r <= maxRolled; r++) {
        for (let i = 0; i <= steps; i++) {
          const candidate = this.evaluateLoan(r, i * step);
          if (!bestLoan || candidate.netLoan > bestLoan.netLoan) {
            bestLoan = candidate;
          }
        }
      }
    }

    if (!bestLoan) return null;

    const { isTracker, actualRate, limits: l } = this;
    const displayRate = isTracker ? actualRate + l.STANDARD_BBR : actualRate;

    const fullRateText = `${(displayRate * 100).toFixed(2)}%${
      isTracker ? ' + BBR' : ''
    }`;
    const payRateText = `${(bestLoan.paymentRateAdjusted * 100).toFixed(2)}%${
      isTracker ? ' + BBR' : ''
    }`;

    const procFeeValue = bestLoan.grossLoan * ((+effectiveProcFeePct || 0) / 100);
    const brokerFeeValue = brokerFeeFlat
      ? Number(brokerFeeFlat)
      : bestLoan.grossLoan * ((+brokerFeePct || 0) / 100);

    const belowMin =
      bestLoan.grossLoan > 0 && bestLoan.grossLoan < limits.MIN_LOAN;
    const hitMax = Math.abs(bestLoan.grossLoan - limits.MAX_LOAN) < 1e-6;

    return {
      productName: `${this.productType}, ${this.tier}`,
      productType: this.productType,
      fullRateText,
      actualRateUsed: displayRate,
      isRateOverridden: this.overriddenRate != null,
      payRateText,
      net: bestLoan.netLoan,
      gross: bestLoan.grossLoan,
      feeAmt: bestLoan.productFeeAmount,
      rolled: bestLoan.rolledInterestAmount,
      deferred: bestLoan.deferredInterestAmount,
      ltv: bestLoan.loanToValueRatio,
      deferredCapPct: bestLoan.deferredRate,
      rolledMonths: bestLoan.rolledMonths,
      termMonths: this.termMonths,
      directDebit: bestLoan.grossLoan * (bestLoan.paymentRateAdjusted / 12),
      ddStartMonth: bestLoan.rolledMonths + 1,
      procFeeValue,
      brokerFeeValue,
      maxLtvRule: this.maxLtvPct,
      belowMin,
      hitMaxCap: hitMax,
      isManual: manualRolled != null || manualDeferred != null,
      icr: bestLoan.icr,
    };
  }
}

/** Wrapper export for compatibility */
export const computeColumnData = (params) => new CalculationEngine(params).compute();
