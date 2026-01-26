# Bridging Calculator Feedback Tracker

**Last Updated**: 2026-01-26  
**Reviewer**: Shaun  
**Status**: In Progress

---

## Shaun's Feedback (Quote Review)

| # | Feedback Item | Status | Priority | Notes |
|---|--------------|--------|----------|-------|
| 1 | Broker commission doesn't go high enough, caps at 0.9% | ⬜ Open | Medium | Need to increase max broker commission limit |
| 2 | Security addresses are not stated anywhere. Intentional? Do we not want to do this even if there are multiple properties? | ⬜ Open | Medium | Clarify if property addresses should appear on quotes |
| 3 | On the quote, blues are too dark to read the black text within them | ⬜ Open | High | Accessibility issue - improve contrast |
| 4 | Is it intentional that bridging rates are showing as yearly now on the quote produced and not monthly? | ⬜ Open | High | See BUG-002 - Bridge should show monthly rates |
| 5 | Minimum term for Fusion showing as 24 months, this is not correct | ⬜ Open | High | Check Fusion min term configuration |
| 6 | Monthly interest showing as zero when fully rolled which technically isn't true. There is a monthly interest amount, it is just rolled into the loan | ⬜ Open | Medium | Display rolled interest value even when fully rolled |
| 7 | Gross loan – on the calc, I put in 75% LTV but on the quote produced, the system has capped bridging (Fixed and Variable) at 70% but allowed Fusion to be 75% | ⬜ Open | High | See BUG-001 - PDF shows wrong LTV |
| 8 | LTV – per above | ⬜ Open | High | Related to #7 |
| 9 | We don't call it product fee, we call it arrangement fee. But quote is using product fee? | ⬜ Open | Medium | Label change: "Product Fee" → "Arrangement Fee" |
| 10 | We don't call it admin fee, we call it commitment fee. But quote is using admin fee? | ⬜ Open | Medium | Label change: "Admin Fee" → "Commitment Fee" |
| 11 | Calc and quote assumes we are using title insurance and gives cost amounts. This needs to be made an option in the calc as it isn't always applicable | ⬜ Open | High | Add title insurance toggle on/off in calculator |
| 12 | At the bottom, it says there is a £199 admin fee per property, this doesn't apply for bridging? | ⬜ Open | Medium | Remove/hide £199 admin fee for bridging products |
| 13 | Broker details – says "Route" but I think this should be updated to "submission route" | ⬜ Open | Low | Label change: "Route" → "Submission Route" |
| 14 | Second page is titled "packaging list", but then has a sub-heading called DIP list? I think the DIP list subheading can go? It can't be both, it's confusing | ⬜ Open | Low | Remove "DIP list" subheading from packaging list page |

---

## Meeting Notes (Additional Items)

| # | Item | Status | Priority | Notes |
|---|------|--------|----------|-------|
| M1 | Bridge Fusion → ICR to highlight if out of range | ⬜ Open | Medium | See BUG-005 - Highlight red if ICR < 110% |
| M2 | Exit fee to default as 0 | ⬜ Open | Low | Set default exit fee to 0% |
| M3 | Multi Property section | ⬜ Open | Medium | Review/implement multi-property functionality |
| M4 | Update labels (Not all specified yet) | ⬜ Open | Medium | Awaiting full label list |
| M5 | Calculations to check (APRC – Service interest – Total Interest – Monthly Interest) | ⬜ Open | High | See BUG-003, BUG-004 for APRC/calculation issues |
| M6 | Sort sub property type in Bridge calculator | ⬜ Open | Low | Alphabetize or logically sort sub-property dropdown |
| M7 | Title insurance - Option to have on/off for quote | ⬜ Open | High | Same as #11 above |

---

## Related Bug Documents

| Bug ID | Title | Related Feedback |
|--------|-------|------------------|
| [BUG-001](BUG_BRIDGING_QUOTE_PDF_WRONG_LTV.md) | PDF shows wrong LTV for Bridge products | #7, #8 |
| [BUG-002](BUG-002_BRIDGING_PDF_ANNUAL_VS_MONTHLY_RATE.md) | PDF shows annual rate instead of monthly for Bridge | #4 |
| [BUG-003](BUG-003_BRIDGING_NET_LOAN_INCORRECT_DEDUCTIONS.md) | Net Loan incorrect deductions | M5 |
| [BUG-004](BUG-004_BRIDGING_APRC_FORMULA_INCORRECT.md) | APRC formula incorrect | M5 |
| [BUG-005](BUG-005_FUSION_ICR_HIGHLIGHT_MISSING.md) | Fusion ICR highlight missing | M1 |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ Open | Not started |
| 🔄 In Progress | Work in progress |
| ✅ Complete | Fixed and verified |
| ❌ Won't Fix | Decided not to implement |
| ⏸️ On Hold | Awaiting clarification |

---

## Completion Summary

- **Total Items**: 21
- **Completed**: 0
- **In Progress**: 0
- **Open**: 21

---

## Change Log

| Date | Item | Change | By |
|------|------|--------|-----|
| 2026-01-26 | All | Initial feedback document created | - |
