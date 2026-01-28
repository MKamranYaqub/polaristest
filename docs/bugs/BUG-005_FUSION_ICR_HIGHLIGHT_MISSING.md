# BUG-005: Fusion ICR Cell Not Highlighted Red When Below 110%

## Summary
When Fusion product ICR (Interest Coverage Ratio) is less than 110%, the ICR cell should be highlighted in red to indicate it does not meet the minimum threshold. Currently, no visual warning is displayed.

## Business Rule
- **Minimum ICR threshold**: 110%
- **Requirement**: If ICR < 110%, the ICR value cell must be highlighted with a red background to alert the user

## Expected Behavior
| ICR Value | Cell Highlight |
|-----------|----------------|
| ≥ 110% | Normal (no highlight) |
| < 110% | Red background highlight |

## Current Behavior
The ICR cell displays the percentage value without any conditional formatting or highlighting regardless of whether it meets the 110% threshold.

## Affected Areas
1. **Bridging Calculator UI** - ICR display for Fusion products
2. **Quote PDFs** - ICR value in Fusion quotes/DIPs (if applicable)

## Files to Investigate
- Calculator component displaying Fusion results
- [BridgingCalculator.jsx](../../frontend/src/components/calculators/BridgingCalculator.jsx) - Results display section
- Any results table/card components showing ICR

## Suggested Fix

In the component displaying ICR for Fusion products, add conditional styling:

```jsx
// Example implementation
<td 
  style={{ 
    backgroundColor: icr < 110 ? 'var(--token-support-error)' : 'transparent',
    color: icr < 110 ? 'var(--token-text-on-color)' : 'inherit'
  }}
>
  {formatPercent(icr)}
</td>
```

Or using CSS classes:

```jsx
<td className={icr < 110 ? 'icr-warning' : ''}>
  {formatPercent(icr)}
</td>
```

```css
.icr-warning {
  background-color: var(--token-support-error);
  color: var(--token-text-on-color);
}
```

## Status
- **Severity**: Low (UI Enhancement)
- **Status**: Fixed
- **Fixed Date**: January 28, 2026
- **Discovered**: 2026-01-26
- **Product**: Fusion only (Bridge products don't have ICR)

## Notes
1. ICR is only calculated for Fusion products (not Bridge)
2. The 110% threshold may be configurable - check if it should come from app_constants table
3. Consider whether PDF quotes should also show this highlighting
