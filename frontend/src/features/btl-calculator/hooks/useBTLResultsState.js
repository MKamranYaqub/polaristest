/**
 * BTL Results State Hook
 * Manages complex state for results table including sliders, editable fields, and optimized values
 */

import { useState, useRef } from 'react';

export function useBTLResultsState() {
  // Slider controls for results - per-column state
  const [rolledMonthsPerColumn, setRolledMonthsPerColumn] = useState({});
  const [deferredInterestPerColumn, setDeferredInterestPerColumn] = useState({});
  
  // Track whether manual mode has been activated (stays true until reset)
  const [manualModeActivePerColumn, setManualModeActivePerColumn] = useState({});
  
  // Optimized values from calculation engine - per-column state
  const [optimizedRolledPerColumn, setOptimizedRolledPerColumn] = useState({});
  const [optimizedDeferredPerColumn, setOptimizedDeferredPerColumn] = useState({});
  
  // Ref to collect optimized values during render without causing re-renders
  const optimizedValuesRef = useRef({ rolled: {}, deferred: {} });

  // Editable rate and product fee overrides - per-column state
  const [ratesOverrides, setRatesOverrides] = useState({});
  const [productFeeOverrides, setProductFeeOverrides] = useState({});

  /**
   * Update rolled months for a specific column
   */
  const updateRolledMonths = (columnKey, value) => {
    setRolledMonthsPerColumn(prev => ({ ...prev, [columnKey]: value }));
    setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
  };

  /**
   * Update deferred interest for a specific column
   */
  const updateDeferredInterest = (columnKey, value) => {
    setDeferredInterestPerColumn(prev => ({ ...prev, [columnKey]: value }));
    setManualModeActivePerColumn(prev => ({ ...prev, [columnKey]: true }));
  };

  /**
   * Reset sliders for a specific column to optimized values
   */
  const resetSlidersForColumn = (columnKey) => {
    setRolledMonthsPerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setDeferredInterestPerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setManualModeActivePerColumn(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Update rate override for a specific column
   */
  const updateRateOverride = (columnKey, value) => {
    setRatesOverrides(prev => ({ ...prev, [columnKey]: value }));
  };

  /**
   * Reset rate override for a specific column
   */
  const resetRateOverride = (columnKey) => {
    setRatesOverrides(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Update product fee override for a specific column
   */
  const updateProductFeeOverride = (columnKey, value) => {
    setProductFeeOverrides(prev => ({ ...prev, [columnKey]: value }));
  };

  /**
   * Reset product fee override for a specific column
   */
  const resetProductFeeOverride = (columnKey) => {
    setProductFeeOverrides(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  /**
   * Store optimized values from calculation engine
   * Called during render to collect values without triggering re-renders
   */
  const storeOptimizedValues = (columnKey, rolledMonths, deferredCapPct) => {
    optimizedValuesRef.current.rolled[columnKey] = rolledMonths;
    optimizedValuesRef.current.deferred[columnKey] = deferredCapPct;
  };

  /**
   * Sync optimized values from ref to state
   * Called after render cycle completes
   */
  const syncOptimizedValues = () => {
    setOptimizedRolledPerColumn(optimizedValuesRef.current.rolled);
    setOptimizedDeferredPerColumn(optimizedValuesRef.current.deferred);
  };

  /**
   * Reset all optimized values (start of new calculation)
   */
  const resetOptimizedValues = () => {
    optimizedValuesRef.current = { rolled: {}, deferred: {} };
  };

  /**
   * Clear all results state (when clearing results)
   */
  const clearAllResults = () => {
    setRolledMonthsPerColumn({});
    setDeferredInterestPerColumn({});
    setManualModeActivePerColumn({});
    setOptimizedRolledPerColumn({});
    setOptimizedDeferredPerColumn({});
    setRatesOverrides({});
    setProductFeeOverrides({});
    optimizedValuesRef.current = { rolled: {}, deferred: {} };
  };

  /**
   * Load results state from quote data
   */
  const loadResultsFromQuote = (quote) => {
    // Load slider overrides if available
    if (quote.slider_overrides) {
      const { rolled, deferred } = quote.slider_overrides;
      if (rolled) setRolledMonthsPerColumn(rolled);
      if (deferred) setDeferredInterestPerColumn(deferred);
      
      // Mark manual mode for columns with overrides
      const manualColumns = {};
      Object.keys(rolled || {}).forEach(key => { manualColumns[key] = true; });
      Object.keys(deferred || {}).forEach(key => { manualColumns[key] = true; });
      setManualModeActivePerColumn(manualColumns);
    }

    // Load rate overrides
    if (quote.rates_overrides) {
      setRatesOverrides(quote.rates_overrides);
    }

    // Load product fee overrides
    if (quote.product_fee_overrides) {
      setProductFeeOverrides(quote.product_fee_overrides);
    }
  };

  /**
   * Get results state for saving to quote
   */
  const getResultsForSave = () => {
    return {
      slider_overrides: {
        rolled: rolledMonthsPerColumn,
        deferred: deferredInterestPerColumn
      },
      rates_overrides: ratesOverrides,
      product_fee_overrides: productFeeOverrides
    };
  };

  return {
    // State values
    rolledMonthsPerColumn,
    deferredInterestPerColumn,
    manualModeActivePerColumn,
    optimizedRolledPerColumn,
    optimizedDeferredPerColumn,
    optimizedValuesRef,
    ratesOverrides,
    productFeeOverrides,
    
    // Slider functions
    updateRolledMonths,
    updateDeferredInterest,
    resetSlidersForColumn,
    
    // Rate override functions
    updateRateOverride,
    resetRateOverride,
    
    // Product fee override functions
    updateProductFeeOverride,
    resetProductFeeOverride,
    
    // Optimized values functions
    storeOptimizedValues,
    syncOptimizedValues,
    resetOptimizedValues,
    
    // Lifecycle functions
    clearAllResults,
    loadResultsFromQuote,
    getResultsForSave
  };
}
