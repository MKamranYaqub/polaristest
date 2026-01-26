"""
Read Bridging Excel - Mixed Charge Types & Property Types Analysis
"""
import openpyxl
import warnings
warnings.filterwarnings('ignore')

path = r'c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest\frontend\integration\samples\Issued - Bridge Calc 070126.xlsm'
wb = openpyxl.load_workbook(path, read_only=False, data_only=False)

print('=' * 70)
print('MIXED CHARGE TYPE ANALYSIS')
print('=' * 70)

# Check Input Sheet for how charge type is determined
sheet_input = wb['Input Sheet']
print()
print('=== Input Sheet - Charge Type Logic ===')
for row in range(15, 25):
    for col in ['A', 'B', 'C', 'D', 'E']:
        cell = sheet_input[f'{col}{row}']
        if cell.value:
            print(f'{col}{row}: {str(cell.value)[:70]}')

# Check Main Calculations for charge type impact
print()
print('=== Main Calculations - Charge Type References ===')
sheet_main = wb['Main Calculations']
for row in range(1, 80):
    for col_idx in range(1, 10):
        col_letter = openpyxl.utils.get_column_letter(col_idx)
        cell = sheet_main[f'{col_letter}{row}']
        if cell.value and isinstance(cell.value, str):
            val = cell.value.lower()
            if 'charge' in val or '1st' in val or '2nd' in val:
                print(f'{col_letter}{row}: {str(cell.value)[:70]}')

print()
print('=' * 70)
print('MIXED PROPERTY TYPE ANALYSIS')
print('=' * 70)

# Check Rates sheet for property type columns
sheet_rates = wb['Rates']
print()
print('=== Rate Table Columns (Property Types) ===')
print('Variable Rates Row 7:')
for col in ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
    cell = sheet_rates[f'{col}7']
    if cell.value:
        print(f'  {col}: {cell.value}')

print()
print('Fixed Rates Row 21:')
for col in ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
    cell = sheet_rates[f'{col}21']
    if cell.value:
        print(f'  {col}: {cell.value}')

# Check Multi Property Deal for property type column
print()
print('=== Multi Property Deal - Property Type Column (J) ===')
sheet_multi = wb['Multi Property Deal']
print(f'Header J3: {sheet_multi["J3"].value}')
print(f'J4 formula: {sheet_multi["J4"].value}')

# Check Dropdowns for property type options
print()
print('=== Dropdowns Sheet - Property Type Options ===')
sheet_dropdowns = wb['Dropdowns']
for row in range(1, 30):
    for col in ['A', 'B', 'C', 'D']:
        cell = sheet_dropdowns[f'{col}{row}']
        if cell.value and isinstance(cell.value, str):
            val = cell.value.lower()
            if 'property' in val or 'commercial' in val or 'residential' in val or 'type' in val:
                print(f'{col}{row}: {cell.value}')

print()
print('=' * 70)
print('KEY BUSINESS LOGIC FINDINGS')
print('=' * 70)
