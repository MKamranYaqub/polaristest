## Quick orientation for AI coding agents

This repository is a small full-stack app that uses a Vite + React frontend and an Express backend to interact with Supabase. The file below captures the essential, discoverable knowledge an AI agent needs to be immediately productive here.

### Big picture
- Frontend: `frontend/` — React app (Vite) using Carbon components. Entry: `frontend/src/App.jsx`.
- Backend: `backend/` — Express server that uses a Supabase service-role client. Entry: `backend/server.js`.
- Supabase: used for auth, a `rates` table, and an `app_constants` table. The frontend uses the anon key; backend uses the service role key.

### Where to look for important patterns
- Runtime-editable app constants: `frontend/src/config/constants.js` and admin UI at `frontend/src/components/Constants.jsx`.
- Supabase client in frontend: `frontend/src/contexts/SupabaseContext.jsx` (uses VITE_ env vars).
- Backend API (rates endpoint): `backend/server.js` — `/api/rates` reads from Supabase `rates` table.
- DB seed & import scripts: `backend/scripts/seedRates.js`, `backend/scripts/importRatesCsv.js` and the CSV at `migrations/bridge_fusion_rates_full.csv`.

### Data-flow & important behaviors to preserve
- Rates are stored in Supabase `rates` table and are read by the backend endpoint `/api/rates`.
- Editable constants persist workflow (key facts):
  - UI persists to localStorage under `LOCALSTORAGE_CONSTANTS_KEY` which is defined in `frontend/src/config/constants.js` (`app.constants.override.v1`).
  - When saving, `Constants.jsx` attempts structured-column writes to `app_constants` (columns like `product_lists`, `fee_columns`, `market_rates`) and falls back to a legacy `value` JSON column. Code detects whichever schema is present — changing DB schema must account for both paths.

### Dev / build / run (discovered commands)
- Node required (backend `package.json` specifies `node: 18.x`).
- Install deps and run (Powershell examples):
  - Frontend:
    ```powershell
    cd frontend; npm install
    $env:VITE_SUPABASE_URL = 'https://...'; $env:VITE_SUPABASE_ANON_KEY = 'anon...'; npm run dev
    ```
  - Backend:
    ```powershell
    cd backend; npm install
    $env:SUPABASE_URL = 'https://...'; $env:SUPABASE_SERVICE_ROLE_KEY = 'service-role...'; $env:PORT = '3001'; npm run dev
    ```
- Frontend build: `cd frontend; npm run build` (Vite). Backend start: `cd backend; npm run start`.

### Useful scripts and artifacts
- `backend/scripts/seedRates.js` and `importRatesCsv.js` — used to populate the `rates` table. CSV: `migrations/bridge_fusion_rates_full.csv`.
- Watch mode for backend: `npm run dev` (uses `node --watch server.js`).

### Project-specific conventions & gotchas
- Dual persistence for `app_constants`: the UI is defensive and supports either structured DB columns or a single `value` JSON column. When changing DB schema, ensure both upsert strategies are considered.
- Local override key: `LOCALSTORAGE_CONSTANTS_KEY = 'app.constants.override.v1'` — other parts of the app listen to `storage` events and will update.
- Constants/feature toggles: many behaviors are controlled by values in `frontend/src/config/constants.js` — editing only the UI will persist to localStorage and Supabase; tests or CI should set envs instead.
- No test runner is present in package.json files; do not assume test scripts exist.

### Quick editing contract (inputs/outputs)
- When making changes that affect persisted constants, update both `frontend/src/components/Constants.jsx` and `frontend/src/config/constants.js` and consider DB schema impacts in `backend` seed/insert logic.

### When you need help / next steps
- If adding a DB migration, prefer to preserve the fallback `value` column or provide a data-migration script to populate structured columns; see `Constants.jsx` for the detection/merge strategy.
- If uncertain about whether frontend components call Supabase directly or via the backend, search for `supabase` usage (frontend uses the client in `SupabaseContext.jsx`).

---
If you'd like, I can (A) open a short PR that adds a small checklist for DB migrations, or (B) add a brief DEV_NOTES.md with exact env examples per-OS. Which would you prefer?

## Coding Standards - MANDATORY

### CSS & Styling Rules (CRITICAL)
- **NEVER use inline styles** - Use CSS classes only (exception: dynamic values like `width: ${val}%`, PDF, SVG)
- **ALWAYS use SLDS components first** - Check [SLDS documentation](https://www.lightningdesignsystem.com/) before creating custom components
- **ALL CSS values MUST use design tokens** - No hardcoded colors, spacing, or sizes
  - Spacing: `var(--slds-g-spacing-*)` or `var(--token-spacing-*)`
  - Colors: `var(--slds-g-color-*)` or `var(--token-color-*)`
  - Typography: `var(--slds-g-font-size-*)` or `var(--token-font-size-*)`

### React Component Rules (CRITICAL)
- **ALWAYS use SLDS classes**: `.slds-button`, `.slds-table`, `.slds-modal`, `.slds-form-element`
- **ALWAYS add PropTypes** for all components
- **ALWAYS handle loading and error states** - Never render data without checking if it exists
- **Use React.memo** for expensive components
- **Use useCallback/useMemo** to prevent unnecessary re-renders

### Before Writing Code - MANDATORY CHECKS
1. **Read these docs FIRST**: 
   - `docs/CSS_STYLE_GUIDE.md` - For all CSS/styling work
   - `docs/COMPONENT_DEVELOPMENT.md` - For all React components
   - `docs/DESIGN_TOKENS.md` - For token values
2. **Check if SLDS has the component** - Don't reinvent the wheel
3. **Use existing patterns** - Search codebase for similar components
4. **Think long-term** - Is this reusable? Maintainable? Token-based?

### Quality Checklist (Run Before Committing)
- [ ] No inline styles (check with `npm run lint`)
- [ ] All SLDS classes used correctly
- [ ] All values use design tokens
- [ ] PropTypes defined
- [ ] Loading/error states handled
- [ ] Component is reusable
- [ ] Responsive at 480px/768px/1024px/1440px
- [ ] No console.log() statements