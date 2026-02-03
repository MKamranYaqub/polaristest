# Salesforce Integration Setup Guide

## Overview
This guide walks you through connecting the Polaris Calculator with Salesforce using OAuth 2.0.

---

## Phase 1: Salesforce Connected App Setup

### 1. Create Connected App in Salesforce

1. Log into your Salesforce instance (Dev/Sandbox or Production)
2. Go to **Setup** → Search for **"App Manager"** → Click **App Manager**
3. Click **New Connected App** (or **New External Client App**)
4. Fill in the form:

   **Basic Information:**
   - Connected App Name: `Polaris Calculator`
   - API Name: `Polaris_Calculator` (auto-filled)
   - Contact Email: `your-email@company.com`

   **API (Enable OAuth Settings):** ✅ CHECK THIS BOX
   - Callback URL: 
     ```
     http://localhost:3001/api/salesforce/callback
     ```
     (For production: `https://your-backend-url.onrender.com/api/salesforce/callback`)
   
   - Selected OAuth Scopes (move to "Selected OAuth Scopes" column):
     - ✅ `Manage user data via APIs (api)`
     - ✅ `Perform requests at any time (refresh_token, offline_access)`  
     - ✅ `Access the identity URL service (id, profile, email, address, phone)`

5. Click **Save**
6. Wait 2-10 minutes for the app to activate

### 2. Get Consumer Key & Secret

1. After activation, go back to **App Manager**
2. Find "Polaris Calculator" in the list
3. Click the dropdown arrow (▼) → Select **Manage Consumer Details**
4. Verify your identity (2FA code will be sent to your email/phone)
5. Copy these values:
   - **Consumer Key** (this is your Client ID)
   - **Consumer Secret** (click "Click to reveal" if hidden)

---

## Phase 2: Configure Polaris Backend

### 1. Add Environment Variables

Edit your `backend/.env` file and add:

```env
# Salesforce Integration
SALESFORCE_CLIENT_ID=your-consumer-key-from-salesforce
SALESFORCE_CLIENT_SECRET=your-consumer-secret-from-salesforce
SALESFORCE_CALLBACK_URL=http://localhost:3001/api/salesforce/callback
SALESFORCE_LOGIN_URL=https://test.salesforce.com
```

**Important Notes:**
- Use `https://test.salesforce.com` for Sandbox/Developer Edition
- Use `https://login.salesforce.com` for Production
- Replace `your-consumer-key-from-salesforce` with actual Consumer Key
- Replace `your-consumer-secret-from-salesforce` with actual Consumer Secret

### 2. Restart Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3001
```

---

## Phase 3: Test the Connection

### Method 1: Using Browser (OAuth Flow)

1. Open your browser and go to:
   ```
   http://localhost:3001/api/salesforce/auth
   ```

2. You'll be redirected to Salesforce login page
3. Log in with your Salesforce credentials
4. Click **Allow** to grant access to Polaris Calculator
5. You'll be redirected back to Polaris (should show success message)

### Method 2: Using API Testing Tool (Postman/curl)

**Check Connection Status:**
```bash
curl http://localhost:3001/api/salesforce/connection-status
```

**Expected Response (if connected):**
```json
{
  "connected": true,
  "instanceUrl": "https://yourcompany.my.salesforce.com",
  "connectedAt": "2026-02-03T10:30:00.000Z",
  "expiresAt": "2026-02-03T12:30:00.000Z"
}
```

**Test API Call (after connecting):**
```bash
curl http://localhost:3001/api/salesforce/test-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Salesforce",
  "userInfo": {
    "userId": "0050...",
    "organizationId": "00D0...",
    "username": "you@company.com",
    "email": "you@company.com",
    "name": "Your Name"
  }
}
```

### Method 3: Create Test Opportunity

```bash
curl -X POST http://localhost:3001/api/salesforce/create-opportunity \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Mortgage Quote - Polaris",
    "stageName": "Qualification",
    "amount": 500000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "opportunityId": "0060...",
  "message": "Opportunity created successfully"
}
```

Go to Salesforce → **Opportunities** → You should see the new opportunity!

---

## Phase 4: Production Deployment

### 1. Update Salesforce Connected App

Go back to your Connected App in Salesforce:
1. Edit the Connected App
2. Add production callback URL:
   ```
   https://your-backend-url.onrender.com/api/salesforce/callback
   ```
3. Keep both localhost and production URLs for testing

### 2. Update Production Environment Variables

In your production hosting (Render):
1. Go to your backend service settings
2. Add environment variables:
   ```
   SALESFORCE_CLIENT_ID=your-consumer-key
   SALESFORCE_CLIENT_SECRET=your-consumer-secret
   SALESFORCE_CALLBACK_URL=https://your-backend-url.onrender.com/api/salesforce/callback
   SALESFORCE_LOGIN_URL=https://login.salesforce.com
   ```

### 3. Test Production Connection

```bash
curl https://your-backend-url.onrender.com/api/salesforce/connection-status
```

---

## Troubleshooting

### Issue: "invalid_client_id" Error
**Solution:** Double-check that your `SALESFORCE_CLIENT_ID` exactly matches the Consumer Key from Salesforce (no extra spaces)

### Issue: "redirect_uri_mismatch" Error
**Solution:** The callback URL in your .env must EXACTLY match the callback URL in your Connected App settings

### Issue: "401 Unauthorized" After Some Time
**Solution:** Access tokens expire after 2 hours. The system should auto-refresh, but you can reconnect:
```bash
# Disconnect
curl -X POST http://localhost:3001/api/salesforce/disconnect

# Reconnect
# Visit http://localhost:3001/api/salesforce/auth again
```

### Issue: Can't See Consumer Secret
**Solution:** Click "Manage Consumer Details" button, not "View" button. You'll need to verify your identity via 2FA.

### Issue: "API Enabled" Permission Error
**Solution:** In Salesforce Setup → Users → Find your user → Edit → Check "API Enabled" permission

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/salesforce/auth` | GET | Start OAuth flow (redirects to Salesforce) |
| `/api/salesforce/callback` | GET | OAuth callback (handled automatically) |
| `/api/salesforce/connection-status` | GET | Check if connected |
| `/api/salesforce/test-connection` | GET | Test connection with API call |
| `/api/salesforce/disconnect` | POST | Revoke access token |
| `/api/salesforce/webhook` | POST | Receive webhooks from Salesforce |
| `/api/salesforce/create-opportunity` | POST | Create test opportunity |

---

## Next Steps

Once the basic connection is working, we can:

1. ✅ **Add Database Fields** - Store external_id, source_system, salesforce_stage in quotes table
2. ✅ **Enhance Calculators** - Accept URL parameters from Salesforce (e.g., `?sf_opp_id=123`)
3. ✅ **Build Visualforce Page** - Embed calculator in Salesforce iframe
4. ✅ **Add Webhook Handlers** - Sync data when Salesforce records change
5. ✅ **Implement Stage Tracking** - Track which Salesforce stage the quote came from

---

## Security Best Practices

1. ✅ **Never commit** `.env` file to git
2. ✅ **Rotate secrets** if they're accidentally exposed
3. ✅ **Use HTTPS** in production (not HTTP)
4. ✅ **Restrict IP ranges** in Salesforce Connected App settings (optional but recommended)
5. ✅ **Monitor API usage** in Salesforce Setup → System Overview → API Usage

---

## Support

If you encounter issues:
1. Check backend logs: `backend/logs/combined.log`
2. Check Salesforce API logs: Setup → Integrations → API Usage
3. Verify all environment variables are set correctly
4. Ensure your Salesforce user has API Enabled permission

---

**Last Updated:** February 3, 2026  
**Polaris Version:** 1.0.0
