// App-wide editable constants. The UI provides a Constants tab to edit these at runtime.
export const LOAN_TYPES = {
  MAX_OPTIMUM_GROSS: 'Max Optimum Gross Loan',
  SPECIFIC_NET: 'Specific Net Loan',
  MAX_LTV: 'Maximum LTV Loan',
  SPECIFIC_GROSS: 'Specific Gross Loan',
};

export const PRODUCT_GROUPS = {
  SPECIALIST: 'Specialist',
  CORE: 'Core',
};

export const PROPERTY_TYPES = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  SEMI_COMMERCIAL: 'Semi-Commercial',
};

export const RETENTION_OPTIONS = {
  YES: 'Yes',
  NO: 'No',
};

export const RETENTION_LTV_RANGES = {
  LTV_65: '65',
  LTV_75: '75',
};

// Default product lists per property type. The Constants UI allows editing these.
export const PRODUCT_TYPES_LIST = {
  Residential: ['2yr Fix', '3yr Fix', '2yr Tracker'],
  Commercial: ['2yr Fix', '3yr Fix', '2yr Tracker'],
  'Semi-Commercial': ['2yr Fix', '3yr Fix', '2yr Tracker'],
};

// Fee columns to display in output per property type and retention/core variants.
export const FEE_COLUMNS = {
  Residential: [6, 4, 3, 2],
  Commercial: [6, 4, 2],
  'Semi-Commercial': [6, 4, 2],
  RetentionResidential: [5.5, 3.5, 2.5, 1.5],
  RetentionCommercial: [5.5, 3.5, 1.5],
  'RetentionSemi-Commercial': [5.5, 3.5, 1.5],
  Core: [6, 4, 3, 2],
  Core_Retention_65: [5.5, 3.5, 2.5, 1.5],
  Core_Retention_75: [5.5, 3.5, 2.5, 1.5],
};

// NOTE: MAX_LTV_BY_TIER removed — flat-above-commercial logic is handled in the calculator
// and retained LTV thresholds are sourced from the rates table. This file no longer
// exports MAX_LTV_BY_TIER per user request.

// Special override rule for "Flat above commercial" style scopes. This object is
// editable from the Constants admin UI. It controls whether the override is
// enabled, a matcher string used to detect matching product_scope values, and
// the tier->LTV mapping to apply when the rule is active.
export const FLAT_ABOVE_COMMERCIAL_RULE = {
  enabled: true,
  // A comma-separated list of tokens that must be present in productScope (case-insensitive)
  // e.g. 'flat,commercial' or a full phrase 'flat above commercial'.
  scopeMatcher: 'flat,commercial',
  tierLtv: { '2': 65, '3': 75 },
};

// Helper: key used to persist editable constants in localStorage
export const LOCALSTORAGE_CONSTANTS_KEY = 'app.constants.override.v1';

// Market/base rates used in calculations and stress checks. These are editable
// via the Constants admin UI and persisted to localStorage when changed.
export const MARKET_RATES = {
  // Standard Bank Base Rate (decimal, e.g. 0.04 = 4%)
  STANDARD_BBR: 0.04,
  // Stress BBR used for stress calculations
  STRESS_BBR: 0.0425,
  // Mortgage Valuation Rate (MVR) or similar margin applied to valuations
  CURRENT_MVR: 0.0859,
};
