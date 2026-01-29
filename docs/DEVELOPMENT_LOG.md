# Development Log - Polaris Mortgage Platform

This document tracks all new features added and bugs fixed during development sessions.

**Last Updated**: January 29, 2026

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

### Session: January 29, 2026

| # | Feature | Description | Files Modified | Status |
|---|---------|-------------|----------------|--------|
| 6 | Title Insurance Toggle for Quote PDF | Added optional "Include Title Insurance in Quote?" toggle to Issue Quote modal. When Yes, shows Title Insurance row in the Quote PDF; when No, hides it completely. Works for both BTL and Bridging quotes. | `IssueQuoteModal.jsx`, `BTLQuotePDF.jsx`, `BridgingQuotePDF.jsx`, `btlQuoteHelpers.js`, Migration 057 | ✅ Complete |
| 7 | Enhanced Bridging Quote PDF Layout | Restructured Bridging Quote PDF to match Excel format: 1) Initial Rate shows BBR suffix with (pa)/(pm) indicator, 2) Pay Rate row (Fusion only), 3) Gross/Net Loan show LTV %, 4) Rolled Months Interest, 5) Monthly Payment with "from month X", 6) Deferred Interest (Fusion only), 7) ERC/Exit Fee, 8) Proc Fee, 9) Broker Client Fee, 10) Title Insurance with eligibility check | `BridgingQuotePDF.jsx`, `bridgingQuoteHelpers.js`, `bridgeFusionCalculationEngine.js` | ✅ Complete |
| 8 | Initial Rate Display Fix | Fixed Fusion Initial Rate in PDF showing wrong value (4.80% instead of 4.79%). Now uses same BBR source as calculator (`getMarketRates().STANDARD_BBR`) and calculates margin = initial_rate - BBR | `bridgingQuoteHelpers.js` | ✅ Complete |
| 9 | Bridging PDF Terms Section Redesign | Replaced old Terms section with new 3-column table layout: Commitment Fee (from calculator), Valuation Fee (TBC), Lender Legal Fee (TBC) with descriptions | `BridgingQuotePDF.jsx`, `bridgingQuoteHelpers.js` | ✅ Complete |
| 10 | Remove Rate Information Header Row | Removed the redundant "Rate Information" section header from Bridging Quote PDF, keeping just the data rows | `BridgingQuotePDF.jsx` | ✅ Complete |
| 11 | Title Insurance Eligibility Logic | Added logic to show "Not eligible" for Title Insurance when gross loan > £3 million (matches business rule). Shows cost if eligible, "N/A" if no cost, "Not eligible" if over £3M | `BridgingQuotePDF.jsx` | ✅ Complete |
| 12 | ERC Label Rename | Changed "ERC 1 £" and "ERC 2 £" to "Early Repayment Charge Yr1" and "Early Repayment Charge Yr2" in Bridging calculator row labels for clarity | `GlobalSettings.jsx`, `BridgingCalculator.jsx` | ✅ Complete |
| 13 | BTL Product Scope Custom Sort | Implemented custom sort order for BTL calculator product scope dropdown: "Residential - BTL" first, then "Commercial", then "Semi-Commercial", then others alphabetically. Default value now set to "Residential - BTL" instead of unsorted first item | `BTL_Calculator.jsx` | ✅ Complete |
| 14 | Separate Core Range Proc Fee | Added separate proc fee configuration for BTL Core range. Each broker route now has 3 proc fees: BTL Specialist, BTL Core, and Bridge. When user selects Core range in BTL calculator, the Core proc fee is used instead of BTL Specialist. Admin UI updated to show all 3 fee inputs per route. | `constants.js`, `Constants.jsx`, `useBrokerSettings.js`, `BTL_Calculator.jsx` | ✅ Complete |
| 15 | Proc Fee Label Standardization | Renamed all "Broker Commission" UI labels to "Proc Fee" throughout the application. BTL calculator now shows separate "Proc Fee Specialist (%)" and "Proc Fee Core (%)" fields for brokers. PDF documents and admin settings updated with new terminology. | `BridgingCalculator.jsx`, `ClientDetailsSection.jsx`, `BTL_Calculator.jsx`, `BTLQuotePDF.jsx`, `BTLDIPPDF.jsx`, `BridgingDIPPDF.jsx`, `DIPPDF.jsx`, `GlobalSettings.jsx`, `Constants.jsx`, `useBrokerSettings.js` | ✅ Complete |

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
