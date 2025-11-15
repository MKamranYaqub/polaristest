/**
 * BTL Calculation Engine Tests
 * Verify key formulas and logic
 */

import { computeBTLLoan } from '../btlCalculationEngine';
import { LOAN_TYPES } from '../../config/constants';

describe('BTL Calculation Engine', () => {
  // Mock rate with all required fields
  const mockRate = {
    rate: 6.5, // 6.5%
    min_loan: 50000,
    max_loan: 5000000,
    max_ltv: 75, // 75%
    min_icr: 145, // 145%
    term_months: 24,
    max_rolled_months: 12,
    min_rolled_months: 0,
    max_defer_int: 1.5,
    min_defer_int: 0,
    admin_fee: 500,
    exit_fee: 0,
    product_fee: 2, // 2%
  };

  describe('Max LTV Loan Type', () => {
    it('should calculate gross loan based on LTV', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75, // 75%
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeGreaterThan(0);
      // Max gross should be ~375,000 (75% of 500k)
      expect(result.grossLoan).toBeLessThanOrEqual(375000);
      expect(result.ltv).toBeCloseTo(result.grossLoan / 500000, 4);
    });
  });

  describe('Specific Gross Loan Type', () => {
    it('should use specified gross loan amount', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeCloseTo(300000, 0);
    });
  });

  describe('Specific Net Loan Type', () => {
    it('should work backwards from net to find gross', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificNetLoan: '250000',
        loanType: LOAN_TYPES.SPECIFIC_NET,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.netLoan).toBeCloseTo(250000, 0);
      expect(result.grossLoan).toBeGreaterThan(250000); // Gross > Net due to fees
    });
  });

  describe('Core Residential Floor Rate', () => {
    it('should apply 5% floor to Core Residential products', () => {
      const lowRateMock = { ...mockRate, rate: 3.5 }; // Below 5%
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: lowRateMock,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'core', // Core product
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Display rate should be at least 5% due to floor
      expect(result.actualRateUsed).toBeGreaterThanOrEqual(5);
    });

    it('should NOT apply floor to Specialist products', () => {
      const lowRateMock = { ...mockRate, rate: 3.5 };
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: lowRateMock,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist', // Specialist - no floor
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.actualRateUsed).toBeLessThan(5); // Should be ~3.5%
    });
  });

  describe('ICR Constraint', () => {
    it('should limit loan based on rental income', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '1000', // Low rent - should limit loan
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // With low rent, loan should be limited by ICR
      expect(result.grossLoan).toBeLessThan(375000); // Less than max LTV cap
      expect(result.icr).toBeGreaterThanOrEqual(1.45); // Should meet 145% ICR
    });
  });

  describe('Retention Products', () => {
    it('should apply 65% LTV cap for retention 65', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        retentionLtv: '65', // 65% retention
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'Yes',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Max should be 65% of 500k = 325k
      expect(result.grossLoan).toBeLessThanOrEqual(325000);
      expect(result.ltv).toBeLessThanOrEqual(0.65);
    });
  });

  describe('Fee Calculations', () => {
    it('should calculate product fee correctly', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // 2% of 300k = 6000
      expect(result.productFeeAmount).toBeCloseTo(6000, 0);
    });
  });

  describe('Optimization', () => {
    it('should optimize rolled and deferred to maximize net loan', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '3000',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.rolledMonths).toBeDefined();
      expect(result.deferredCapPct).toBeDefined();
      // Net should be less than gross due to fees and interest
      expect(result.netLoan).toBeLessThan(result.grossLoan);
    });
  });

  describe('Manual Mode', () => {
    it('should use manual rolled/deferred values when provided', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
        manualRolled: 6,
        manualDeferred: 1.0,
      });

      expect(result).toBeTruthy();
      expect(result.rolledMonths).toBe(6);
      expect(result.deferredCapPct).toBeCloseTo(1.0, 1);
      expect(result.isManual).toBe(true);
    });
  });
});
