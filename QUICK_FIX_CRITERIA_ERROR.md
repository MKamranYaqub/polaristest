# Quick Fix: "Failed to update criteria" Error

## Problem
Getting error "Failed to update criteria" when trying to save changes in the Admin UI Criteria modal.

## Root Cause
The `option_sort_order` column doesn't exist in your database yet because the migration hasn't been run.

## Solution (2 minutes)

### Step 1: Run the Migration
1. Open your Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of this file:
   ```
   database/migrations/062_add_option_sort_order_to_criteria.sql
   ```
5. Click **Run** (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"

### Step 2: Verify the Column Was Created
Run this query in the SQL Editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'criteria_config_flat'
  AND column_name = 'option_sort_order';
```

**Expected result**: 1 row showing:
- column_name: `option_sort_order`
- data_type: `integer`

### Step 3: Test in Admin UI
1. Go back to the Admin → BTL Criteria page
2. Refresh the page (F5)
3. Click Edit on any row or Add new
4. You should now see the **"Option Sort Order"** field
5. Try saving - it should work now! ✅

## Optional: Set "No" Options to Appear First

After the migration is working, you can set all "No" options to appear first:

```sql
UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE LOWER(TRIM(option_label)) = 'no';
```

## Still Having Issues?

1. **Open Browser Console** (F12)
2. Look for error messages (they'll show the exact problem)
3. Check the Console tab for messages like:
   - "Saving criteria: ..."
   - "error response: ..."
4. Share these messages for further help

## Files Reference
- Migration: `database/migrations/062_add_option_sort_order_to_criteria.sql`
- Verification: `database/scripts/verify_option_sort_order_column.sql`
- Configuration: `database/scripts/configure_option_sort_order.sql`
- Documentation: `docs/CONFIGURABLE_DROPDOWN_SORTING.md`
