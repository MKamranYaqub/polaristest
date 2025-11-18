/**
 * Custom hook for fetching and managing BTL rates data
 * Handles Supabase queries for rates and criteria
 */

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';

export function useBTLRates(criteriaSet = 'BTL') {
  const { supabase } = useSupabase();
  const [allCriteria, setAllCriteria] = useState([]);
  const [questions, setQuestions] = useState({});
  const [ratesData, setRatesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch criteria questions from Supabase
   */
  const fetchCriteria = useCallback(async () => {
    try {
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('criteria')
        .select('*')
        .eq('criteria_set', criteriaSet)
        .order('question_order', { ascending: true });

      if (criteriaError) throw criteriaError;

      setAllCriteria(criteriaData || []);

      // Build questions map
      const questionsMap = {};
      (criteriaData || []).forEach(crit => {
        questionsMap[crit.question_id] = crit;
      });
      setQuestions(questionsMap);

      return criteriaData;
    } catch (err) {
      console.error('Error fetching criteria:', err);
      setError(err.message);
      return [];
    }
  }, [supabase, criteriaSet]);

  /**
   * Fetch rates from Supabase
   */
  const fetchRates = useCallback(async () => {
    try {
      const { data: ratesDataFetched, error: ratesError } = await supabase
        .from('rates')
        .select('*')
        .eq('active', true);

      if (ratesError) throw ratesError;

      setRatesData(ratesDataFetched || []);
      return ratesDataFetched;
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError(err.message);
      return [];
    }
  }, [supabase]);

  /**
   * Fetch all data on mount
   */
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchCriteria(),
          fetchRates()
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (supabase) {
      fetchAllData();
    }
  }, [supabase, fetchCriteria, fetchRates]);

  /**
   * Refresh rates data
   */
  const refreshRates = useCallback(async () => {
    setLoading(true);
    const data = await fetchRates();
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
    refreshRates,
    refreshCriteria
  };
}
