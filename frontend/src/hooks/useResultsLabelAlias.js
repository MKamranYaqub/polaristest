/**
 * Hook to get display labels for results table rows
 * Labels can be customized via global settings (GlobalSettings UI)
 * 
 * Usage:
 *   const { getLabel } = useResultsLabelAlias();
 *   const displayLabel = getLabel('Gross Loan'); // Returns customized label or original
 */

import { useState, useEffect, useCallback } from 'react';
import { LOCALSTORAGE_CONSTANTS_KEY } from '../config/constants';
import { useSupabase } from '../contexts/SupabaseContext';

// Default label aliases - returns the original label by default
// All label alias configuration is managed in GlobalSettings.jsx
const DEFAULT_LABEL_ALIASES = {};

export function useResultsLabelAlias() {
  const { supabase } = useSupabase();
  const [labelAliases, setLabelAliases] = useState(DEFAULT_LABEL_ALIASES);

  // Load overrides from Supabase and localStorage on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        // First try to load from Supabase (uses dedicated label_aliases column)
        if (supabase) {
          const { data, error } = await supabase
            .from('app_constants')
            .select('label_aliases, value')
            .eq('key', 'results_table_label_aliases')
            .maybeSingle();

          // Check for label_aliases column first (new), then fall back to value column (legacy)
          const labelAliasData = data?.label_aliases || data?.value;
          if (!error && data && labelAliasData) {
            const settings = typeof labelAliasData === 'string' ? JSON.parse(labelAliasData) : labelAliasData;
            const mergedAliases = {
              ...settings.btl,
              ...settings.bridge,
              ...settings.core
            };
            setLabelAliases(mergedAliases);
            
            // Update localStorage for consistency
            let existingConstants = {};
            try {
              const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
              if (stored) existingConstants = JSON.parse(stored);
            } catch (e) { /* ignore */ }
            
            localStorage.setItem(LOCALSTORAGE_CONSTANTS_KEY, JSON.stringify({
              ...existingConstants,
              resultsLabelAliases: mergedAliases
            }));
            return;
          }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.resultsLabelAliases && typeof parsed.resultsLabelAliases === 'object') {
            setLabelAliases(parsed.resultsLabelAliases);
          }
        }
      } catch (e) {
        console.warn('Failed to load label aliases:', e);
      }
    };

    loadOverrides();

    // Listen for storage events (when another tab updates constants)
    const handleStorageChange = (e) => {
      if (e.key === LOCALSTORAGE_CONSTANTS_KEY) {
        loadOverrides();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handleCustomEvent = () => loadOverrides();
    window.addEventListener('constantsUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('constantsUpdated', handleCustomEvent);
    };
  }, [supabase]);

  /**
   * Get the display label for a field
   * @param {string} internalName - The internal field name
   * @returns {string} - The display label (alias if configured, otherwise original)
   */
  const getLabel = useCallback((internalName) => {
    return labelAliases[internalName] || internalName;
  }, [labelAliases]);

  /**
   * Get all label aliases (for admin UI)
   */
  const getAllAliases = useCallback(() => {
    return { ...labelAliases };
  }, [labelAliases]);

  return {
    getLabel,
    getAllAliases,
    labelAliases
  };
}

export default useResultsLabelAlias;
