/**
 * Quick test to verify loan type normalization
 * Run this in the browser console to test
 */

import { computeBTLLoan } from './btlCalculationEngine';

// Test with different UI loan type strings
const testLoanTypes = [
  'Max gross loan',
  'Net loan required', 
  'Specific gross loan',
  'Specific LTV required'
];

const mockRate = {
  rate: 6.5,
  min_loan: 50000,
  max_loan: 5000000,
  max_ltv: 75,
  min_icr: 145,
  term_months: 24,
  product_fee: 2,
};

console.log('Testing BTL Loan Type Normalization:');
console.log('=====================================\n');

testLoanTypes.forEach(loanType => {
  const result = computeBTLLoan({
    colKey: 'Fee: 2%',
    selectedRate: mockRate,
    propertyValue: '500000',
    monthlyRent: '2500',
    specificNetLoan: '250000',
    specificGrossLoan: '300000',
    maxLtvInput: 75,
    loanType: loanType, // UI string
    productType: '2yr Fix',
    productScope: 'Residential',
    tier: 1,
    selectedRange: 'specialist',
    criteria: {},
    retentionChoice: 'No',
    productFeePercent: 2,
  });
  
  console.log(`Loan Type: "${loanType}"`);
  console.log(`  Gross Loan: £${result?.grossLoan?.toLocaleString() || 'N/A'}`);
  console.log(`  Net Loan: £${result?.netLoan?.toLocaleString() || 'N/A'}`);
  console.log(`  LTV: ${result?.ltv ? (result.ltv * 100).toFixed(2) + '%' : 'N/A'}`);
  console.log('');
});

export { testLoanTypes };
