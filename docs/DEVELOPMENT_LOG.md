# Development Log - Polaris Mortgage Platform

This document tracks all new features added and bugs fixed during development sessions.

**Last Updated**: January 28, 2026

---

## 📋 Features Added

### Session: January 28, 2026

| # | Feature | Description | Files Modified | Status |
|---|---------|-------------|----------------|--------|
| 1 | NBP → NPB Label Rename | Changed all UI labels from "NBP" to "NPB" throughout the application | `GlobalSettings.jsx`, `BridgingCalculator.jsx`, `BTL_Calculator.jsx`, Migration 056 | ✅ Complete |
| 2 | Settings Sync Fix | Extended AppSettingsContext to load ALL settings from database (both `app_settings` and `results_configuration` tables) so configuration changes sync across all users | `AppSettingsContext.jsx`, `App.jsx`, `GlobalSettings.jsx`, `Constants.jsx` | ✅ Complete |
| 3 | Product Scope Filter on Quotes Page | Added new "Product Scope" dropdown filter as the first filter on the QuotesList page. Filters by: Residential, Commercial, Semi-Commercial, Core | `QuotesList.jsx` | ✅ Complete |
| 4 | Swap Broker/Direct Client Button Order | Moved "Broker" button to appear first (left) and "Direct Client" second (right) in the Client Details toggle | `ClientDetailsSection.jsx` | ✅ Complete |
| 5 | Set Broker as Default Client Type | Changed the default selection from "Direct Client" to "Broker" when opening a new calculator | `useBrokerSettings.js` | ✅ Complete |

---

## 🐛 Bugs Fixed

### Session: January 28, 2026

| # | Bug | Root Cause | Solution | Files Modified | Status |
|---|-----|------------|----------|----------------|--------|
| 1 | Settings changes not visible to other users | Calculators only read from localStorage (browser-specific), never fetched from database on load | Extended `AppSettingsContext` to load from Supabase on mount and update localStorage, ensuring all users get fresh data | `AppSettingsContext.jsx`, `App.jsx` | ✅ Fixed |
| 2 | Admin settings pages not refreshing context | After saving, the context wasn't updated with new values until page refresh | Added `refreshSettings()` call after successful save in both admin pages | `GlobalSettings.jsx`, `Constants.jsx` | ✅ Fixed |

---

## 📝 Technical Debt / Cleanup Items

See [CODE_CLEANUP_BACKLOG.md](improvements/CODE_CLEANUP_BACKLOG.md) for technical debt items.

---

## 🔮 Pending / Future Work

| # | Item | Type | Priority | Notes |
|---|------|------|----------|-------|
| 1 | Monthly Payment field consolidation | Cleanup | Low | See cleanup backlog item #1 |
| 2 | Rate terminology standardization | Cleanup | Low | See cleanup backlog item #2 |
| 3 | NBP/NPB variable name alignment | Cleanup | Low | Optional - internal names vs UI labels |

---

## 📚 Knowledge Shared

### How to Add a New Filter to QuotesList

1. **Add state variable**: `const [filterXxx, setFilterXxx] = useState('');`
2. **Add filter logic**: In `filteredQuotes = quotes.filter(...)` block
3. **Add UI dropdown**: In `<div className="filters-section">` 
4. **Add to useEffect deps**: For page reset on filter change
5. **Update Clear All button**: Add to condition and reset handler

### Settings Architecture

- **app_settings table**: Stores Constants page settings (product_lists, fee_columns, market_rates, broker_routes)
- **results_configuration table**: Stores GlobalSettings page settings (visibility, row_order, label_aliases, header_colors)
- **AppSettingsContext**: Central loader that queries both tables and provides via React Context
- **Provider order**: AuthProvider → AppSettingsProvider → ThemeProvider → AccessibilityProvider

---

*Add new entries to the appropriate section as features are developed or bugs are fixed.*
