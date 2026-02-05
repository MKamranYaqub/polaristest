/**
 * Custom hook for fetching and managing BTL rates data
 * Note: This hook is deprecated - BTL calculator now uses API directly
 * This implementation intentionally uses backend API endpoints only.
 */

import { useState, useEffect, useCallback } from 'react';

export function useBTLRates(criteriaSet = 'BTL') {
  // Note: This hook is deprecated - components now use API directly
  const [allCriteria, setAllCriteria] = useState([]);
  const [questions, setQuestions] = useState({});
  const [ratesData, setRatesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch criteria configuration via backend API
   */
  const fetchCriteria = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const params = new URLSearchParams();
      if (criteriaSet) params.append('criteria_set', criteriaSet);

      const response = await fetch(`${API_BASE}/api/criteria?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch criteria: ${response.statusText}`);
      }

      const { criteria } = await response.json();
      const criteriaData = criteria || [];

      setAllCriteria(criteriaData);

      // Build questions map
      const questionsMap = {};
      (criteriaData || []).forEach(crit => {
        const key = crit.question_key || crit.question_id || crit.id;
        if (!key) return;
        if (!questionsMap[key]) questionsMap[key] = crit;
      });
      setQuestions(questionsMap);

      return criteriaData;
    } catch (err) {
      console.error('Error fetching criteria:', err);
      setError(err.message);
      return [];
    }
  }, [criteriaSet]);

  /**
   * Fetch rates from rates_flat table via API
   */
  const fetchRates = useCallback(async (inputs) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Build query parameters based on inputs
      const params = new URLSearchParams();
      
      // Determine set_key based on selected range and retention
      if (inputs?.retentionChoice && inputs.retentionChoice !== 'no') {
        // Retention products
        const retentionLtv = inputs.retentionLtv || 75;
        if (inputs.selectedRange === 'core') {
          params.append('set_key', `RATES_CORE_RETENTION_${retentionLtv}`);
        } else {
          params.append('set_key', `RATES_RETENTION_${retentionLtv}`);
        }
      } else {
        // Non-retention products
        if (inputs?.selectedRange === 'core') {
          params.append('set_key', 'RATES_CORE');
        } else {
          params.append('set_key', 'RATES_SPEC');
        }
      }
      
      // Add property filter if specified
      if (inputs?.productScope) {
        params.append('property', inputs.productScope);
      }
      
      const response = await fetch(`${API_BASE}/api/rates?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }
      
      const { rates } = await response.json();
      setRatesData(rates || []);
      return rates;
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Fetch all data on mount
   */
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch criteria first, rates will be fetched when calculate is called with inputs
        await fetchCriteria();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchCriteria]);

  /**
   * Refresh rates data
   */
  const refreshRates = useCallback(async (inputs) => {
    setLoading(true);
    const data = await fetchRates(inputs);
    setLoading(false);
    return data;
  }, [fetchRates]);

  /**
   * Refresh criteria data
   */
  const refreshCriteria = useCallback(async () => {
    setLoading(true);
    const data = await fetchCriteria();
    setLoading(false);
    return data;
  }, [fetchCriteria]);

  return {
    allCriteria,
    questions,
    ratesData,
    loading,
    error,
    fetchRates,
    refreshRates,
    refreshCriteria,
    fetchCriteria
  };
}
