# Polaris - Salesforce Integration Report

**Generated:** January 29, 2026  
**Purpose:** Map database tables and APIs for Salesforce integration  
**Status:** Analysis Complete

---

## Executive Summary

This report identifies **7 quote-related tables** and **11 API routes** that need to be mapped for Salesforce integration. Key findings include:
- **Duplicate fields** that store same data in different columns (consolidation recommended)
- **Unused fields** that are never populated (candidates for removal)
- **Inconsistent naming** between similar fields across tables

---

## 📊 Table Analysis

### 1. `quotes` (BTL Quotes Master Table)

**Total Rows:** 58  
**Purpose:** Stores Buy-to-Let mortgage quote configurations

#### Field Categories for Salesforce Mapping:

| Category | Salesforce Object | Priority |
|----------|------------------|----------|
| Quote Identity | Opportunity/Quote | HIGH |
| Client Details | Contact/Account | HIGH |
| Property Details | Custom Object | HIGH |
| Calculation Inputs | Quote Line Item | MEDIUM |
| Status/Workflow | Opportunity Stage | HIGH |
| Broker Details | Account (Partner) | MEDIUM |

#### ⚠️ DUPLICATE FIELDS (Consolidation Required):

| Field A | Field B | Usage A | Usage B | Recommendation |
|---------|---------|---------|---------|----------------|
| `borrower_name` | `quote_borrower_name` | 49/58 (84%) | 42/58 (72%) | **Merge to `borrower_name`** - Use quote_borrower_name only for PDF override |
| `notes` | `quote_additional_notes` | 4/58 (7%) | 42/58 (72%) | **Merge to `notes`** - quote_additional_notes is primary |
| `product_range` | `quote_product_range` | 21/58 (36%) | 25/58 (43%) | **Keep both** - Different purposes (calc vs PDF) |
| `selected_range` | `product_range` | 58/58 (100%) | 21/58 (36%) | **Merge to `selected_range`** |

#### ❌ UNUSED/RARELY USED FIELDS:

| Field | Populated | Recommendation |
|-------|-----------|----------------|
| `company_name` | 4/58 (7%) | Keep - used for Ltd company applicants |
| `notes` | 4/58 (7%) | Merge with `quote_additional_notes` |
| `specific_gross_loan` | 6/58 (10%) | Keep - conditional field for specific loan calc |
| `specific_net_loan` | 8/58 (14%) | Keep - conditional field for specific loan calc |
| `additional_fee_amount` | 12/58 (21%) | Keep - conditional field |

#### ✅ RECOMMENDED SALESFORCE MAPPING:

```
quotes → SF Quote Object
├── id → Quote.ExternalId__c (UUID)
├── reference_number → Quote.Name (MFS-XXXXX)
├── created_at → Quote.CreatedDate
├── updated_at → Quote.LastModifiedDate
│
├── CLIENT DETAILS (→ Contact)
│   ├── client_first_name → Contact.FirstName
│   ├── client_last_name → Contact.LastName
│   ├── client_email → Contact.Email
│   ├── client_contact_number → Contact.Phone
│   ├── client_type → Contact.Type__c (Individual/Ltd Company)
│   └── company_name → Account.Name (if Ltd)
│
├── PROPERTY (→ Custom Object: Property__c)
│   ├── property_value → Property__c.Value__c
│   ├── monthly_rent → Property__c.MonthlyRent__c
│   ├── top_slicing → Property__c.TopSlicing__c
│   └── security_properties → Property__c.Details__c (JSON)
│
├── LOAN CONFIGURATION
│   ├── calculator_type → Quote.Calculator_Type__c (BTL/BRIDGING)
│   ├── loan_calculation_requested → Quote.Loan_Calc_Type__c
│   ├── product_type → Quote.Product_Type__c
│   ├── product_scope → Quote.Product_Scope__c
│   ├── retention_choice → Quote.Retention_Choice__c
│   ├── retention_ltv → Quote.Retention_LTV__c
│   ├── tier → Quote.Tier__c
│   ├── target_ltv → Quote.Target_LTV__c
│   └── title_insurance → Quote.Title_Insurance__c
│
├── FEES
│   ├── add_fees_toggle → Quote.Add_Fees__c
│   ├── fee_calculation_type → Quote.Fee_Calc_Type__c
│   ├── fee_type_selection → Quote.Fee_Type__c
│   └── additional_fee_amount → Quote.Additional_Fee__c
│
├── WORKFLOW STATUS
│   ├── status → Quote.Status (Picklist)
│   ├── quote_status → Quote.Quote_Issued_Status__c
│   ├── quote_issued_at → Quote.Quote_Issued_Date__c
│   ├── dip_status → Quote.DIP_Status__c
│   ├── dip_issued_at → Quote.DIP_Issued_Date__c
│   ├── dip_date → Quote.DIP_Date__c
│   └── dip_expiry_date → Quote.DIP_Expiry__c
│
├── BROKER (→ Partner Account)
│   ├── broker_company_name → Account.Name
│   ├── broker_route → Account.Route__c
│   ├── broker_commission_percent → Quote.Broker_Commission__c
│   └── funding_line → Quote.Funding_Line__c
│
└── AUDIT
    ├── user_id → Quote.OwnerId (via lookup)
    ├── created_by → Quote.Created_By_Name__c
    ├── created_by_id → Quote.Created_By_Id__c
    ├── updated_by → Quote.Last_Modified_By_Name__c
    └── updated_by_id → Quote.Last_Modified_By_Id__c
```

---

### 2. `quote_results` (BTL Calculation Results)

**Total Rows:** 340  
**Purpose:** Stores calculation results per fee column (0-2%, 2-3%, 3%+)

#### ⚠️ DUPLICATE FIELDS:

| Field A | Field B | Usage A | Usage B | Recommendation |
|---------|---------|---------|---------|----------------|
| `admin_fee` | `admin_fee_amount` | 340/340 (100%) | 208/340 (61%) | **Keep `admin_fee`** - primary |
| `ltv_percentage` | `net_ltv` | 260/340 (76%) | 260/340 (76%) | **Keep both** - different calculations |

#### ❌ UNUSED FIELDS:

| Field | Populated | Recommendation |
|-------|-----------|----------------|
| `erc_4` | 0/340 (0%) | **REMOVE** - Never used |
| `erc_5` | 0/340 (0%) | **REMOVE** - Never used |
| `erc_3` | 17/340 (5%) | Keep - rarely used but valid |
| `nbp_ltv` | 126/340 (37%) | Keep - used in specific scenarios |
| `floor_rate` | 96/340 (28%) | Keep - tracker products only |

#### ✅ RECOMMENDED SALESFORCE MAPPING:

```
quote_results → SF Quote Line Item
├── id → QuoteLineItem.ExternalId__c
├── quote_id → QuoteLineItem.QuoteId (Lookup)
├── fee_column → QuoteLineItem.Fee_Column__c (0-2%, 2-3%, 3%+)
├── stage → QuoteLineItem.Stage__c (QUOTE/DIP)
│
├── LOAN AMOUNTS
│   ├── gross_loan → QuoteLineItem.Gross_Loan__c
│   ├── net_loan → QuoteLineItem.Net_Loan__c
│   ├── property_value → QuoteLineItem.Property_Value__c
│   ├── ltv_percentage → QuoteLineItem.LTV__c
│   ├── net_ltv → QuoteLineItem.Net_LTV__c
│   └── nbp_ltv → QuoteLineItem.NBP_LTV__c
│
├── RATES
│   ├── initial_rate → QuoteLineItem.Initial_Rate__c
│   ├── pay_rate → QuoteLineItem.Pay_Rate__c
│   ├── revert_rate → QuoteLineItem.Revert_Rate__c
│   ├── full_rate → QuoteLineItem.Full_Rate__c
│   ├── aprc → QuoteLineItem.APRC__c
│   └── floor_rate → QuoteLineItem.Floor_Rate__c
│
├── FEES
│   ├── product_fee_percent → QuoteLineItem.Product_Fee_Pct__c
│   ├── product_fee_pounds → QuoteLineItem.Product_Fee_GBP__c
│   ├── admin_fee → QuoteLineItem.Admin_Fee__c (PRIMARY)
│   ├── broker_commission_proc_fee_percent → QuoteLineItem.Broker_Proc_Fee_Pct__c
│   ├── broker_commission_proc_fee_pounds → QuoteLineItem.Broker_Proc_Fee_GBP__c
│   ├── commitment_fee_pounds → QuoteLineItem.Commitment_Fee__c
│   ├── exit_fee → QuoteLineItem.Exit_Fee__c
│   └── proc_fee → QuoteLineItem.Proc_Fee__c
│
├── INTEREST CALCULATIONS
│   ├── icr → QuoteLineItem.ICR__c
│   ├── monthly_interest_cost → QuoteLineItem.Monthly_Interest__c
│   ├── rolled_months → QuoteLineItem.Rolled_Months__c
│   ├── rolled_months_interest → QuoteLineItem.Rolled_Interest__c
│   ├── deferred_interest_percent → QuoteLineItem.Deferred_Int_Pct__c
│   ├── deferred_interest_pounds → QuoteLineItem.Deferred_Int_GBP__c
│   └── serviced_interest → QuoteLineItem.Serviced_Interest__c
│
├── TERMS
│   ├── initial_term → QuoteLineItem.Initial_Term__c
│   ├── full_term → QuoteLineItem.Full_Term__c
│   ├── total_loan_term → QuoteLineItem.Total_Term__c
│   └── serviced_months → QuoteLineItem.Serviced_Months__c
│
├── ERC (Early Repayment Charges)
│   ├── erc → QuoteLineItem.ERC_Text__c
│   ├── erc_1 → QuoteLineItem.ERC_Year1__c
│   ├── erc_2 → QuoteLineItem.ERC_Year2__c
│   └── erc_3 → QuoteLineItem.ERC_Year3__c
│
└── METADATA
    ├── product_name → QuoteLineItem.Product_Name__c
    ├── product_range → QuoteLineItem.Product_Range__c
    ├── rate_id → QuoteLineItem.Rate_Id__c
    └── created_at → QuoteLineItem.CreatedDate
```

---

### 3. `bridge_quotes` (Bridging/Fusion Quotes Master)

**Total Rows:** 44  
**Purpose:** Stores Bridging and Fusion mortgage quote configurations

#### ⚠️ DUPLICATE FIELDS (Same as BTL):

| Field A | Field B | Usage A | Usage B | Recommendation |
|---------|---------|---------|---------|----------------|
| `borrower_name` | `quote_borrower_name` | 35/44 (80%) | 23/44 (52%) | **Merge to `borrower_name`** |
| `notes` | `quote_additional_notes` | 3/44 (7%) | 23/44 (52%) | **Merge to `notes`** |
| `product_range` | `quote_product_range` | 11/44 (25%) | 15/44 (34%) | Keep both - different purposes |

#### ❌ UNUSED/RARELY USED FIELDS:

| Field | Populated | Recommendation |
|-------|-----------|----------------|
| `first_charge_value` | 2/44 (5%) | Keep - 2nd charge bridging only |
| `company_name` | 3/44 (7%) | Keep - Ltd company applicants |
| `notes` | 3/44 (7%) | Merge with `quote_additional_notes` |
| `commitment_fee` | 15/44 (34%) | Keep - valid field |
| `exit_fee_percent` | 12/44 (27%) | Keep - valid field |

#### Bridging-Specific Fields:

```
bridge_quotes → SF Quote Object (Type = Bridging)
├── bridging_loan_term → Quote.Bridging_Term__c
├── charge_type → Quote.Charge_Type__c (1st/2nd)
├── sub_product → Quote.Sub_Product__c
├── first_charge_value → Quote.First_Charge_Value__c
├── commitment_fee → Quote.Commitment_Fee__c
└── exit_fee_percent → Quote.Exit_Fee_Pct__c
```

---

### 4. `bridge_quote_results` (Bridging Calculation Results)

**Total Rows:** 213  
**Purpose:** Stores bridging/fusion calculation results

#### ⚠️ DUPLICATE FIELDS:

| Field A | Field B | Usage A | Usage B | Recommendation |
|---------|---------|---------|---------|----------------|
| `ltv_percentage` | `net_ltv` | 165/213 | 165/213 | Keep both - different purposes |
| `ltv_percentage` | `gross_ltv` | 165/213 | 153/213 | Keep both - different calculations |
| `aprc` | `aprc_annual` | 153/213 | 153/213 | **Merge to `aprc`** |

#### ❌ NEVER USED FIELDS:

| Field | Populated | Recommendation |
|-------|-----------|----------------|
| `nbp_ltv` | 0/213 (0%) | **REMOVE** - Never used in bridging |
| `full_rate_monthly` | 0/213 (0%) | **REMOVE** - Use margin_monthly instead |
| `full_annual_rate` | 0/213 (0%) | **REMOVE** - Never populated |
| `full_coupon_rate_monthly` | 0/213 (0%) | **REMOVE** - Never populated |

#### Bridging-Specific Result Fields:

```
bridge_quote_results (Additional to BTL)
├── term_months → QuoteLineItem.Term_Months__c
├── tier_name → QuoteLineItem.Tier_Name__c
├── product_kind → QuoteLineItem.Product_Kind__c
├── ltv_bucket → QuoteLineItem.LTV_Bucket__c
├── charge_type → QuoteLineItem.Charge_Type__c
├── arrangement_fee_gbp → QuoteLineItem.Arrangement_Fee_GBP__c
├── arrangement_fee_pct → QuoteLineItem.Arrangement_Fee_Pct__c
├── rolled_interest_coupon → QuoteLineItem.Rolled_Int_Coupon__c
├── rolled_interest_bbr → QuoteLineItem.Rolled_Int_BBR__c
├── full_interest_coupon → QuoteLineItem.Full_Int_Coupon__c
├── full_interest_bbr → QuoteLineItem.Full_Int_BBR__c
├── margin_monthly → QuoteLineItem.Margin_Monthly__c
├── bbr_monthly → QuoteLineItem.BBR_Monthly__c
├── deferred_interest_rate → QuoteLineItem.Deferred_Rate__c
├── monthly_payment → QuoteLineItem.Monthly_Payment__c
├── total_amount_repayable → QuoteLineItem.Total_Repayable__c
└── total_interest → QuoteLineItem.Total_Interest__c
```

---

### 5. `public_quote_submissions` (Lead Capture)

**Purpose:** Public-facing quote request forms (pre-registration leads)

```
public_quote_submissions → SF Lead Object
├── id → Lead.ExternalId__c
├── client_name → Lead.Name
├── client_email → Lead.Email
├── client_phone → Lead.Phone
├── calculator_type → Lead.Calculator_Type__c
├── property_value → Lead.Property_Value__c
├── monthly_rent → Lead.Monthly_Rent__c
├── criteria_answers → Lead.Criteria_Answers__c (Long Text)
├── calculation_results → Lead.Calculation_Results__c (Long Text)
├── ip_address → Lead.IP_Address__c
├── gdpr_consent → Lead.GDPR_Consent__c
├── status → Lead.Status
├── created_at → Lead.CreatedDate
└── contacted_at → Lead.Contacted_Date__c
```

---

## 📎 Appendix: Full Field Inventories

### quotes table (73 columns)
<details>
<summary>Click to expand full column list</summary>

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | PK |
| created_at | timestamptz | NO | Auto |
| name | text | YES | Quote name |
| user_id | uuid | YES | FK to users |
| status | text | YES | Workflow status |
| calculator_type | text | YES | BTL/BRIDGING |
| product_scope | text | YES | Product filter |
| retention_choice | text | YES | |
| retention_ltv | integer | YES | |
| tier | integer | YES | 1-4 |
| property_value | numeric | YES | |
| monthly_rent | numeric | YES | |
| top_slicing | numeric | YES | |
| loan_calculation_requested | text | YES | |
| specific_gross_loan | numeric | YES | |
| specific_net_loan | numeric | YES | |
| target_ltv | integer | YES | |
| product_type | text | YES | |
| add_fees_toggle | boolean | YES | |
| fee_calculation_type | text | YES | |
| additional_fee_amount | numeric | YES | |
| selected_range | text | YES | |
| criteria_answers | jsonb | YES | |
| rates_and_products | jsonb | YES | |
| updated_at | timestamptz | YES | |
| borrower_name | text | YES | **DUPLICATE** |
| notes | text | YES | **RARELY USED** |
| reference_number | text | YES | MFS-XXXXX |
| company_name | text | YES | |
| commercial_or_main_residence | text | YES | |
| dip_date | date | YES | |
| dip_expiry_date | date | YES | |
| guarantor_name | text | YES | |
| lender_legal_fee | text | YES | |
| number_of_applicants | integer | YES | |
| overpayments_percent | numeric | YES | Default 10 |
| security_properties | jsonb | YES | |
| fee_type_selection | text | YES | |
| dip_status | text | YES | Default 'Not Issued' |
| quote_selected_fee_ranges | jsonb | YES | |
| quote_assumptions | jsonb | YES | |
| quote_borrower_name | text | YES | **DUPLICATE** |
| quote_additional_notes | text | YES | **DUPLICATE** |
| quote_issued_at | timestamptz | YES | |
| quote_status | text | YES | Default 'Not Issued' |
| product_range | text | YES | **DUPLICATE** |
| created_by | text | YES | |
| created_by_id | text | YES | |
| updated_by | text | YES | |
| updated_by_id | text | YES | |
| client_type | text | YES | |
| client_first_name | text | YES | |
| client_last_name | text | YES | |
| client_email | text | YES | |
| client_contact_number | text | YES | |
| broker_company_name | text | YES | |
| broker_route | text | YES | |
| broker_commission_percent | numeric | YES | |
| funding_line | text | YES | |
| rates_overrides | jsonb | YES | |
| product_fee_overrides | jsonb | YES | |
| rolled_months_per_column | jsonb | YES | |
| deferred_interest_per_column | jsonb | YES | |
| title_insurance | text | YES | Default 'No' |
| applicant_type | text | YES | |
| quote_product_range | text | YES | **DUPLICATE** |
| quote_version | integer | YES | Default 1 |
| uw_checklist_complete | boolean | YES | Default false |
| uw_checklist_required_complete | boolean | YES | Default false |
| uw_checklist_progress | integer | YES | Default 0 |
| dip_issued_at | timestamptz | YES | |
| title_number | text | YES | |
| company_number | text | YES | |
| shareholders | jsonb | YES | Default [] |
| quote_include_title_insurance | boolean | YES | Default false |

</details>

### quote_results table (68 columns)
<details>
<summary>Click to expand full column list</summary>

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | PK |
| quote_id | uuid | NO | FK |
| fee_column | text | YES | 0-2%, 2-3%, 3%+ |
| gross_loan | numeric | YES | |
| net_loan | numeric | YES | |
| ltv_percentage | numeric | YES | |
| net_ltv | numeric | YES | |
| property_value | numeric | YES | |
| icr | numeric | YES | |
| initial_rate | numeric | YES | |
| pay_rate | numeric | YES | |
| revert_rate | numeric | YES | |
| revert_rate_dd | numeric | YES | |
| full_rate | numeric | YES | |
| aprc | numeric | YES | |
| product_fee_percent | numeric | YES | |
| product_fee_pounds | numeric | YES | |
| admin_fee | numeric | YES | **PRIMARY** |
| broker_client_fee | numeric | YES | |
| broker_commission_proc_fee_percent | numeric | YES | |
| broker_commission_proc_fee_pounds | numeric | YES | |
| commitment_fee_pounds | numeric | YES | |
| exit_fee | numeric | YES | |
| monthly_interest_cost | numeric | YES | |
| rolled_months | numeric | YES | |
| rolled_months_interest | numeric | YES | |
| deferred_interest_percent | numeric | YES | |
| deferred_interest_pounds | numeric | YES | |
| serviced_interest | numeric | YES | |
| direct_debit | text | YES | |
| erc | text | YES | |
| rent | numeric | YES | |
| top_slicing | numeric | YES | |
| nbp | numeric | YES | |
| total_cost_to_borrower | numeric | YES | |
| total_loan_term | numeric | YES | |
| product_name | text | YES | |
| created_at | timestamptz | YES | Auto |
| title_insurance_cost | numeric | YES | |
| initial_term | integer | YES | |
| full_term | integer | YES | |
| revert_rate_type | text | YES | |
| product_range | text | YES | |
| rate_id | text | YES | |
| revert_index | text | YES | |
| revert_margin | numeric | YES | |
| min_loan | numeric | YES | |
| max_loan | numeric | YES | |
| min_ltv | numeric | YES | |
| max_ltv | numeric | YES | |
| max_rolled_months | integer | YES | |
| max_defer_int | numeric | YES | |
| min_icr | numeric | YES | |
| tracker_flag | boolean | YES | |
| max_top_slicing | numeric | YES | |
| admin_fee_amount | numeric | YES | **DUPLICATE** |
| erc_1 | numeric | YES | |
| erc_2 | numeric | YES | |
| erc_3 | numeric | YES | |
| erc_4 | numeric | YES | **NEVER USED** |
| erc_5 | numeric | YES | **NEVER USED** |
| rate_status | text | YES | |
| floor_rate | numeric | YES | |
| proc_fee | numeric | YES | |
| tier | text | YES | |
| property_type | text | YES | |
| retention_type | text | YES | |
| rate_percent | numeric | YES | |
| product_fee_saved | numeric | YES | |
| serviced_months | integer | YES | |
| stage | text | YES | Default 'QUOTE' |
| nbp_ltv | numeric | YES | |

</details>

---

**Report Generated By:** GitHub Copilot (Integration Manager Mode)  
**Next Steps:** Schedule meeting with Salesforce team to review this report and answer critical questions.
