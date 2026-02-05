import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';
import {
  MARKET_RATES as DEFAULT_MARKET_RATES,
  PRODUCT_TYPES_LIST as DEFAULT_PRODUCT_TYPES_LIST,
  FEE_COLUMNS as DEFAULT_FEE_COLUMNS,
  FLAT_ABOVE_COMMERCIAL_RULE as DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
  BROKER_ROUTES as DEFAULT_BROKER_ROUTES,
  BROKER_COMMISSION_DEFAULTS as DEFAULT_BROKER_COMMISSION_DEFAULTS,
  BROKER_COMMISSION_TOLERANCE as DEFAULT_BROKER_COMMISSION_TOLERANCE,
  FUNDING_LINES_BTL as DEFAULT_FUNDING_LINES_BTL,
  FUNDING_LINES_BRIDGE as DEFAULT_FUNDING_LINES_BRIDGE,
  LOCALSTORAGE_CONSTANTS_KEY,
} from '../config/constants';

/**
 * AppSettingsContext
 * 
 * Provides centralized access to app settings (market rates, broker settings, etc.)
 * from backend API, with localStorage fallback.
 * 
 * This solves the issue where localStorage is unavailable or partitioned in
 * Salesforce iframe contexts due to third-party storage restrictions.
 * 
 * Priority order:
 * 1. Backend API (source of truth)
 * 2. localStorage cache (for offline/quick access)
 * 3. Hardcoded defaults (failsafe)
 */

const AppSettingsContext = createContext(null);

// Helper to safely read from localStorage
function readLocalStorage(key) {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper to safely write to localStorage
function writeLocalStorage(key, value) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // localStorage may be unavailable (iframe restrictions, quota exceeded, etc.)
    console.warn('Unable to write to localStorage - may be in restricted iframe context');
  }
}

// Helper to detect if we're in an iframe
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe - accessing window.top throws
    return true;
  }
}

export function AppSettingsProvider({ children }) {
  const { token } = useAuth();
  
  // Initialize from localStorage synchronously (if available) before async Supabase fetch
  // This provides immediate values for components that render before Supabase responds
  const initialState = (() => {
    const localOverrides = readLocalStorage(LOCALSTORAGE_CONSTANTS_KEY);
    return {
      marketRates: localOverrides?.marketRates || DEFAULT_MARKET_RATES,
      productLists: localOverrides?.productLists || DEFAULT_PRODUCT_TYPES_LIST,
      feeColumns: localOverrides?.feeColumns || DEFAULT_FEE_COLUMNS,
      flatAboveCommercialRule: localOverrides?.flatAboveCommercialRule || DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
      brokerRoutes: localOverrides?.brokerRoutes || DEFAULT_BROKER_ROUTES,
      brokerCommissionDefaults: localOverrides?.brokerCommissionDefaults || DEFAULT_BROKER_COMMISSION_DEFAULTS,
      brokerCommissionTolerance: localOverrides?.brokerCommissionTolerance ?? DEFAULT_BROKER_COMMISSION_TOLERANCE,
      fundingLinesBTL: localOverrides?.fundingLinesBTL || DEFAULT_FUNDING_LINES_BTL,
      fundingLinesBridge: localOverrides?.fundingLinesBridge || DEFAULT_FUNDING_LINES_BRIDGE,
      // Results configuration (visibility, row order, label aliases)
      resultsVisibility: localOverrides?.resultsVisibility || {},
      resultsRowOrder: localOverrides?.resultsRowOrder || {},
      resultsLabelAliases: localOverrides?.resultsLabelAliases || {},
      headerColors: localOverrides?.headerColors || {},
    };
  })();
  
  const [marketRates, setMarketRates] = useState(initialState.marketRates);
  const [productLists, setProductLists] = useState(initialState.productLists);
  const [feeColumns, setFeeColumns] = useState(initialState.feeColumns);
  const [flatAboveCommercialRule, setFlatAboveCommercialRule] = useState(initialState.flatAboveCommercialRule);
  const [brokerRoutes, setBrokerRoutes] = useState(initialState.brokerRoutes);
  const [brokerCommissionDefaults, setBrokerCommissionDefaults] = useState(initialState.brokerCommissionDefaults);
  const [brokerCommissionTolerance, setBrokerCommissionTolerance] = useState(initialState.brokerCommissionTolerance);
  const [fundingLinesBTL, setFundingLinesBTL] = useState(initialState.fundingLinesBTL);
  const [fundingLinesBridge, setFundingLinesBridge] = useState(initialState.fundingLinesBridge);
  const [resultsVisibility, setResultsVisibility] = useState(initialState.resultsVisibility);
  const [resultsRowOrder, setResultsRowOrder] = useState(initialState.resultsRowOrder);
  const [resultsLabelAliases, setResultsLabelAliases] = useState(initialState.resultsLabelAliases);
  const [headerColors, setHeaderColors] = useState(initialState.headerColors);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isIframe] = useState(isInIframe);
  const [initialized, setInitialized] = useState(false);

  // Load ALL settings from backend API (app_settings + results_configuration)
  const loadFromAPI = useCallback(async () => {
    if (!token) {
      // Token not ready yet - this is normal on initial load
      return null;
    }

    try {
      // Load from both endpoints in parallel
      const [appSettingsRes, resultsConfigRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/settings?keys=market_rates,product_lists,fee_columns,flat_above_commercial_rule,broker_routes,broker_commission_defaults,broker_commission_tolerance,funding_lines_btl,funding_lines_bridge`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/results-configuration`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const settings = {
        marketRates: DEFAULT_MARKET_RATES,
        productLists: DEFAULT_PRODUCT_TYPES_LIST,
        feeColumns: DEFAULT_FEE_COLUMNS,
        flatAboveCommercialRule: DEFAULT_FLAT_ABOVE_COMMERCIAL_RULE,
        brokerRoutes: DEFAULT_BROKER_ROUTES,
        brokerCommissionDefaults: DEFAULT_BROKER_COMMISSION_DEFAULTS,
        brokerCommissionTolerance: DEFAULT_BROKER_COMMISSION_TOLERANCE,
        fundingLinesBTL: DEFAULT_FUNDING_LINES_BTL,
        fundingLinesBridge: DEFAULT_FUNDING_LINES_BRIDGE,
        resultsVisibility: {},
        resultsRowOrder: {},
        resultsLabelAliases: {},
        headerColors: {},
      };

      // Process app_settings data
      if (appSettingsRes.ok) {
        const { data: appSettingsData } = await appSettingsRes.json();
        if (appSettingsData && appSettingsData.length > 0) {
          appSettingsData.forEach(row => {
            if (!row.value) return;
            switch (row.key) {
              case 'market_rates':
                settings.marketRates = row.value;
                break;
              case 'product_lists':
                settings.productLists = row.value;
                break;
              case 'fee_columns':
                settings.feeColumns = row.value;
                break;
              case 'flat_above_commercial_rule':
                settings.flatAboveCommercialRule = row.value;
                break;
              case 'broker_routes':
                settings.brokerRoutes = row.value;
                break;
              case 'broker_commission_defaults':
                settings.brokerCommissionDefaults = row.value;
                break;
              case 'broker_commission_tolerance':
                settings.brokerCommissionTolerance = row.value;
                break;
              case 'funding_lines_btl':
                settings.fundingLinesBTL = row.value;
                break;
              case 'funding_lines_bridge':
                settings.fundingLinesBridge = row.value;
                break;
            }
          });
        }
      } else {
        console.error('Error fetching app_settings from API');
      }

      // Process results_configuration data
      if (resultsConfigRes.ok) {
        const { data: resultsConfigData } = await resultsConfigRes.json();
        if (resultsConfigData && resultsConfigData.length > 0) {
          resultsConfigData.forEach(row => {
            const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
            const calcType = row.calculator_type;
            
            switch (row.key) {
              case 'visibility':
                settings.resultsVisibility[calcType] = config;
                break;
              case 'row_order':
                settings.resultsRowOrder[calcType] = config;
                break;
              case 'label_aliases':
                settings.resultsLabelAliases[calcType] = config;
                break;
              case 'header_colors':
                settings.headerColors[calcType] = config;
                break;
            }
          });
        }
      } else if (resultsConfigRes.status !== 404) {
        console.error('Error fetching results_configuration from API');
      }

      return settings;
    } catch (err) {
      console.error('Failed to load app settings from API:', err);
      return null;
    }
  }, [token]);

  // Initialize settings on mount
  useEffect(() => {
    // Wait for token to be available before initializing
    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError(null);

      // Try to load from API first (source of truth)
      const apiSettings = await loadFromAPI();

      if (!mounted) return;

      if (apiSettings) {
        // Got settings from API - update all state
        setMarketRates(apiSettings.marketRates);
        setProductLists(apiSettings.productLists);
        setFeeColumns(apiSettings.feeColumns);
        setFlatAboveCommercialRule(apiSettings.flatAboveCommercialRule);
        setBrokerRoutes(apiSettings.brokerRoutes);
        setBrokerCommissionDefaults(apiSettings.brokerCommissionDefaults);
        setBrokerCommissionTolerance(apiSettings.brokerCommissionTolerance);
        setFundingLinesBTL(apiSettings.fundingLinesBTL);
        setFundingLinesBridge(apiSettings.fundingLinesBridge);
        setResultsVisibility(apiSettings.resultsVisibility);
        setResultsRowOrder(apiSettings.resultsRowOrder);
        setResultsLabelAliases(apiSettings.resultsLabelAliases);
        setHeaderColors(apiSettings.headerColors);
        
        // Update localStorage cache for components that still read from localStorage
        writeLocalStorage(LOCALSTORAGE_CONSTANTS_KEY, {
          marketRates: apiSettings.marketRates,
          productLists: apiSettings.productLists,
          feeColumns: apiSettings.feeColumns,
          flatAboveCommercialRule: apiSettings.flatAboveCommercialRule,
          brokerRoutes: apiSettings.brokerRoutes,
          brokerCommissionDefaults: apiSettings.brokerCommissionDefaults,
          brokerCommissionTolerance: apiSettings.brokerCommissionTolerance,
          fundingLinesBTL: apiSettings.fundingLinesBTL,
          fundingLinesBridge: apiSettings.fundingLinesBridge,
          resultsVisibility: apiSettings.resultsVisibility,
          resultsRowOrder: apiSettings.resultsRowOrder,
          resultsLabelAliases: apiSettings.resultsLabelAliases,
          headerColors: apiSettings.headerColors,
        });
        
      } else {
        // Fallback to localStorage (already loaded in initialState)
      }

      setLoading(false);
      setInitialized(true);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [token, loadFromAPI]);

  // Refresh settings (can be called after admin updates)
  const refreshSettings = useCallback(async () => {
    setLoading(true);
    const apiSettings = await loadFromAPI();
    if (apiSettings) {
      setMarketRates(apiSettings.marketRates);
      setProductLists(apiSettings.productLists);
      setFeeColumns(apiSettings.feeColumns);
      setFlatAboveCommercialRule(apiSettings.flatAboveCommercialRule);
      setBrokerRoutes(apiSettings.brokerRoutes);
      setBrokerCommissionDefaults(apiSettings.brokerCommissionDefaults);
      setBrokerCommissionTolerance(apiSettings.brokerCommissionTolerance);
      setFundingLinesBTL(apiSettings.fundingLinesBTL);
      setFundingLinesBridge(apiSettings.fundingLinesBridge);
      setResultsVisibility(apiSettings.resultsVisibility);
      setResultsRowOrder(apiSettings.resultsRowOrder);
      setResultsLabelAliases(apiSettings.resultsLabelAliases);
      setHeaderColors(apiSettings.headerColors);
      
      // Update localStorage cache
      writeLocalStorage(LOCALSTORAGE_CONSTANTS_KEY, {
        marketRates: apiSettings.marketRates,
        productLists: apiSettings.productLists,
        feeColumns: apiSettings.feeColumns,
        flatAboveCommercialRule: apiSettings.flatAboveCommercialRule,
        brokerRoutes: apiSettings.brokerRoutes,
        brokerCommissionDefaults: apiSettings.brokerCommissionDefaults,
        brokerCommissionTolerance: apiSettings.brokerCommissionTolerance,
        fundingLinesBTL: apiSettings.fundingLinesBTL,
        fundingLinesBridge: apiSettings.fundingLinesBridge,
        resultsVisibility: apiSettings.resultsVisibility,
        resultsRowOrder: apiSettings.resultsRowOrder,
        resultsLabelAliases: apiSettings.resultsLabelAliases,
        headerColors: apiSettings.headerColors,
      });
    }
    setLoading(false);
  }, [loadFromAPI]);

  const value = {
    // Constants page settings
    marketRates,
    productLists,
    feeColumns,
    flatAboveCommercialRule,
    brokerRoutes,
    brokerCommissionDefaults,
    brokerCommissionTolerance,
    fundingLinesBTL,
    fundingLinesBridge,
    // GlobalSettings page settings
    resultsVisibility,
    resultsRowOrder,
    resultsLabelAliases,
    headerColors,
    // Meta
    loading,
    error,
    isIframe,
    initialized,
    refreshSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

AppSettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access app settings
 * Returns market rates and loading state
 */
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

/**
 * Hook specifically for market rates
 * Returns { STANDARD_BBR, STRESS_BBR, CURRENT_MVR } with proper defaults
 */
export function useMarketRates() {
  const { marketRates, loading } = useAppSettings();
  
  return {
    STANDARD_BBR: marketRates?.STANDARD_BBR ?? DEFAULT_MARKET_RATES.STANDARD_BBR,
    STRESS_BBR: marketRates?.STRESS_BBR ?? DEFAULT_MARKET_RATES.STRESS_BBR,
    CURRENT_MVR: marketRates?.CURRENT_MVR ?? DEFAULT_MARKET_RATES.CURRENT_MVR,
    loading,
  };
}

export default AppSettingsContext;
