-- Helper Script: Set option_sort_order values for criteria dropdowns
-- Purpose: Easily configure the display order of dropdown options
-- Date: 2026-02-09
--
-- Instructions:
-- 1. Run the migration 062_add_option_sort_order_to_criteria.sql first
-- 2. Customize the queries below to set your desired sort order
-- 3. Execute in your Supabase SQL editor or via psql

-- ============================================================================
-- EXAMPLE 1: Set all "No" options to appear first (option_sort_order = 1)
-- ============================================================================

UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE LOWER(TRIM(option_label)) = 'no';

-- ============================================================================
-- EXAMPLE 2: Set specific options for a particular question
-- ============================================================================

-- Example: For the "Adverse Credit" question, set order: No (1), Yes-Minor (2), Yes-Major (3)
UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE question_key = 'adverse_credit' 
  AND LOWER(TRIM(option_label)) = 'no';

UPDATE criteria_config_flat 
SET option_sort_order = 2 
WHERE question_key = 'adverse_credit' 
  AND LOWER(TRIM(option_label)) LIKE '%minor%';

UPDATE criteria_config_flat 
SET option_sort_order = 3 
WHERE question_key = 'adverse_credit' 
  AND LOWER(TRIM(option_label)) LIKE '%major%';

-- ============================================================================
-- EXAMPLE 3: Set all "Yes"/"No" questions to show No first, Yes second
-- ============================================================================

-- Set "No" to 1
UPDATE criteria_config_flat 
SET option_sort_order = 1 
WHERE LOWER(TRIM(option_label)) = 'no';

-- Set "Yes" to 2
UPDATE criteria_config_flat 
SET option_sort_order = 2 
WHERE LOWER(TRIM(option_label)) = 'yes';

-- ============================================================================
-- EXAMPLE 4: For a specific question, prioritize certain property types
-- ============================================================================

-- Example: For property type question, order: Residential (1), Semi-Commercial (2), Commercial (3)
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

-- ============================================================================
-- EXAMPLE 5: Reset option_sort_order to NULL (use default tier-based sort)
-- ============================================================================

-- Reset all
UPDATE criteria_config_flat 
SET option_sort_order = NULL;

-- Reset specific question
UPDATE criteria_config_flat 
SET option_sort_order = NULL 
WHERE question_key = 'your_question_key';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View current option_sort_order settings for all criteria
SELECT 
  criteria_set,
  product_scope,
  question_key,
  question_label,
  option_label,
  tier,
  option_sort_order,
  display_order
FROM criteria_config_flat
WHERE option_sort_order IS NOT NULL
ORDER BY 
  criteria_set, 
  display_order, 
  question_key, 
  option_sort_order;

-- View options for a specific question
SELECT 
  question_key,
  option_label,
  tier,
  option_sort_order
FROM criteria_config_flat
WHERE question_key = 'your_question_key'  -- Replace with actual question key
ORDER BY 
  COALESCE(option_sort_order, 9999),  -- NULL sorts last
  tier,
  id;

-- Count how many options have custom sort order set
SELECT 
  COUNT(*) as total_options,
  COUNT(option_sort_order) as options_with_custom_sort,
  COUNT(*) - COUNT(option_sort_order) as options_with_default_sort
FROM criteria_config_flat;

-- View questions grouped by how many custom sort orders they have
SELECT 
  question_key,
  question_label,
  COUNT(*) as total_options,
  COUNT(option_sort_order) as custom_sorted_options
FROM criteria_config_flat
GROUP BY question_key, question_label
HAVING COUNT(option_sort_order) > 0
ORDER BY custom_sorted_options DESC;
