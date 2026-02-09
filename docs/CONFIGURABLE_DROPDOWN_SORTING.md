# Configurable Dropdown Sorting for BTL Criteria

## Overview

The BTL and Bridging calculators now support **database-driven dropdown sorting** using the `option_sort_order` column in the `criteria_config_flat` table. This allows administrators to control the display order of dropdown options without changing code.

## How It Works

### Sorting Priority

Options are sorted by:

1. **`option_sort_order`** (if set) - Lower numbers appear first
2. **`tier`** - Standard tier-based sorting (if option_sort_order is NULL or equal)
3. **`id`** - Database insertion order as final tiebreaker

### Column Values

- **`option_sort_order = 1`**: First priority (e.g., "No" options)
- **`option_sort_order = 2`**: Second priority
- **`option_sort_order = 3+`**: Additional custom ordering
- **`option_sort_order = NULL`**: Uses default tier-based sorting

## Setup Instructions

### Step 1: Run the Migration

Execute the migration to add the new column:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f database/migrations/062_add_option_sort_order_to_criteria.sql
```

Or run it directly in the Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `062_add_option_sort_order_to_criteria.sql`
- Execute

### 2. Configure Sort Orders

Use the helper script to set your preferred sort orders:

1. Open `database/scripts/configure_option_sort_order.sql`
2. Customize the examples to match your needs
3. Execute the queries in Supabase SQL Editor

**Alternative:** You can also use the Admin UI to export criteria as CSV, edit the `option_sort_order` column in Excel/Google Sheets, and re-import the CSV.

### Common Use Cases

#### Set All "No" Options First

```sql
UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE LOWER(TRIM(option_label)) = 'no';
```

#### Custom Order for Specific Question

```sql
-- Example: Property Type dropdown
-- Order: Residential (1), Semi-Commercial (2), Commercial (3)

UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE question_key = 'property_type' 
  AND LOWER(TRIM(option_label)) = 'residential';

UPDATE criteria_config_flat 
SET option_sort_order = 2 
WHERE question_key = 'property_type' 
  AND LOWER(TRIM(option_label)) LIKE '%semi%commercial%';

UPDATE criteria_config_flat 
SET option_sort_order = 3 
WHERE question_key = 'property_type' 
  AND LOWER(TRIM(option_label)) = 'commercial';
```

#### Yes/No Questions

```sql
-- Set "No" first, "Yes" second across all questions
UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE LOWER(TRIM(option_label)) = 'no';

UPDATE criteria_config_flat 
SET option_sort_order = 2 
WHERE LOWER(TRIM(option_label)) = 'yes';
```

## Verification

### Check Current Settings

```sql
SELECT 
  question_key,
  option_label,
  tier,
  option_sort_order
FROM criteria_config_flat
WHERE question_key = 'your_question_key'
ORDER BY 
  COALESCE(option_sort_order, 9999),
  tier,
  id;
```

### View All Custom Sorted Options

```sql
SELECT 
  criteria_set,
  question_key,
  question_label,
  option_label,
  option_sort_order,
  tier
FROM criteria_config_flat
WHERE option_sort_order IS NOT NULL
ORDER BY 
  criteria_set, 
  question_key, 
  option_sort_order;
```

## Resetting Sort Order

To revert to default tier-based sorting:

```sql
-- Reset all
UPDATE criteria_config_flat 
SET option_sort_order = NULL;

-- Reset specific question
UPDATE criteria_config_flat 
SET option_sort_order = NULL 
WHERE question_key = 'your_question_key';
```

## CSV Import/Export

### Admin UI Method

The easiest way to manage `option_sort_order` values is through the Admin UI:

1. **Navigate** to Admin → BTL Criteria
2. **Export** current criteria to CSV
3. **Edit** the `option_sort_order` column in Excel/Google Sheets:
   - Set `1` for options that should appear first (e.g., "No")
   - Set `2`, `3`, `4`... for subsequent priority
   - Leave blank or set to empty for default tier-based sorting
4. **Import** the modified CSV back

### Supported Column Names

When importing CSV, these column header variants are recognized:
- `option_sort_order`
- `optionsortorder`
- `sort_order`
- `sortorder`
- `option_order`
- `optionorder`

### Example CSV

```csv
criteria_set,product_scope,question_key,question_label,option_label,tier,option_sort_order
BTL,Residential,adverse_credit,Adverse Credit,No,1,1
BTL,Residential,adverse_credit,Adverse Credit,Yes - Minor,2,2
BTL,Residential,adverse_credit,Adverse Credit,Yes - Major,3,3
BTL,Residential,property_type,Property Type,HMO,1,
BTL,Residential,property_type,Property Type,Standard Residential,1,
```

In this example:
- Adverse Credit options are explicitly ordered 1, 2, 3
- Property Type options have no sort order set (will use tier)

## Frontend Implementation

The frontend calculators automatically use the `option_sort_order` column:

- **BTL Calculator**: `frontend/src/components/calculators/BTL_Calculator.jsx`
- **Bridging Calculator**: `frontend/src/components/calculators/BridgingCalculator.jsx`

No code changes are needed when you update sort orders in the database. The changes will be reflected immediately when the page is refreshed.

## Benefits

✅ **No Code Changes**: Configure sorting directly in the database  
✅ **Flexible**: Different sort orders for different questions  
✅ **Backward Compatible**: NULL values use default tier-based sorting  
✅ **Easy to Manage**: Simple SQL updates or CSV import/export  
✅ **Consistent**: Same behavior across BTL and Bridging calculators  
✅ **Bulk Updates**: Use CSV export/import for managing many options at once

## Files Reference

- **Migration**: `database/migrations/062_add_option_sort_order_to_criteria.sql`
- **Helper Script**: `database/scripts/configure_option_sort_order.sql`
- **BTL Calculator**: `frontend/src/components/calculators/BTL_Calculator.jsx`
- **Bridging Calculator**: `frontend/src/components/calculators/BridgingCalculator.jsx`
- **Admin UI (CSV Import/Export)**: `frontend/src/components/admin/CriteriaTable.jsx`
- **Backend API**: `backend/routes/criteria.js`

## Support

For questions or issues:
1. Check verification queries in `configure_option_sort_order.sql`
2. Review the migration file for column definition
3. Test in Supabase SQL Editor before applying to production
4. Check browser console for detailed error messages

## Troubleshooting

### Error: "Failed to update criteria" when saving in Admin UI

**Cause**: The `option_sort_order` column doesn't exist in the database yet.

**Solution**: Run the migration first:

1. Open Supabase SQL Editor (Dashboard → SQL Editor)
2. Copy and execute the contents of `database/migrations/062_add_option_sort_order_to_criteria.sql`
3. Verify the column was created by running `database/scripts/verify_option_sort_order_column.sql`
4. Refresh the Admin UI and try saving again

**Verification Steps**:
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'criteria_config_flat'
  AND column_name = 'option_sort_order';

-- Should return 1 row. If it returns 0 rows, run the migration.
```

### Check browser console for details

If you get an error when saving criteria:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with "Saving criteria:" or "error response:"
4. These show the exact data being sent and the server's error message
5. Share these details if you need further support

