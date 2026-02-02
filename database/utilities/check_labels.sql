-- Check current label alias config in results_configuration table
SELECT key, calculator_type, 
       config->'Product Fee %' as product_fee_percent_label,
       config->'Product Fee £' as product_fee_pounds_label
FROM results_configuration 
WHERE key = 'label_aliases';
