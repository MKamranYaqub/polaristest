-- Verification Script: Check if option_sort_order column exists
-- Run this to verify the migration 062 has been applied successfully

-- Check if column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'criteria_config_flat'
  AND column_name = 'option_sort_order';

-- If the above query returns 0 rows, the column doesn't exist yet
-- You need to run: database/migrations/062_add_option_sort_order_to_criteria.sql

-- Check if index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'criteria_config_flat'
  AND indexname = 'idx_criteria_option_sort_order';

-- Sample data check: View first 10 rows with the new column
SELECT 
    id,
    question_key,
    option_label,
    tier,
    option_sort_order,
    display_order
FROM criteria_config_flat
LIMIT 10;

-- Count rows with option_sort_order set
SELECT 
    COUNT(*) as total_rows,
    COUNT(option_sort_order) as rows_with_sort_order,
    COUNT(*) - COUNT(option_sort_order) as rows_without_sort_order
FROM criteria_config_flat;
