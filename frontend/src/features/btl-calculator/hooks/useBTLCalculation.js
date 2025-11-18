/**
 * Custom hook for BTL calculation logic
 * Manages the calculation process, results, and loading states
 */

import { useState, useCallback, useEffect } from 'react';
import { computeBTLLoan } from '../../../utils/btlCalculationEngine';
import { computeTierFromAnswers } from '../../../utils/calculator/rateFiltering';

export function useBTLCalculation() {
  const [results, setResults] = useState([]);
  const [relevantRates, setRelevantRates] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [lastCalculationInputs, setLastCalculationInputs] = useState(null);

  /**
   * Validate inputs before calculation
   */
  const validateInputs = useCallback((inputs) => {
    const errors = [];

    if (!inputs.propertyValue || parseFloat(inputs.propertyValue) <= 0) {
      errors.push('Property value must be greater than 0');
    }

    if (!inputs.monthlyRent || parseFloat(inputs.monthlyRent) <= 0) {
      errors.push('Monthly rent must be greater than 0');
    }

    if (!inputs.loanType) {
      errors.push('Please select a loan calculation type');
    }

    if (!inputs.productScope) {
      errors.push('Please select a product scope');
    }

    if (inputs.loanType === 'specificGross' && (!inputs.specificGrossLoan || parseFloat(inputs.specificGrossLoan) <= 0)) {
      errors.push('Specific gross loan must be greater than 0');
    }

    if (inputs.loanType === 'specificNet' && (!inputs.specificNetLoan || parseFloat(inputs.specificNetLoan) <= 0)) {
      errors.push('Specific net loan must be greater than 0');
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }, []);

  /**
   * Perform BTL calculation
   */
  const calculate = useCallback(async (inputs, ratesData, brokerSettings) => {
    setError(null);
    
    // Validate inputs
    const validationError = validateInputs(inputs);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsCalculating(true);
    
    try {
      // Compute tier from criteria answers
      const tier = computeTierFromAnswers(inputs.answers);

      // Filter rates based on product scope, range, and product type
      const filteredRates = ratesData.filter(rate => {
        // Check product scope match
        if (rate.product_scope !== inputs.productScope) return false;
        
        // Check range match (Core or Specialist)
        if (rate.product_range && rate.product_range !== inputs.selectedRange) return false;
        
        // Check product type match if specified
        if (inputs.productType && rate.product_type !== inputs.productType) return false;
        
        return true;
      });

      setRelevantRates(filteredRates);

      // Prepare calculation parameters
      const calculationParams = {
        propertyValue: parseFloat(inputs.propertyValue),
        monthlyRent: parseFloat(inputs.monthlyRent),
        topSlicing: parseFloat(inputs.topSlicing || 0),
        loanCalculationRequested: inputs.loanType,
        specificGrossLoan: inputs.specificGrossLoan ? parseFloat(inputs.specificGrossLoan) : undefined,
        specificNetLoan: inputs.specificNetLoan ? parseFloat(inputs.specificNetLoan) : undefined,
        targetLtv: inputs.maxLtvInput || 75,
        tier: tier,
        addFeesToggle: inputs.addFeesToggle,
        feeCalculationType: inputs.feeCalculationType,
        additionalFeeAmount: inputs.additionalFeeAmount ? parseFloat(inputs.additionalFeeAmount) : 0,
        retentionChoice: inputs.retentionChoice,
        retentionLtv: inputs.retentionLtv ? parseFloat(inputs.retentionLtv) : 75,
        rolledMonthsPerColumn: inputs.rolledMonthsPerColumn || {},
        deferredInterestPerColumn: inputs.deferredInterestPerColumn || {},
        brokerSettings: brokerSettings || {}
      };

      // Perform calculation using the engine
      const calculatedResults = computeBTLLoan(
        filteredRates,
        calculationParams
      );

      setResults(calculatedResults || []);
      setLastCalculationInputs(inputs);
      
      return calculatedResults;
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err.message || 'Calculation failed. Please check your inputs.');
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [validateInputs]);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setRelevantRates([]);
    setError(null);
    setLastCalculationInputs(null);
  }, []);

  /**
   * Recalculate with new slider values
   * (Used when user adjusts rolled months or deferred interest)
   */
  const recalculateWithSliders = useCallback((inputs, ratesData, brokerSettings) => {
    // Only recalculate if we have previous calculation inputs
    if (!lastCalculationInputs) {
      return calculate(inputs, ratesData, brokerSettings);
    }

    // Merge slider updates with last calculation inputs
    const updatedInputs = {
      ...lastCalculationInputs,
      rolledMonthsPerColumn: inputs.rolledMonthsPerColumn,
      deferredInterestPerColumn: inputs.deferredInterestPerColumn,
      manualModeActivePerColumn: inputs.manualModeActivePerColumn
    };

    return calculate(updatedInputs, ratesData, brokerSettings);
  }, [lastCalculationInputs, calculate]);

  return {
    results,
    relevantRates,
    isCalculating,
    error,
    calculate,
    clearResults,
    recalculateWithSliders,
    lastCalculationInputs
  };
}
