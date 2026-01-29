# Field-Level Permissions & Microsoft Entra ID Integration Plan

**Document Version**: 1.0  
**Created**: January 29, 2026  
**Status**: Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Role Structure](#proposed-role-structure)
4. [Field-Level Permission Architecture](#field-level-permission-architecture)
5. [Microsoft Entra ID Integration](#microsoft-entra-id-integration)
6. [Implementation Steps](#implementation-steps)
7. [IT Team Requirements](#it-team-requirements)
8. [Configuration Reference](#configuration-reference)

---

## Executive Summary

This plan outlines the expansion of Polaris's permission system from 5 roles to 9+ roles with granular field-level control, integrated with Microsoft Entra ID (Azure AD) for enterprise authentication from day one.

### Key Changes

| Aspect | Current State | Proposed State |
|--------|---------------|----------------|
| Authentication | Email/password + JWT | Microsoft Entra ID (SSO) |
| Role Definition | Numeric levels (1-5) | String-based role names |
| Permission Scope | Page-level only | Field-level granularity |
| Admin Access | Levels 1-3, 5 | Admin only (others restricted) |
| Role Count | 5 roles | 9 roles |

---

## Current State Analysis

### Existing Authentication Architecture

- **Location**: `frontend/src/contexts/AuthContext.jsx`
- **Type**: React Context API with JWT-based authentication
- **Token Storage**: `localStorage.getItem('auth_token')`
- **Session Timeout**: 30 minutes idle timeout with 2-minute warning
- **Token Expiry**: 7 days (set in backend JWT signing)

### Current Access Levels

```javascript
const ACCESS_LEVELS = {
  ADMIN: 1,           // Full access to everything
  UW_TEAM_LEAD: 2,    // Edit calculators, rates, constants, criteria
  HEAD_OF_UW: 3,      // Edit calculators, rates, constants, criteria
  UNDERWRITER: 4,     // Access calculators and quotes only (read-only)
  PRODUCT_TEAM: 5,    // Edit rates, constants, and criteria
};
```

### Current Permission Functions

| Function | Logic | Purpose |
|----------|-------|---------|
| `hasPermission(level)` | `user.access_level <= level` | Generic permission check |
| `canEditCalculators()` | Levels 1-4 | Calculator field editing |
| `canAccessAdmin()` | All except level 4 | Admin page access |
| `canEditRatesAndCriteria()` | All except level 4 | Rate/criteria editing |
| `isUnderwriter()` | Level 4 only | Underwriter check |
| `isAdmin()` | Level 1 only | Admin check |

### Current Admin Page Access

| Admin Page | Current Access |
|------------|----------------|
| App Constants | Levels 1, 2, 3, 5 |
| BTL Criteria | Levels 1, 2, 3, 5 |
| BTL Rates | Levels 1, 2, 3, 5 |
| Bridging Rates | Levels 1, 2, 3, 5 |
| Global Settings | Levels 1, 2, 3, 5 |
| UW Requirements | Levels 1, 2, 3, 5 |
| Data Health | Levels 1, 2, 3, 5 |
| **User Management** | Level 1 only |
| **Support Requests** | Level 1 only |
| **API Keys** | Level 1 only |

---

## Proposed Role Structure

### New Role Matrix (9 Roles)

| Role | Entra Group Name | Calculator Access | Admin Access | Primary Function |
|------|------------------|-------------------|--------------|------------------|
| Admin | `Polaris-Admin` | Full edit | All pages | System administration |
| UW Team Lead | `Polaris-UW-TeamLead` | Full edit | **None** | Underwriting supervision |
| Head of UW | `Polaris-Head-UW` | Full edit | **None** | Underwriting leadership |
| Underwriter | `Polaris-Underwriter` | **Read-only** | None | Quote review |
| Product Team | `Polaris-Product` | Read-only | Rates, Criteria, Constants only | Product configuration |
| Retention | `Polaris-Retention` | Retention fields | None | Retention quotes |
| Head of Retention | `Polaris-Head-Retention` | Retention + reporting | None | Retention leadership |
| Sales | `Polaris-Sales` | Sales fields | None | Sales quotes |
| Head of Sales | `Polaris-Head-Sales` | Sales + reporting | None | Sales leadership |

### Admin Access Changes

| Role | Current Admin Access | New Admin Access |
|------|---------------------|------------------|
| Admin | All pages | All pages (unchanged) |
| UW Team Lead | All except User Mgmt | **None** |
| Head of UW | All except User Mgmt | **None** |
| Underwriter | None | None (unchanged) |
| Product Team | All except User Mgmt | Rates, Criteria, Constants only |
| Retention | N/A | None |
| Head of Retention | N/A | None |
| Sales | N/A | None |
| Head of Sales | N/A | None |

---

## Field-Level Permission Architecture

### Permission Types

Each field can have three permission states:

| State | Description |
|-------|-------------|
| **Hidden** | Field not rendered in UI |
| **Visible (Read-only)** | Field displayed but disabled |
| **Editable** | Field fully interactive |

### Field Categories

#### 1. Product Configuration Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `productScope` | Quote type (Residential/Commercial/Semi-Commercial) | Admin, UW roles, Retention roles |
| `retentionChoice` | Is this a Retention quote? | Admin, Retention, Head of Retention |
| `retentionLtv` | Retention LTV selection | Admin, Retention, Head of Retention |
| `selectedRange` | Product range (Specialist/Core) | Admin, UW roles, Retention roles |

#### 2. Property & Income Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `propertyValue` | Property value | All except Product Team |
| `monthlyRent` | Monthly rental income | All except Product Team |
| `topSlicing` | Additional income | Admin, UW roles |
| `firstChargeValue` | First charge amount (Bridging) | Admin, UW roles |

#### 3. Loan Configuration Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `loanType` | Loan calculation type | Admin, UW roles |
| `netLoanRequired` | Net loan amount | All except Product Team |
| `targetLtv` | Target LTV slider | Admin, UW roles |
| `specificGrossLoan` | Specific gross loan | Admin, UW roles |
| `loanTerm` | Bridging loan term | Admin, UW roles |
| `commitmentFee` | Commitment fee | Admin, UW roles |
| `exitFeePercent` | Exit fee percentage | Admin, UW roles |

#### 4. Rate Override Fields (Restricted)

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `fullRateOverride` | Override pay rate | Admin, UW Team Lead only |
| `productFeeOverride` | Override product fee % | Admin, UW Team Lead only |
| `rolledMonths` | Rolled months slider | Admin, UW roles |
| `deferredInterest` | Deferred interest slider | Admin, UW roles |

#### 5. Client Details Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `clientFirstName` | Client first name | All |
| `clientLastName` | Client last name | All |
| `clientEmail` | Client email | All |
| `clientTelephone` | Client phone | All |

#### 6. Broker Details Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `clientType` | Client type (Broker/Direct) | Admin, Sales, Retention |
| `brokerCompany` | Broker company name | Admin, Sales, Retention |
| `brokerRoute` | Broker route selection | Admin, Sales, Retention |
| `procFeePercent` | Proc fee percentage | Admin, Sales roles |
| `procFeeCorePercent` | Proc fee Core % | Admin, Sales roles |

#### 7. Additional Fees Fields

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `hasAdditionalFee` | Additional fees toggle | Admin, Sales roles |
| `feeType` | Fee calculation type | Admin, Sales roles |
| `additionalFeeAmount` | Additional fee amount | Admin, Sales roles |

#### 8. Criteria Questions (Dynamic)

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `questions.*` | All dynamic criteria questions | Admin, UW roles |
| `answers.*` | All dynamic criteria answers | Admin, UW roles |

#### 9. Multi-Property Fields (Bridging)

| Field ID | Description | Editable By |
|----------|-------------|-------------|
| `properties[].address` | Property address | Admin, UW roles |
| `properties[].type` | Property type | Admin, UW roles |
| `properties[].value` | Property value | Admin, UW roles |
| `properties[].chargeType` | Charge type | Admin, UW roles |
| `properties[].firstCharge` | First charge amount | Admin, UW roles |

### Results Table Row Visibility

| Row Category | Rows | Hidden From |
|--------------|------|-------------|
| **Loan Amounts** | Gross Loan, Net Loan, NPB | *Visible to all* |
| **LTV Metrics** | LTV, Net LTV, NPB LTV | *Visible to all* |
| **Rates** | Pay Rate, Full Rate, Revert Rate | *Visible to all* |
| **Interest Calcs** | ICR, Monthly Interest Cost, Total Interest | Hidden from Sales |
| **Internal Fees** | Proc Fee %, Proc Fee £, Admin Fee | Hidden from Sales |
| **Client Fees** | Exit Fee, Product Fee, Commitment Fee | *Visible to all* |
| **ERC Details** | ERC, ERC Yr1, ERC Yr2 | Hidden from Sales |
| **Cost Summary** | Total Cost to Borrower, Title Insurance | *Visible to all* |
| **Technical** | APRC, Direct Debit, Rolled Months Interest | Admin, UW roles only |

### Action Button Permissions

| Action | Allowed Roles |
|--------|---------------|
| Calculate | All |
| Save Quote | All |
| Issue Quote | Admin, UW roles, Sales, Retention |
| Issue DIP | Admin, UW roles only |
| Clear Results | All |
| Reset All | All |
| + New Quote | All |

---

## Microsoft Entra ID Integration

### Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend API    │      │   Entra ID      │
│   (MSAL.js)     │──────│  /auth/entra     │──────│   (Azure AD)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │
        │ 1. Login redirect       │
        │ ───────────────────────>│ 2. Azure login
        │                         │<──────────────────
        │ 3. Token + groups       │
        │<────────────────────────│
        │                         │
        │ 4. Exchange for JWT     │ 5. Map group → role
        │ ───────────────────────>│    Store in JWT claims
        │                         │
        │ 6. Local JWT + role     │
        │<────────────────────────│
```

### Authentication Flow

1. User clicks "Sign in with Microsoft"
2. Frontend (MSAL.js) redirects to Microsoft login
3. User authenticates with Microsoft credentials + MFA
4. Microsoft redirects back to `/auth/callback` with tokens
5. Frontend extracts ID token with groups claim
6. Frontend sends token to `POST /api/auth/entra`
7. Backend validates token with Microsoft
   - Verify signature using Microsoft's public keys
   - Check audience (client_id) and issuer (tenant)
   - Extract groups array from token claims
8. Backend maps group IDs → role name
9. Backend creates/updates user in Supabase
   - Find user by email (from token)
   - If new: create user with role
   - If exists: update last_login, sync role
10. Backend issues local JWT with role claim
11. Frontend stores JWT, user is authenticated

### Entra Security Groups

| Group Name | Object ID (from IT) | Maps to Role |
|------------|---------------------|--------------|
| `Polaris-Admin` | *TBD* | ADMIN |
| `Polaris-UW-TeamLead` | *TBD* | UW_TEAM_LEAD |
| `Polaris-Head-UW` | *TBD* | HEAD_OF_UW |
| `Polaris-Underwriter` | *TBD* | UNDERWRITER |
| `Polaris-Product` | *TBD* | PRODUCT_TEAM |
| `Polaris-Retention` | *TBD* | RETENTION |
| `Polaris-Head-Retention` | *TBD* | HEAD_OF_RETENTION |
| `Polaris-Sales` | *TBD* | SALES |
| `Polaris-Head-Sales` | *TBD* | HEAD_OF_SALES |

### Role Priority (Multi-Group Handling)

If a user belongs to multiple groups, assign the highest-priority role:

```javascript
const rolePriority = [
  'ADMIN',           // 1st - highest
  'HEAD_OF_UW',      // 2nd
  'UW_TEAM_LEAD',    // 3rd
  'HEAD_OF_RETENTION',
  'HEAD_OF_SALES',
  'RETENTION',
  'SALES',
  'UNDERWRITER',
  'PRODUCT_TEAM'     // Last - lowest
];
```

---

## Implementation Steps

### Phase 1: Permission Configuration (No Auth Changes)

| Step | Task | Files to Create/Modify |
|------|------|------------------------|
| 1.1 | Create roles config | `frontend/src/config/roles.js` |
| 1.2 | Create field permissions config | `frontend/src/config/fieldPermissions.js` |
| 1.3 | Create results permissions config | `frontend/src/config/resultsPermissions.js` |
| 1.4 | Create admin permissions config | `frontend/src/config/adminPermissions.js` |
| 1.5 | Create `useFieldPermissions` hook | `frontend/src/hooks/useFieldPermissions.js` |
| 1.6 | Update ProtectedRoute | `frontend/src/pages/ProtectedRoute.jsx` |

### Phase 2: Entra ID Integration

| Step | Task | Files to Create/Modify |
|------|------|------------------------|
| 2.1 | Install MSAL packages | `frontend/package.json` |
| 2.2 | Create MSAL config | `frontend/src/config/authConfig.js` |
| 2.3 | Create Entra login button | `frontend/src/components/auth/EntraLoginButton.jsx` |
| 2.4 | Create auth callback page | `frontend/src/pages/AuthCallback.jsx` |
| 2.5 | Create backend Entra roles config | `backend/config/entraRoles.js` |
| 2.6 | Create token validation middleware | `backend/middleware/validateEntraToken.js` |
| 2.7 | Create Entra auth route | `backend/routes/entraAuth.js` |
| 2.8 | Update AuthContext for Entra | `frontend/src/contexts/AuthContext.jsx` |
| 2.9 | Update App.jsx with MSAL provider | `frontend/src/App.jsx` |
| 2.10 | Update LoginPage | `frontend/src/pages/LoginPage.jsx` |
| 2.11 | Update backend server | `backend/server.js` |

### Phase 3: Field-Level Permission Enforcement

| Step | Task | Files to Modify |
|------|------|-----------------|
| 3.1 | Apply permissions to BTL Calculator | `frontend/src/components/calculators/BTL_Calculator.jsx` |
| 3.2 | Apply permissions to Bridging Calculator | `frontend/src/components/calculators/BridgingCalculator.jsx` |
| 3.3 | Apply permissions to Results Tables | Results table components |
| 3.4 | Apply permissions to Admin pages | All admin page components |

### Phase 4: Testing & Validation

| Step | Task |
|------|------|
| 4.1 | Test each role's calculator access |
| 4.2 | Test each role's admin page access |
| 4.3 | Test field visibility per role |
| 4.4 | Test field editability per role |
| 4.5 | Test results row visibility per role |
| 4.6 | Test action button permissions |
| 4.7 | Test Entra login/logout flow |
| 4.8 | Test token refresh |
| 4.9 | Test role sync on login |

---

## IT Team Requirements

### App Registration Request

Request IT to create an Entra ID App Registration with:

| Item | Value |
|------|-------|
| **App Name** | Polaris Mortgage Calculator |
| **Redirect URIs** | `https://polaristest-theta.vercel.app/auth/callback`, `http://localhost:5173/auth/callback` |
| **API Permissions** | `User.Read`, `GroupMember.Read.All`, `openid`, `profile`, `email` |
| **Token Config** | Groups claim enabled (emit as Group Object IDs) |
| **Admin Consent** | Required for `GroupMember.Read.All` |

### Security Groups Request

Request IT to create these 9 security groups:

1. `Polaris-Admin`
2. `Polaris-UW-TeamLead`
3. `Polaris-Head-UW`
4. `Polaris-Underwriter`
5. `Polaris-Product`
6. `Polaris-Retention`
7. `Polaris-Head-Retention`
8. `Polaris-Sales`
9. `Polaris-Head-Sales`

### Information to Receive from IT

| Item | Description |
|------|-------------|
| Application (Client) ID | Unique app identifier |
| Directory (Tenant) ID | Organization's Entra tenant |
| Client Secret | Backend authentication (keep secure) |
| Group Object IDs | 9 GUIDs for each security group |

### Sample Email to IT Team

```
Subject: Entra ID App Registration Request - Polaris Mortgage Calculator

Hi IT Team,

We need to integrate our Polaris application with Microsoft Entra ID for 
authentication. Please create:

1. App Registration named "Polaris Mortgage Calculator" with:
   - Redirect URIs: 
     - https://polaristest-theta.vercel.app/auth/callback
     - http://localhost:5173/auth/callback
   - Client secret (please share securely)
   - API permissions: User.Read, GroupMember.Read.All, openid, profile, email
   - Groups claim enabled in token configuration

2. Security Groups (9 total):
   - Polaris-Admin
   - Polaris-UW-TeamLead
   - Polaris-Head-UW
   - Polaris-Underwriter
   - Polaris-Product
   - Polaris-Retention
   - Polaris-Head-Retention
   - Polaris-Sales
   - Polaris-Head-Sales

Please provide: Application ID, Tenant ID, Client Secret, and Group Object IDs.

Thanks!
```

---

## Configuration Reference

### Backend Environment Variables (Render)

```env
# Entra ID App Registration
AZURE_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_SECRET=~your-client-secret

# Entra Group Object IDs → Role Mapping
ENTRA_GROUP_ADMIN=11111111-aaaa-bbbb-cccc-111111111111
ENTRA_GROUP_UW_TEAM_LEAD=22222222-aaaa-bbbb-cccc-222222222222
ENTRA_GROUP_HEAD_UW=33333333-aaaa-bbbb-cccc-333333333333
ENTRA_GROUP_UNDERWRITER=44444444-aaaa-bbbb-cccc-444444444444
ENTRA_GROUP_PRODUCT=55555555-aaaa-bbbb-cccc-555555555555
ENTRA_GROUP_RETENTION=66666666-aaaa-bbbb-cccc-666666666666
ENTRA_GROUP_HEAD_RETENTION=77777777-aaaa-bbbb-cccc-777777777777
ENTRA_GROUP_SALES=88888888-aaaa-bbbb-cccc-888888888888
ENTRA_GROUP_HEAD_SALES=99999999-aaaa-bbbb-cccc-999999999999
```

### Frontend Environment Variables (Vercel)

```env
# Public Entra values only (no secrets!)
VITE_AZURE_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
VITE_AZURE_TENANT_ID=your-tenant-id-here
VITE_AZURE_REDIRECT_URI=https://polaristest-theta.vercel.app/auth/callback
```

### MSAL Configuration

```javascript
// frontend/src/config/authConfig.js
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};
```

### Group-to-Role Mapping

```javascript
// backend/config/entraRoles.js
const GROUP_TO_ROLE = {
  [process.env.ENTRA_GROUP_ADMIN]: 'ADMIN',
  [process.env.ENTRA_GROUP_UW_TEAM_LEAD]: 'UW_TEAM_LEAD',
  [process.env.ENTRA_GROUP_HEAD_UW]: 'HEAD_OF_UW',
  [process.env.ENTRA_GROUP_UNDERWRITER]: 'UNDERWRITER',
  [process.env.ENTRA_GROUP_PRODUCT]: 'PRODUCT_TEAM',
  [process.env.ENTRA_GROUP_RETENTION]: 'RETENTION',
  [process.env.ENTRA_GROUP_HEAD_RETENTION]: 'HEAD_OF_RETENTION',
  [process.env.ENTRA_GROUP_SALES]: 'SALES',
  [process.env.ENTRA_GROUP_HEAD_SALES]: 'HEAD_OF_SALES',
};

const rolePriority = [
  'ADMIN', 'HEAD_OF_UW', 'UW_TEAM_LEAD', 'HEAD_OF_RETENTION', 
  'HEAD_OF_SALES', 'RETENTION', 'SALES', 'UNDERWRITER', 'PRODUCT_TEAM'
];

export const mapGroupsToRole = (groupIds = []) => {
  const userRoles = groupIds
    .map(gid => GROUP_TO_ROLE[gid])
    .filter(Boolean);
  
  return rolePriority.find(role => userRoles.includes(role)) || 'UNDERWRITER';
};
```

### Field Permissions Configuration

```javascript
// frontend/src/config/fieldPermissions.js
export const FIELD_PERMISSIONS = {
  // Format: fieldId: { visible: [roles], editable: [roles] }
  // Use '*' to mean "all roles"
  
  // Product Configuration
  productScope: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  retentionChoice: { 
    visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'RETENTION', 'HEAD_OF_RETENTION'], 
    editable: ['ADMIN', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  retentionLtv: { 
    visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'RETENTION', 'HEAD_OF_RETENTION'], 
    editable: ['ADMIN', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  selectedRange: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  
  // Property & Income
  propertyValue: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'RETENTION', 'HEAD_OF_RETENTION', 'SALES', 'HEAD_OF_SALES'] 
  },
  monthlyRent: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'RETENTION', 'HEAD_OF_RETENTION', 'SALES', 'HEAD_OF_SALES'] 
  },
  topSlicing: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  
  // Loan Configuration
  loanType: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  netLoanRequired: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'RETENTION', 'HEAD_OF_RETENTION', 'SALES', 'HEAD_OF_SALES'] 
  },
  targetLtv: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  specificGrossLoan: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  
  // Rate Overrides - highly restricted
  fullRateOverride: { 
    visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD'] 
  },
  productFeeOverride: { 
    visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD'] 
  },
  rolledMonths: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  deferredInterest: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
  
  // Client Details - open to all
  clientFirstName: { visible: ['*'], editable: ['*'] },
  clientLastName: { visible: ['*'], editable: ['*'] },
  clientEmail: { visible: ['*'], editable: ['*'] },
  clientTelephone: { visible: ['*'], editable: ['*'] },
  
  // Broker Details
  clientType: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  brokerCompany: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  brokerRoute: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES', 'RETENTION', 'HEAD_OF_RETENTION'] 
  },
  procFeePercent: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES'] 
  },
  
  // Additional Fees
  hasAdditionalFee: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES'] 
  },
  feeType: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES'] 
  },
  additionalFeeAmount: { 
    visible: ['*'], 
    editable: ['ADMIN', 'SALES', 'HEAD_OF_SALES'] 
  },
  
  // Criteria Questions
  questions: { 
    visible: ['*'], 
    editable: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW'] 
  },
};

// Helper function
export const canViewField = (fieldId, role) => {
  const perm = FIELD_PERMISSIONS[fieldId];
  if (!perm) return true; // Default visible if not configured
  return perm.visible.includes('*') || perm.visible.includes(role);
};

export const canEditField = (fieldId, role) => {
  const perm = FIELD_PERMISSIONS[fieldId];
  if (!perm) return false; // Default not editable if not configured
  return perm.editable.includes('*') || perm.editable.includes(role);
};
```

### Results Table Permissions

```javascript
// frontend/src/config/resultsPermissions.js
export const RESULTS_PERMISSIONS = {
  // Format: rowKey: { visible: [roles] }
  // Use '*' for all roles
  
  // Loan Amounts - visible to all
  'Gross Loan': { visible: ['*'] },
  'Net Loan': { visible: ['*'] },
  'NPB': { visible: ['*'] },
  
  // LTV Metrics - visible to all
  'LTV': { visible: ['*'] },
  'Net LTV': { visible: ['*'] },
  'NPB LTV': { visible: ['*'] },
  
  // Rates - visible to all
  'Pay Rate': { visible: ['*'] },
  'Full Rate': { visible: ['*'] },
  'Revert Rate': { visible: ['*'] },
  
  // Interest Calculations - hidden from Sales
  'ICR': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Monthly Interest Cost': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Total Interest': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  
  // Internal Fees - hidden from Sales
  'Proc Fee (%)': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Proc Fee (£)': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Admin Fee': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  
  // ERC - hidden from Sales
  'ERC': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Early Repayment Charge Yr1': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  'Early Repayment Charge Yr2': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER', 'PRODUCT_TEAM', 'RETENTION', 'HEAD_OF_RETENTION'] },
  
  // Technical rows - Admin/UW only
  'APRC': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER'] },
  'Direct Debit': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER'] },
  'Rolled Months Interest': { visible: ['ADMIN', 'UW_TEAM_LEAD', 'HEAD_OF_UW', 'UNDERWRITER'] },
  
  // Client-facing - visible to all
  'Exit Fee': { visible: ['*'] },
  'Product Fee %': { visible: ['*'] },
  'Product Fee £': { visible: ['*'] },
  'Commitment Fee £': { visible: ['*'] },
  'Total Cost to Borrower': { visible: ['*'] },
  'Title Insurance Cost': { visible: ['*'] },
};

export const canViewResultRow = (rowKey, role) => {
  const perm = RESULTS_PERMISSIONS[rowKey];
  if (!perm) return true; // Default visible if not configured
  return perm.visible.includes('*') || perm.visible.includes(role);
};
```

### Admin Page Permissions

```javascript
// frontend/src/config/adminPermissions.js
export const ADMIN_PAGE_PERMISSIONS = {
  '/admin': ['ADMIN'],
  '/admin/constants': ['ADMIN', 'PRODUCT_TEAM'],
  '/admin/btl-criteria': ['ADMIN', 'PRODUCT_TEAM'],
  '/admin/btl-rates': ['ADMIN', 'PRODUCT_TEAM'],
  '/admin/bridging-rates': ['ADMIN', 'PRODUCT_TEAM'],
  '/admin/global-settings': ['ADMIN'],
  '/admin/uw-requirements': ['ADMIN'],
  '/admin/data-health': ['ADMIN'],
  '/admin/users': ['ADMIN'],
  '/admin/support-requests': ['ADMIN'],
  '/admin/api-keys': ['ADMIN'],
};

export const canAccessAdminPage = (route, role) => {
  const allowed = ADMIN_PAGE_PERMISSIONS[route];
  if (!allowed) return false;
  return allowed.includes(role);
};
```

### Package Dependencies

```bash
# Frontend
npm install @azure/msal-browser @azure/msal-react

# Backend
npm install jwks-rsa jsonwebtoken
```

---

## Open Questions / Decisions Needed

| Question | Options | Recommendation |
|----------|---------|----------------|
| Role inheritance? | Independent definitions vs. hierarchical | Independent (clearer) |
| Default for new fields? | Hidden vs. Admin-only editable | Admin-only editable |
| Audit logging? | Log permission denials | Yes (helps debugging) |
| Calculator restrictions? | Sales=Bridging only, Retention=BTL only? | Same calculator, different fields |
| Database storage? | Config files vs. DB table | Start with config files |
| Dual auth period? | Keep email/password during transition | Entra-only from day one |
| User provisioning? | Auto-create on first login | Yes (with default role) |
| Role sync? | Every login vs. session cache | Every login |
| Entra outage fallback? | Emergency admin access | Not needed (Entra is reliable) |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Permission Configs | 2-3 days | None |
| Phase 2: Entra Integration | 3-5 days | IT credentials received |
| Phase 3: Field Enforcement | 3-5 days | Phase 1 complete |
| Phase 4: Testing | 2-3 days | All phases complete |
| **Total** | **10-16 days** | |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 29, 2026 | GitHub Copilot | Initial plan created |
