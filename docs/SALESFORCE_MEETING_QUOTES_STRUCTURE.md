# Polaris Calculator - Quotes Database Structure
**For Salesforce Integration Meeting**  
**Date:** February 6, 2026

---

## Overview

The Polaris Calculator uses a **Master-Detail pattern** for storing quotes, aligning with Salesforce's standard **Opportunity + OpportunityLineItem** model.

### Database Structure

```
┌─────────────────────────────────────────┐
│  quotes (BTL) / bridge_quotes (Bridge)  │  ← Master Table (1 per quote)
│  - Property details                      │
│  - Client/Broker info                    │
│  - Calculation inputs                    │
└─────────────────────────────────────────┘
                    │
                    │ 1:Many (quote_id)
                    ↓
┌─────────────────────────────────────────┐
│  quote_results / bridge_quote_results   │  ← Detail Table (multiple per quote)
│  - One row per fee column (0-2%, 2-3%,  │
│    3%+, 4%, 5%, 6%)                     │
│  - All calculated values                 │
└─────────────────────────────────────────┘
```

---

## 1. BTL Quotes Table (`quotes` / `btl_quotes`)

### Shared Inputs (Non Fee-Variant)

These fields are stored once per quote and apply to all fee column scenarios.

| Field Label | Database Column | Data Type | Example Value |
|-------------|-----------------|-----------|---------------|
| Quote ID | `id` | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| Reference Number | `reference_number` | TEXT | `MFS-2024-00123` |
| Loan Calculation Type | `loan_calculation_requested` | TEXT | `Max Gross Loan`, `Net Loan Required`, `Specific LTV Required`, `Specific Gross Loan` |
| Property Value | `property_value` | DECIMAL | `50000000` |
| Monthly Rent | `monthly_rent` | DECIMAL | `10000` |
| Top Slicing | `top_slicing` | DECIMAL | `0` |
| Product Type | `product_type` | TEXT | `Core`, `Specialist` |
| Product Scope | `product_scope` | TEXT | `2yr Fix`, `5yr Fix` |
| Retention Choice | `retention_choice` | TEXT | `Standard`, `Retention` |
| Retention LTV | `retention_ltv` | INT | `75` |
| Tier | `tier` | INT | `1`, `2`, `3` |
| Calculator Type | `calculator_type` | TEXT | `BTL` |
| Status | `status` | TEXT | `draft`, `quote_issued`, `dip_submitted` |

### Calculation-Type Specific Inputs

| Field Label | Database Column | Applicable When |
|-------------|-----------------|-----------------|
| Net Loan Required | `specific_net_loan` | `loan_calculation_requested` = `Net Loan Required` |
| Target LTV (%) | `target_ltv` | `loan_calculation_requested` = `Specific LTV Required` |
| Specific Gross Loan | `specific_gross_loan` | `loan_calculation_requested` = `Specific Gross Loan` |

### Client & Broker Information

| Field Label | Database Column | Data Type |
|-------------|-----------------|-----------|
| Client First Name | `client_first_name` | TEXT |
| Client Last Name | `client_last_name` | TEXT |
| Client Email | `client_email` | TEXT |
| Client Phone | `client_phone` | TEXT |
| Borrower Name | `borrower_name` | TEXT |
| Broker Company Name | `broker_company_name` | TEXT |
| Applicant 1 | `applicant1` | JSON |
| Applicant 2 | `applicant2` | JSON |
| Applicant 3 | `applicant3` | JSON |
| Applicant 4 | `applicant4` | JSON |
| Applicant Type | `applicant_type` | TEXT |

### DIP (Decision in Principle) Fields

| Field Label | Database Column | Data Type |
|-------------|-----------------|-----------|
| Is DIP | `is_dip` | BOOLEAN |
| DIP Submitted At | `dip_submitted_at` | TIMESTAMP |
| DIP Status | `dip_status` | TEXT |

### Audit Fields

| Field Label | Database Column | Data Type |
|-------------|-----------------|-----------|
| Created At | `created_at` | TIMESTAMP |
| Updated At | `updated_at` | TIMESTAMP |
| Created By | `created_by_user_id` | UUID |
| Updated By | `updated_by_user_id` | UUID |
| Quote Issued By | `quote_issued_by` | UUID |
| Quote Issued At | `quote_issued_at` | TIMESTAMP |
| Quote Version | `quote_version` | INT |

---

## 2. BTL Quote Results Table (`quote_results`)

### Fee-Variant Outputs

**Each quote generates multiple rows in this table - one per arrangement fee tier.**

Current fee columns: `0-2%`, `2-3%`, `3%+`, `4%`, `5%`, `6%`

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Result ID | `id` | UUID | Auto-generated |
| Quote ID (FK) | `quote_id` | UUID | Links to quotes.id |
| Fee Column | `fee_column` | TEXT | `0-2%`, `2-3%`, `3%+`, `4%`, `5%`, `6%` |

### Loan Calculations (Per Fee Column)

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Gross Loan | `gross_loan` | DECIMAL | `3000000` |
| Net Loan | `net_loan` | DECIMAL | `2658600` |
| LTV (%) | `ltv_percentage` | DECIMAL | `6.00` |
| Net LTV (%) | `net_ltv` | DECIMAL | `5.32` |
| NPB (Net Principal Balance) | `nbp` | DECIMAL | `2718600` |
| NPB LTV (%) | `nbp_ltv` | DECIMAL | `5.44` |
| ICR (%) | `icr` | DECIMAL | `125` |
| Property Value | `property_value` | DECIMAL | `50000000` |

### Rates (Per Fee Column)

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Full Rate (%) | `full_rate` | DECIMAL | `5.89` |
| Pay Rate (%) | `pay_rate` | DECIMAL | `5.12` |
| Initial Rate (%) | `initial_rate` | DECIMAL | `5.12` |
| APRC (%) | `aprc` | DECIMAL | `10.03` |
| Revert Rate | `revert_rate` | TEXT | `MVR` |
| Revert Rate DD | `revert_rate_dd` | DECIMAL | `21475` |

### Fees (Per Fee Column)

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Arrangement Fee (%) | `product_fee_percent` | DECIMAL | `6` |
| Arrangement Fee (£) | `product_fee_pounds` | DECIMAL | `180000` |
| Admin Fee | `admin_fee` | DECIMAL | `199` |
| Broker Client Fee | `broker_client_fee` | DECIMAL | `0` |
| Proc Fee (%) | `broker_commission_proc_fee_percent` | DECIMAL | `0.7` |
| Proc Fee (£) | `broker_commission_proc_fee_pounds` | DECIMAL | `21000` |
| Exit Fee | `exit_fee` | DECIMAL | `0` |
| Title Insurance Cost | `title_insurance_cost` | DECIMAL | `4368` |

### Interest Calculations (Per Fee Column)

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Monthly Interest Cost | `monthly_interest_cost` | DECIMAL | `12800` |
| Rolled Months | `rolled_months` | DECIMAL | `9` |
| Rolled Months Interest | `rolled_months_interest` | DECIMAL | `115200` |
| Deferred Interest (%) | `deferred_interest_percent` | DECIMAL | `0.77` |
| Deferred Interest (£) | `deferred_interest_pounds` | DECIMAL | `46200` |
| Serviced Interest | `serviced_interest` | DECIMAL | `192000` |

### Terms & Other (Per Fee Column)

| Field Label | Database Column | Data Type | Example |
|-------------|-----------------|-----------|---------|
| Direct Debit Amount | `direct_debit` | TEXT/DECIMAL | `12800` |
| ERC (Early Repayment Charge) | `erc` | TEXT | `Yr1: 4%	Yr2: 3%` |
| Total Cost to Borrower | `total_cost_to_borrower` | DECIMAL | `558967` |
| Total Loan Term (months) | `total_loan_term` | DECIMAL | `120` |
| Product Name | `product_name` | TEXT | `BTL Core 2yr Fix` |
| Rent | `rent` | DECIMAL | `10000` |
| Top Slicing | `top_slicing` | DECIMAL | `0` |

---

## 3. Salesforce Mapping Recommendation

### Object Mapping

| Polaris Table | Salesforce Object |
|---------------|-------------------|
| `quotes` / `btl_quotes` | **Opportunity** (or custom Quote object) |
| `quote_results` | **OpportunityLineItem** (or custom Quote_Result__c) |
| Client fields | **Contact** |
| Broker fields | **Account** (Partner type) |

### Data Flow

```
Calculator → API → Database → Salesforce Sync
                      │
                      ├── quotes (Master)  →  Opportunity
                      │       ├── property_value     → Property_Value__c
                      │       ├── monthly_rent       → Monthly_Rent__c
                      │       ├── calculator_type    → Calculator_Type__c
                      │       ├── loan_calculation_requested → Calculation_Type__c
                      │       └── status             → StageName
                      │
                      └── quote_results (Detail) →  OpportunityLineItem
                              ├── fee_column        → Fee_Tier__c
                              ├── gross_loan        → Gross_Loan__c
                              ├── net_loan          → Net_Loan__c
                              ├── ltv_percentage    → LTV__c
                              ├── full_rate         → Full_Rate__c
                              └── ... (all calc fields)
```

### Why Multiple Rows Per Quote?

Each quote generates **3-6 rows** in `quote_results`, one per fee column:

| Row | fee_column | gross_loan | arrangement_fee | full_rate |
|-----|------------|------------|-----------------|-----------|
| 1 | 0-2% | £3,000,000 | 2% (£60,000) | 6.89% |
| 2 | 2-3% | £3,000,000 | 3% (£90,000) | 5.89% |
| 3 | 3%+ | £3,000,000 | 4% (£120,000) | 5.49% |
| 4 | 4% | £3,000,000 | 4% (£120,000) | 5.29% |
| 5 | 5% | £3,000,000 | 5% (£150,000) | 5.09% |
| 6 | 6% | £3,000,000 | 6% (£180,000) | 4.89% |

**Purpose:** Allows customer to compare fee/rate trade-offs and select the best option.

---

## 4. Key Data Keys Summary

### Inputs (Stored in quotes table)

| Data Key | Description |
|----------|-------------|
| `calculation_type` / `loan_calculation_requested` | Max Gross Loan, Net Loan Required, Specific LTV, Specific Gross Loan |
| `property_value` | Property value in GBP |
| `monthly_rent` | Monthly rental income |
| `top_slicing` | Top slicing amount |
| `product` / `product_scope` | Selected product (2yr Fix, 5yr Fix, etc.) |
| `net_loan_required` | Only when calculation type is Net Loan Required |
| `target_ltv_percent` | Only when calculation type is Specific LTV |
| `specific_gross_loan` | Only when calculation type is Specific Gross Loan |

### Outputs (Stored in quote_results table, suffixed by fee tier)

For each fee tier (2%, 3%, 4%, 5%, 6%), the following fields are stored:

| Data Key Pattern | Description |
|------------------|-------------|
| `gross_loan` | Gross loan amount |
| `net_loan` | Net loan after fees deducted |
| `ltv_percentage` | Loan-to-Value percentage |
| `net_ltv` | Net LTV percentage |
| `icr` | Interest Coverage Ratio |
| `full_rate` | Full interest rate |
| `pay_rate` | Pay rate (what borrower pays) |
| `aprc` | Annual Percentage Rate of Charge |
| `rolled_months` | Number of rolled months |
| `deferred_interest_percent` | Deferred interest percentage |
| `deferred_interest_pounds` | Deferred interest in pounds |
| `admin_fee` | Admin fee |
| `broker_client_fee` | Broker client fee |
| `direct_debit` | Monthly direct debit amount |
| `erc` | Early Repayment Charge terms |
| `monthly_interest_cost` | Monthly interest cost |
| `revert_rate` | Revert rate (e.g., MVR) |
| `revert_rate_dd` | Revert rate direct debit amount |
| `rolled_months_interest` | Total rolled months interest |
| `serviced_interest` | Serviced interest total |
| `title_insurance_cost` | Title insurance cost |
| `total_cost_to_borrower` | Total cost to borrower |
| `product_fee_percent` | Arrangement fee percentage |
| `product_fee_pounds` | Arrangement fee in pounds |
| `total_loan_term` | Full term in months |
| `nbp` | Net Principal Balance |
| `nbp_ltv` | NPB LTV percentage |
| `broker_commission_proc_fee_percent` | Proc fee percentage |
| `broker_commission_proc_fee_pounds` | Proc fee in pounds |

---

## 5. API Endpoints for Salesforce Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/quotes` | GET | List all quotes with pagination |
| `GET /api/quotes/:id` | GET | Get single quote with all results |
| `POST /api/quotes` | POST | Create new quote |
| `PUT /api/quotes/:id` | PUT | Update existing quote |
| `GET /api/salesforce/sync` | GET | Sync quotes to Salesforce (if implemented) |

---

## Contact

For technical questions about the database structure or API:
- **Backend Routes:** `/backend/routes/quotes.js`
- **Database Migrations:** `/database/migrations/`
- **Calculation Engines:** `/frontend/src/utils/btlCalculationEngine.js`
