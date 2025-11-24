import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

/**
 * Custom hook to manage results table row ordering
 * @param {string} calculatorType - 'btl', 'bridge', or 'core'
 * @returns {Object} - { rowOrder: Array, getOrderedRows: Function, loading: boolean }
 */
export function useResultsRowOrder(calculatorType) {
  const { supabase } = useSupabase();
  const [rowOrder, setRowOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load row order settings from localStorage first, then Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try localStorage first for immediate access
        const localData = localStorage.getItem('results_table_row_order');
        if (localData) {
          const settings = JSON.parse(localData);
          const calcSettings = calculatorType === 'btl' ? settings.btl : 
                              calculatorType === 'bridge' ? settings.bridge :
                              calculatorType === 'core' ? settings.core : null;
          if (calcSettings && Array.isArray(calcSettings)) {
            setRowOrder(calcSettings);
            setLoading(false);
            return;
          }
        }

        // Fallback to Supabase if localStorage doesn't have the data
        if (supabase) {
          const { data, error } = await supabase
            .from('app_constants')
            .select('results_row_order')
            .eq('key', 'results_table_row_order')
            .maybeSingle();

          if (data && data.results_row_order) {
            const settings = typeof data.results_row_order === 'string' 
              ? JSON.parse(data.results_row_order) 
              : data.results_row_order;
            const calcSettings = calculatorType === 'btl' ? settings.btl : 
                                calculatorType === 'bridge' ? settings.bridge :
                                calculatorType === 'core' ? settings.core : null;
            
            if (calcSettings && Array.isArray(calcSettings)) {
              setRowOrder(calcSettings);
              // Also save to localStorage for faster future access
              localStorage.setItem('results_table_row_order', JSON.stringify(settings));
            }
          }
        }
      } catch (err) {
        // Error loading settings
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [supabase, calculatorType]);

  // Listen for storage events to update when settings change
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'results_table_row_order' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          const calcSettings = calculatorType === 'btl' ? settings.btl : 
                              calculatorType === 'bridge' ? settings.bridge :
                              calculatorType === 'core' ? settings.core : null;
          if (calcSettings && Array.isArray(calcSettings)) {
            setRowOrder(calcSettings);
          }
        } catch (err) {
          // Error parsing storage event
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [calculatorType]);

  /**
   * Sort an array of row names according to the configured order
   * @param {Array<string>} rows - Array of row names to order
   * @returns {Array<string>} - Ordered array of row names
   */
  const getOrderedRows = (rows) => {
    // If no order configured, return rows as-is
    if (!rowOrder || rowOrder.length === 0) {
      return rows;
    }

    // Create a map for quick lookup of row positions
    const orderMap = new Map();
    rowOrder.forEach((row, index) => {
      orderMap.set(row, index);
    });

    // Sort rows by their position in the order array
    // Rows not in the order array will be sorted to the end alphabetically
    return [...rows].sort((a, b) => {
      const orderA = orderMap.has(a) ? orderMap.get(a) : 9999;
      const orderB = orderMap.has(b) ? orderMap.get(b) : 9999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If both have the same order (or both not in order), sort alphabetically
      return a.localeCompare(b);
    });
  };

  return {
    rowOrder,
    getOrderedRows,
    loading
  };
}
