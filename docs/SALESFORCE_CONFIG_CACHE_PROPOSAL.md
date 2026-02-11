# Salesforce Configuration Cache Strategy
## Business Proposal

**Date:** February 10, 2026  
**Prepared for:** Business Leadership & Product Team  
**Status:** Architecture Recommendation  
**Decision Required:** Approach Selection for Product Configuration Storage

---

## Executive Summary

We propose a **hybrid architecture** that enables Salesforce as the admin interface for product configuration (rates, constants, rules) while maintaining high performance for end users.

### Key Benefits
- ✅ **Unlimited concurrent users** (2,000+ supported vs. 15-25 with direct API)
- ✅ **Ultra-fast calculations** (5-15ms vs. 300-500ms with direct Salesforce)
- ✅ **Salesforce as admin UI** (no custom admin panel needed)
- ✅ **99% reduction in Salesforce API costs** (5-10 calls/day vs. 10,000+)
- ✅ **Business continuity** (works even if Salesforce is temporarily down)

### Investment Required
- **Development Effort:** 2-3 weeks
- **Technical Complexity:** Medium (manageable for mid-level developers)

---

## The Problem We're Solving

### Current State
Product configuration (mortgage rates, calculation constants, business rules) is stored in **Supabase database**:
- ✅ Fast performance (20-50ms)
- ✅ Supports 500-1,000 concurrent users
- ❌ Requires custom admin panel for rate updates
- ❌ Admins must learn new interface

### Desired State
Store configuration in **Salesforce** so admins can:
- Use familiar Salesforce interface
- Leverage existing validation rules
- Maintain audit trails automatically
- Integrate with existing CRM workflows

### The Challenge
**Direct Salesforce API integration cannot support our user base:**

| Metric | Direct Salesforce API | Business Requirement |
|--------|----------------------|---------------------|
| Concurrent Users | 15-25 users | 100-500+ users |
| Calculation Speed | 1-2 seconds | <200ms |
| Daily API Limit | 10,000-50,000 | Would exhaust in hours |

**Verdict:** Direct integration is not viable at scale.

---

## Recommended Solution: JSON File Cache

### How It Works

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Admins Update Configuration in Salesforce          │
│  - Edit rates, constants, rules in Salesforce UI            │
│  - Happens throughout the day (ad-hoc)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Once saved in Salesforce
                       ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Scheduled Sync (Every 3 Hours During Business Hrs) │
│  - Automated script fetches all active rates from SF        │
│  - Transforms data to optimized JSON format                 │
│  - Only 5-10 API calls per sync (minimal)                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Uploads JSON files
                       ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Global JSON Storage (Edge Network)                 │
│  - rates_btl.json (BTL rates)                               │
│  - rates_bridging.json (Bridging/Fusion rates)              │
│  - app_constants.json (calculation rules)                   │
│  - Files updated every 3 hours                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Reads from cache (5-15ms)
                       ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Polaris Calculator Reads JSON Files                │
│  - Lightning fast (5-15ms per calculation)                  │
│  - No Salesforce API calls during calculations              │
│  - Supports unlimited concurrent users                      │
└──────────────────────────────────────────────────────────────┘
```

### Key Features

**1. Scheduled Sync**
- Runs every 3 hours during business hours (9 AM - 5 PM)
- Additional daily sync at 3 AM for off-hours updates
- Manual "Sync Now" button for urgent rate changes

**2. Configuration Freshness**
- Max delay: 3 hours during business hours
- Acceptable for mortgage rates (change infrequently)
- Urgent changes: Manual sync completes in 30 seconds

**3. Failure Protection**
- If sync fails: Polaris continues using previous version
- Automatic retries with alerts to IT team
- Backup files maintained for disaster recovery

**4. Admin Experience**
- Admins use Salesforce exclusively (no new system to learn)
- Real-time preview in Salesforce (changes visible immediately in SF)
- Polaris updates within 3 hours (or on-demand sync)

---

## Performance Comparison

### Concurrent User Capacity

| Architecture | Max Concurrent Users | Calculation Speed | SF API Calls/Day |
|--------------|---------------------|-------------------|------------------|
| **Current (Supabase)** | 500-1,000 | 50-100ms | 0 |
| **Direct SF API** ❌ | 15-25 | 1-2 seconds | 10,000-50,000 |
| **JSON Cache** ⭐ | **2,000+** | **5-15ms** | **5-10** |
| **Heroku Connect** | 200-400 | 100-200ms | 0 (continuous) |

### Real-World User Experience

**Scenario: 200 active users during peak hours (11 AM)**

| Architecture | Experience | Technical Details |
|--------------|------------|-------------------|
| **Direct Salesforce API** | ❌ **System Down** | API limits exhausted by 11:30 AM. Calculator shows errors. |
| **JSON Cache** | ✅ **Flawless** | Each calculation takes 0.05 seconds. No noticeable delay. |
| **Current (Supabase)** | ✅ **Excellent** | Each calculation takes 0.08 seconds. Smooth experience. |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Effort:** 3-4 days

- [ ] Design Salesforce object schema (Rate__c, App_Constant__c)
- [ ] Create custom fields in Salesforce
- [ ] Build sync service (fetches from SF, generates JSON)
- [ ] Set up JSON storage (Azure Blob Storage)

**Deliverables:**
- Salesforce objects configured
- Sync service operational (manual trigger)
- JSON files generated successfully

### Phase 2: Automation (Week 2)
**Effort:** 3-4 days

- [ ] Schedule cron jobs (every 3 hours)
- [ ] Build admin "Sync Now" button
- [ ] Add sync monitoring and alerts
- [ ] Implement retry logic for failures

**Deliverables:**
- Automated sync every 3 hours
- Admin can trigger manual sync
- Email alerts on sync failures

### Phase 3: Migration & Testing (Week 3)
**Effort:** 4-5 days

- [ ] Migrate existing rates from Supabase to Salesforce
- [ ] Update Polaris calculator to read from JSON cache
- [ ] User acceptance testing (UAT) with 50 test quotes
- [ ] Performance testing (500+ concurrent users)
- [ ] Admin training on Salesforce rate management

**Deliverables:**
- All rates migrated to Salesforce
- Polaris reads from JSON cache (Supabase removed)
- UAT passed
- Admin trained

### Phase 4: Go-Live (Week 4)
**Effort:** 1-2 days

- [ ] Deploy to production
- [ ] Monitor performance for 48 hours
- [ ] Adjust sync frequency if needed
- [ ] Document procedures for admins

**Deliverables:**
- Production deployment complete
- System running smoothly
- Admin documentation delivered

**Total Timeline:** 3-4 weeks

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Sync Failure** | Medium | Low | Automatic retries, backup files, manual sync button |
| **Stale Configuration** | Low | Medium | Sync every 3 hours, manual sync for urgent changes |
| **Salesforce Downtime** | Low | Very Low | Polaris continues with last synced data (no user impact) |
| **JSON File Corruption** | High | Very Low | Backup files, validation before upload, version control |
| **User Confusion (3hr delay)** | Medium | Low | Clear communication, manual sync option, admin training |

**Overall Risk:** ✅ **LOW** - Well-mitigated with established patterns

---

## Alternative Approaches Considered

### Option A: Heroku Connect (Bi-Directional Sync)
**What it is:** Real-time sync between Salesforce ↔ PostgreSQL

**Pros:**
- Near real-time updates (5-10 min delay)
- Admins use Salesforce
- Polaris queries PostgreSQL (fast)

**Cons:**
- ❌ Complex setup and maintenance
- ❌ Another service to monitor
- ❌ Only supports 200-400 concurrent users

**Verdict:** More expensive and complex than JSON cache

### Option B: Keep Current Supabase Only
**What it is:** Continue current architecture, build custom admin panel

**Pros:**
- ✅ Excellent performance (20-50ms)
- ✅ Supports 500-1,000 users

**Cons:**
- ❌ Must build custom admin UI
- ❌ Admins learn new system
- ❌ No Salesforce integration
- ❌ Separate audit trails

**Verdict:** Good short-term, but lacks enterprise features

### Option C: Direct Salesforce API (Real-Time)
**What it is:** Query Salesforce directly on every calculation

**Pros:**
- ✅ Instant updates
- ✅ No sync logic needed

**Cons:**
- ❌ Only supports 15-25 concurrent users
- ❌ Slow calculations (1-2 seconds)
- ❌ API limits exhausted during peak hours

**Verdict:** ❌ **Not viable** - Does not scale

---

## Decision Matrix

### Choosing the Right Approach

**Use Current Architecture (Supabase)** if:
- ✅ Willing to build custom admin panel
- ✅ 500-1,000 concurrent users is sufficient
- ✅ No need for Salesforce CRM integration

**Use JSON Cache (Recommended)** if:
- ✅ Want Salesforce as admin interface
- ✅ Need to support 1,000-2,000+ concurrent users
- ✅ 3-hour config update delay is acceptable
- ✅ Value enterprise-grade audit trails

**Use Heroku Connect** if:
- ✅ Need <10 minute update delay (not 3 hours)
- ✅ Have DevOps expertise for maintenance
- ❌ Note: Only supports 200-400 concurrent users

**Never Use Direct Salesforce API** because:
- ❌ Fundamentally does not scale
- ❌ Poor user experience (slow)

---

## Recommendation Summary

### For Immediate Term (Next 3 Months)
**Continue with current Supabase architecture**
- Reason: Already working, no urgent scale needs
- Action: Monitor user growth and performance

### For Medium Term (3-12 Months)
**Implement JSON cache strategy**
- Reason: Prepares for scale, provides Salesforce admin UI
- Action: Execute 3-4 week implementation plan

### For Long Term (12+ Months)
**Evaluate Heroku Connect if real-time sync becomes critical**
- Reason: Business may require <10 min update frequency
- Action: Re-assess based on user feedback

---

## Success Metrics

### Performance KPIs
- **Calculation Speed:** <100ms (Target: <50ms)
- **Concurrent Users Supported:** 1,000+ (Target: 2,000+)
- **System Uptime:** >99.9%
- **Sync Success Rate:** >99%

### Business KPIs
- **Admin Satisfaction:** >4.5/5 (Salesforce UI ease of use)
- **Config Update Frequency:** Track how often rates change
- **Time to Update:** <30 seconds (manual sync)
- **User Complaints:** <1% related to stale rates

### Technical KPIs
- **API Response Time:** <50ms average
- **Data Freshness:** <3 hours max delay

---

## Frequently Asked Questions

### Q1: What happens if the sync fails?
**A:** Polaris continues using the previous version of config files. Admins receive an alert, and automatic retries occur every 15 minutes. Manual sync button available for immediate retry.

### Q2: How long does configuration take to update in Polaris?
**A:** Maximum 3 hours during business hours (next scheduled sync). For urgent changes, admins can use "Sync Now" button (completes in 30 seconds).

### Q3: Can admins preview changes before they go live in Polaris?
**A:** Yes, changes are immediately visible in Salesforce. Admins can validate data there. For Polaris preview, we can add a "staging sync" feature (manual trigger to staging environment).

### Q4: What if we need to rollback a rate change?
**A:** Two options:
1. Edit rates in Salesforce and trigger manual sync (30 seconds)
2. IT can restore previous JSON backup file (5 minutes)

### Q5: How many Salesforce licenses do we need?
**A:** Only admin users who update rates need licenses. Typical setup: 3-5 licenses. End users accessing Polaris do NOT need Salesforce licenses.

### Q6: Does this work with our existing Salesforce org?
**A:** Yes, if you have Salesforce already. If not, you'll need to purchase Salesforce licenses for admin users. Canvas integration already exists for quote syncing.

### Q7: What if Salesforce is down during sync?
**A:** Sync will fail and retry automatically. Polaris continues working with last successful sync. No user impact.

### Q8: Can we sync more frequently than every 3 hours?
**A:** Yes, sync frequency is configurable. Options:
- Every 1 hour (recommended for active rate changes)
- Every 30 minutes (max recommended, 48 syncs/day)
- Manual only (admins trigger when needed)

### Q9: How does this affect our current Supabase database?
**A:** Migration path:
1. Phase 1-2: Both systems run in parallel
2. Phase 3: Switch Polaris to JSON cache, keep Supabase as backup
3. Phase 4: Optionally decommission Supabase rate tables

### Q10: What's involved in reverting back to current architecture?
**A:** Simple revert:
1. Switch Polaris back to query Supabase (config change)
2. Stop sync service
3. Total time: <30 minutes

Data is not lost during migration (we run both systems in parallel during testing).

---

## Appendices

### Appendix A: Technical Architecture Diagram

```
                    ┌─────────────────────────────────┐
                    │   SALESFORCE (Source of Truth)  │
                    │                                 │
                    │  ┌──────────────────────────┐  │
                    │  │  Rate__c (Custom Object) │  │
                    │  │  - Name: "BTL Core 5Y"   │  │
                    │  │  - Rate__c: 5.49         │  │
                    │  │  - Min_LTV__c: 60        │  │
                    │  │  - Max_LTV__c: 75        │  │
                    │  │  - Status__c: Active     │  │
                    │  └──────────────────────────┘  │
                    │                                 │
                    │  ┌──────────────────────────┐  │
                    │  │  App_Constant__c         │  │
                    │  │  - Name: "Min ICR"       │  │
                    │  │  - Value__c: 125         │  │
                    │  │  - Type__c: Number       │  │
                    │  └──────────────────────────┘  │
                    └────────────┬────────────────────┘
                                 │
                                 │ Salesforce API
                                 │ SOQL Query (5-10 calls/sync)
                                 │
                    ┌────────────▼────────────────────┐
                    │   AZURE BACKEND (Node.js)       │
                    │                                 │
                    │   salesforceConfigSync.js       │
                    │   ┌───────────────────────┐     │
                    │   │ 1. Fetch from SF      │     │
                    │   │ 2. Transform schema   │     │
                    │   │ 3. Generate JSON      │     │
                    │   │ 4. Upload to storage  │     │
                    │   └───────────────────────┘     │
                    │                                 │
                    │   Cron Jobs:                    │
                    │   - 3 AM daily (full sync)      │
                    │   - 9 AM, 12 PM, 3 PM (weekday) │
                    └────────────┬────────────────────┘
                                 │
                                 │ HTTPS Upload
                                 │
                    ┌────────────▼────────────────────┐
                    │   AZURE BLOB STORAGE            │
                    │   (Global CDN Storage)          │
                    │                                 │
                    │   📄 rates_btl.json             │
                    │   📄 rates_bridging.json        │
                    │   📄 app_constants.json         │
                    │                                 │
                    │   Last Updated: 2026-02-10 12:00│
                    └────────────┬────────────────────┘
                                 │
                                 │ HTTPS Read (5-15ms)
                                 │ Globally distributed
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
   ┌──────────▼──────┐  ┌───────▼────────┐  ┌─────▼──────────┐
   │ Frontend (Azure)│  │ Backend (Azure)│  │ Azure Functions│
   │ - BTL Calculator│  │ - Reporting    │  │ - Quote PDF    │
   │ - Bridging Calc │  │ - Analytics    │  │ - Data Export  │
   └─────────────────┘  └────────────────┘  └────────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                                 │ Fast calculations
                                 │ 5-15ms latency
                                 │
                    ┌────────────▼────────────────────┐
                    │   END USERS (2,000+ concurrent) │
                    │   - Mortgage brokers            │
                    │   - Sales teams                 │
                    │   - Partners                    │
                    └─────────────────────────────────┘
```

### Appendix B: Salesforce Object Schema

**Rate__c (Custom Object)**
```
Field Name            | Type           | Required | Description
---------------------|----------------|----------|---------------------------
Name                 | Text(80)       | Yes      | Display name (e.g., "BTL Core 5Y 75% LTV")
Rate__c              | Number(5,2)    | Yes      | Interest rate percentage
Calculator_Type__c   | Picklist       | Yes      | BTL, Bridging, Fusion
Product__c           | Text(50)       | Yes      | Product name
Tier__c              | Text(50)       | No       | Tier classification
Min_LTV__c           | Number(3,0)    | Yes      | Minimum LTV
Max_LTV__c           | Number(3,0)    | Yes      | Maximum LTV
Min_Loan__c          | Currency       | Yes      | Minimum loan amount
Max_Loan__c          | Currency       | Yes      | Maximum loan amount
Product_Fee__c       | Number(4,2)    | Yes      | Product fee percentage
Initial_Term__c      | Number(2,0)    | Yes      | Initial rate term (months)
Full_Term__c         | Number(3,0)    | Yes      | Full loan term (months)
Status__c            | Picklist       | Yes      | Active, Inactive, Pending
Start_Date__c        | Date           | No       | Rate effective from date
End_Date__c          | Date           | No       | Rate expires on date
Is_Retention__c      | Checkbox       | No       | Retention product flag
Is_Tracker__c        | Checkbox       | No       | Tracker rate flag
```

**App_Constant__c (Custom Object)**
```
Field Name            | Type           | Required | Description
---------------------|----------------|----------|---------------------------
Name                 | Text(80)       | Yes      | Constant name (e.g., "Min ICR")
Value__c             | Text(255)      | Yes      | Constant value
Type__c              | Picklist       | Yes      | Number, Text, Boolean, Date
Category__c          | Picklist       | Yes      | BTL, Bridging, Global
Description__c       | Long Text      | No       | Usage notes
Active__c            | Checkbox       | Yes      | Is constant active
```

### Appendix C: JSON File Structure

**rates_btl.json**
```json
{
  "lastSync": "2026-02-10T12:00:00.000Z",
  "version": "1.0",
  "totalRecords": 247,
  "data": [
    {
      "id": "rec001",
      "set_key": "RATES_CORE",
      "property": "Residential",
      "tier": "1",
      "product": "BTL Core",
      "rate_type": "Fixed",
      "product_fee": 2.0,
      "rate": 5.49,
      "min_ltv": 60,
      "max_ltv": 75,
      "min_loan": 50000,
      "max_loan": 2000000,
      "initial_term": 60,
      "full_term": 300,
      "is_retention": false,
      "is_tracker": false,
      "rate_status": "Active",
      "start_date": "2026-01-01",
      "end_date": null
    }
  ]
}
```

**app_constants.json**
```json
{
  "lastSync": "2026-02-10T12:00:00.000Z",
  "version": "1.0",
  "data": {
    "btl": {
      "minICR": 125,
      "stressTestRate": 2.0,
      "maxLTV": 80,
      "minLoanAmount": 25000
    },
    "bridging": {
      "maxLTV": 75,
      "minGDV": 100000,
      "defaultMonthlyRate": 0.75
    },
    "global": {
      "legalFeesRate": 0.005,
      "surveyorFees": 500
    }
  }
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | Technical Team | Initial proposal |

**Approval Required From:**
- [ ] Technical Leadership
- [ ] Product Management
- [ ] Business Operations

**Next Steps:**
1. Review this proposal with stakeholders
2. Confirm Salesforce licensing requirements
3. Schedule decision meeting
4. If approved: Kick off Phase 1 implementation
5. If declined: Explore alternative approaches

---

**For questions or clarification, contact:**  
Technical Team • [email protected]
