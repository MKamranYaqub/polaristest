# AI Agent Instructions for Polaris Test Project

## CRITICAL: Read This First

This document contains **MANDATORY** instructions for all AI agents working on this project. Following these rules ensures code quality, maintainability, and prevents technical debt.

---

## 1. Project Structure & File Organization

### Documentation Files Location

**RULE**: ALL documentation files MUST be placed in the `/docs` directory, NOT in the root directory.

```
✅ CORRECT:
docs/
  ├── architecture/
  ├── features/
  ├── guides/
  └── implementation/

❌ WRONG:
root/
  ├── SOME_FEATURE_GUIDE.md
  ├── IMPLEMENTATION_SUMMARY.md
  └── ... (cluttering root directory)
```

**Exceptions** (only these can be in root):
- `README.md` - Project overview
- `TOKEN_SYSTEM.md` - Design token reference
- `DEPLOYMENT.md` - Deployment instructions
- `.github/` directory files

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── calculator/        # Calculator-specific components
│   │   │   ├── btl/          # BTL-specific components
│   │   │   ├── bridging/     # Bridging-specific components
│   │   │   └── shared/       # Shared calculator components
│   │   ├── modals/           # Modal components
│   │   ├── pdf/              # PDF generation components
│   │   │   ├── shared/       # Shared PDF components
│   │   │   ├── sections/     # PDF section components
│   │   │   └── utils/        # PDF utilities
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Generic UI components
│   ├── styles/
│   │   ├── _variables.scss   # Design tokens
│   │   ├── Calculator.scss   # Calculator-specific styles
│   │   └── slds.css          # Salesforce Lightning styles
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   └── config/               # Configuration files
```

### Backend Structure

```
backend/
├── routes/              # API routes
├── middleware/          # Express middleware
├── utils/              # Utility functions
├── scripts/            # Database seeds and migrations
└── __tests__/          # Backend tests
```

---

## 2. Design Token System (MANDATORY)

### Core Rule
**ALWAYS use design tokens. NEVER use hardcoded values.**

### Available Tokens

#### Spacing Tokens
```scss
$spacing-xs: var(--token-space-8);    // 8px
$spacing-sm: var(--token-space-12);   // 12px  
$spacing-md: var(--token-space-16);   // 16px
$spacing-lg: var(--token-space-24);   // 24px
```

#### Color Tokens
```scss
// Text
$token-text-primary
$token-text-secondary
$token-text-helper
$token-text-error

// Backgrounds
$token-color-surface
$token-color-background

// Borders
$token-color-border-subtle
$token-color-border-strong

// Interactive
$token-color-interactive
$token-color-interactive-hover
```

#### Other Tokens
```scss
$token-radius-sm          // Border radius small
$token-radius-md          // Border radius medium
$token-shadow-soft        // Box shadow
$token-font-family        // Font family
```

### Examples

**✅ CORRECT:**
```scss
.my-component {
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  background-color: $token-color-surface;
  border: 1px solid $token-color-border-subtle;
  border-radius: $token-radius-sm;
  color: $token-text-primary;
}
```

**❌ WRONG:**
```scss
.my-component {
  padding: 16px;
  margin-bottom: 12px;
  background-color: #ffffff;
  border: 1px solid #dddbda;
  border-radius: 4px;
  color: #080707;
}
```

### In React Components

**PREFERRED: Use CSS Classes**
```jsx
// In SCSS file
.info-box {
  padding: $spacing-sm;
  background-color: $token-color-surface;
}

// In JSX
<div className="info-box">{content}</div>
```

**If inline styles are necessary:**
```jsx
<div style={{ 
  padding: 'var(--token-space-12)',
  backgroundColor: 'var(--token-layer-surface)'
}}>
```

---

## 3. Component Development Rules

### Component Structure

```jsx
// 1. Imports (grouped)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { utilityFunction } from '../../utils/helpers';

// 2. Component definition with clear JSDoc
/**
 * ComponentName - Brief description
 * 
 * @param {string} prop1 - Description
 * @param {function} prop2 - Description
 */
const ComponentName = ({ prop1, prop2 }) => {
  // 3. State declarations
  const [state, setState] = useState(null);

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 5. Event handlers
  const handleEvent = () => {
    // Handler logic
  };

  // 6. Render
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
};

// 7. PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func
};

// 8. Export
export default ComponentName;
```

### Styling Rules

1. **Create CSS classes, not inline styles**
2. **Use design tokens exclusively**
3. **Follow BEM-like naming**: `.component-name__element--modifier`
4. **Keep styles in component-specific SCSS files or main Calculator.scss**

### Component Placement

- **Calculator components** → `frontend/src/components/calculator/`
- **BTL-specific** → `frontend/src/components/calculator/btl/`
- **Bridging-specific** → `frontend/src/components/calculator/bridging/`
- **Shared calculator** → `frontend/src/components/calculator/shared/`
- **PDF components** → `frontend/src/components/pdf/`
- **Modals** → `frontend/src/components/modals/`
- **Generic UI** → `frontend/src/components/ui/`

---

## 4. State Management

### Use Custom Hooks

For complex state logic, create custom hooks:

```jsx
// ✅ CORRECT: frontend/src/hooks/calculator/useBrokerSettings.js
export default function useBrokerSettings(initialQuote) {
  const [settings, setSettings] = useState({});
  
  return {
    settings,
    updateSettings,
    resetSettings
  };
}
```

### Don't Prop Drill

Use React Context for deeply nested state:

```jsx
// frontend/src/contexts/CalculatorContext.jsx
export const CalculatorContext = createContext();
```

---

## 5. Utility Functions

### Location
All utility functions go in `frontend/src/utils/`

### Organization
```
utils/
├── calculator/
│   ├── numberFormatting.js
│   ├── rateFiltering.js
│   └── calculations.js
├── pdf/
│   └── dipHelpers.js
├── validation.js
└── formatters.js
```

### Pure Functions
```jsx
// ✅ CORRECT: Pure function
export const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP'
  });
};

// ❌ WRONG: Side effects
export const formatCurrency = (value) => {
  console.log('Formatting:', value); // Side effect!
  return formatted;
};
```

---

## 6. Documentation Requirements

### When to Create Documentation

**DO create docs for:**
- New features (in `docs/features/`)
- Implementation guides (in `docs/guides/`)
- Architecture decisions (in `docs/architecture/`)
- API documentation (in `docs/api/`)

**DO NOT create docs for:**
- Small bug fixes
- Minor UI tweaks
- Code cleanup
- Single-component changes

### Documentation Template

```markdown
# Feature Name

## Overview
Brief description (2-3 sentences)

## Implementation
- Key changes made
- Files modified
- New components added

## Usage
How to use the feature

## Technical Details
- State management approach
- Data flow
- Integration points

## Testing
How to test the feature

## Related Files
- `path/to/file1.jsx`
- `path/to/file2.scss`
```

### Naming Convention
```
✅ CORRECT:
docs/features/broker-commission-validation.md
docs/guides/adding-new-calculator-field.md
docs/architecture/pdf-generation-system.md

❌ WRONG:
BROKER_COMMISSION_IMPLEMENTATION_SUMMARY.md (root)
CALCULATOR_FIELD_GUIDE_COMPLETE.md (root)
```

---

## 7. Code Quality Standards

### Naming Conventions

```jsx
// Components: PascalCase
const BrokerCommissionField = () => {};

// Functions: camelCase
const calculateCommission = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_COMMISSION_PERCENT = 2.5;

// CSS Classes: kebab-case with BEM
.broker-commission-field
.broker-commission-field__label
.broker-commission-field__input--disabled
```

### Comments

```jsx
// ✅ GOOD: Explains WHY
// Use absolute positioning to overlay the validation icon
// because relative positioning breaks the grid layout
position: absolute;

// ❌ BAD: Explains WHAT (obvious from code)
// Set position to absolute
position: absolute;
```

### Error Handling

```jsx
// ✅ CORRECT: Proper error handling
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  showToast({ 
    kind: 'error', 
    title: 'Failed to load data', 
    subtitle: error.message 
  });
  console.error('Data fetch error:', error);
}

// ❌ WRONG: Silent failure
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  // Nothing
}
```

---

## 8. Testing Requirements

### Unit Tests Location
```
backend/__tests__/         # Backend tests
frontend/src/**/*.test.js  # Component tests (co-located)
```

### What to Test
- Utility functions (all)
- Complex calculations (all)
- API routes (all)
- Critical user flows
- Edge cases

### What NOT to Test
- Simple presentational components
- Third-party library wrappers
- Obvious getters/setters

---

## 9. Git Commit Standards

### Commit Message Format
```
type(scope): brief description

Detailed explanation of what and why (not how)

Related: #issue-number
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `style`: CSS/formatting changes
- `docs`: Documentation only
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Examples
```
✅ GOOD:
feat(calculator): add broker commission validation
fix(btl): correct LTV calculation for retention loans
refactor(pdf): extract DIP helpers into utility file

❌ BAD:
Updated files
Fixed bug
Changes
```

---

## 10. Common Pitfalls to Avoid

### ❌ DON'T:
1. Create MD files in root directory
2. Use hardcoded colors, spacing, or sizes
3. Use inline styles without design tokens
4. Create components without PropTypes
5. Leave console.logs in production code
6. Copy-paste code without refactoring
7. Mix business logic in UI components
8. Skip error handling
9. Forget to clean up useEffect hooks
10. Use `any` or suppress TypeScript errors

### ✅ DO:
1. Place docs in `/docs` directory
2. Use design tokens exclusively
3. Create CSS classes with tokens
4. Document component props
5. Use proper logging (backend) or toast notifications (frontend)
6. Extract reusable logic into utilities/hooks
7. Separate concerns (UI vs logic)
8. Handle all error cases
9. Return cleanup functions from useEffects
10. Fix type issues properly

---

## 11. Performance Guidelines

### React Components

```jsx
// ✅ GOOD: Memoized expensive calculation
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ GOOD: Memoized callback
const handleChange = useCallback((value) => {
  updateValue(value);
}, [updateValue]);

// ❌ BAD: Inline function in render
<Component onChange={(val) => updateValue(val)} />
```

### State Updates

```jsx
// ✅ GOOD: Batch related updates
setState(prev => ({
  ...prev,
  field1: value1,
  field2: value2
}));

// ❌ BAD: Multiple separate updates
setField1(value1);
setField2(value2);
```

---

## 12. Accessibility Requirements

### Required for ALL interactive elements:

```jsx
// ✅ CORRECT
<button 
  aria-label="Close modal"
  onClick={handleClose}
>
  <CloseIcon />
</button>

<input 
  id="commission-input"
  aria-describedby="commission-help"
  aria-invalid={hasError}
/>
<span id="commission-help">Enter percentage</span>
```

### Form Fields
- Always associate labels with inputs
- Provide helper text with `aria-describedby`
- Show error states with `aria-invalid`
- Use semantic HTML elements

---

## 13. Project-Specific Context

### This is a Calculator Application

**Purpose**: Buy-to-Let (BTL) and Bridging loan calculators with quote generation.

**Key Features**:
- Multi-step calculator forms
- Rate comparison tables
- PDF generation (Quote and DIP documents)
- Broker commission management
- Client details management
- Supabase backend integration

### Key Technologies
- **Frontend**: React, SCSS, Salesforce Lightning Design System
- **Backend**: Node.js, Express, Supabase
- **PDF**: @react-pdf/renderer
- **State**: React hooks + custom hooks
- **Styling**: Design tokens + SCSS

### Business Logic Location
- Calculator engines: `frontend/src/utils/calculator/`
- BTL calculations: `btlCalculationEngine.js`
- Bridging calculations: `bridgingCalculationEngine.js`
- PDF helpers: `frontend/src/components/pdf/utils/`

---

## 14. Quick Reference Checklist

Before submitting any code change:

- [ ] All documentation in `/docs` directory (not root)
- [ ] All styles use design tokens (no hardcoded values)
- [ ] CSS classes created instead of inline styles
- [ ] Component has PropTypes defined
- [ ] Utility functions are pure (no side effects)
- [ ] Error handling implemented
- [ ] useEffect cleanup functions added where needed
- [ ] Console.logs removed
- [ ] Accessibility attributes added
- [ ] Code follows naming conventions
- [ ] No duplicate code (DRY principle)
- [ ] Commit message follows format

---

## 15. When in Doubt

1. **Check existing code** for similar patterns
2. **Look in `/docs`** for implementation guides
3. **Review `TOKEN_SYSTEM.md`** for styling
4. **Check `frontend/src/components/calculator/`** for component examples
5. **Ask before creating new patterns** that differ from existing code

---

## Final Note

Following these guidelines ensures:
- ✅ Consistent code quality
- ✅ Easy maintenance
- ✅ Clear project structure
- ✅ Minimal technical debt
- ✅ Happy developers

**When you follow these rules, you won't need cleanup every 2 days!**
