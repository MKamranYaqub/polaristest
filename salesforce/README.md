# Salesforce Visualforce Canvas Setup Guide

## 📦 Files Created

This setup includes:
- **PolarisCalculator.page** - Visualforce page with iframe wrapper
- **PolarisCalculatorController.cls** - Apex controller for Salesforce integration
- **PolarisCalculatorController.cls-meta.xml** - Controller metadata
- **PolarisCalculator.page-meta.xml** - Page metadata

## 🚀 Deployment Steps

### Step 1: Deploy to Salesforce

#### Option A: Using VS Code with Salesforce Extensions

**Step 1.1: Install Salesforce Extension Pack**

1. Open VS Code
2. Click **Extensions** icon in left sidebar (or press `Ctrl+Shift+X`)
3. Search for: `Salesforce Extension Pack`
4. Click **Install** on the one by **Salesforce** (should be the first result)
5. Wait for installation to complete (may take 2-3 minutes)
6. You'll see several extensions install:
   - Salesforce CLI Integration
   - Apex
   - Apex Replay Debugger
   - Lightning Web Components
   - Visualforce
   - Aura Components

**Step 1.2: Verify Installation**

Check bottom-left corner of VS Code:
- You should see a **cloud icon** ☁️ or **"SFDX: No Default Org Set"**
- If you don't see this, **restart VS Code** and check again

**Step 1.3: Connect to Your Salesforce Org**

1. Press `Ctrl+Shift+P` (command palette)
2. Type: `SFDX: Authorize`
3. Select: **SFDX: Authorize an Org** from the list
   
   > **Can't find it?** Try:
   > - Type just "authorize" - it should appear
   > - Check if extensions finished installing (look for "Installing..." at bottom)
   > - Restart VS Code and try again
   
4. Choose **Sandbox** (for test.salesforce.com)
5. Enter an alias (e.g., "DevOrg") or press Enter
6. Browser opens → Log in with `kamran.yaqub@mfsuk.com.dev`
7. Click **Allow**
8. Return to VS Code - you should see "Successfully authorized"

**Step 1.4: Deploy to Salesforce**

1. Find `salesforce` folder in VS Code left sidebar
2. **Right-click** on the `salesforce` folder
3. Select: **SFDX: Deploy Source to Org**
   
   > **Can't find this option?** Make sure you:
   > - Right-clicked the **folder**, not a file
   > - Are connected to an org (check bottom-left corner)
   > - Extensions are fully installed

4. Watch output panel - should say "Successfully deployed"

#### Option B: Manual Deployment via Setup

1. **Deploy Apex Controller:**
   - Go to **Setup** → Quick Find → **Apex Classes**
   - Click **New**
   - Copy content from `PolarisCalculatorController.cls`
   - Click **Save**

2. **Deploy Visualforce Page:**
   - Go to **Setup** → Quick Find → **Visualforce Pages**
   - Click **New**
   - Name: `PolarisCalculator`
   - Label: `Polaris Calculator`
   - Copy content from `PolarisCalculator.page`
   - Check **Available for Lightning Experience, Experience Builder sites, and the mobile app**
   - Click **Save**

### Step 2: Configure Remote Site Settings

Allow Salesforce to load content from Polaris:

1. **Setup** → Quick Find → **Remote Site Settings**
2. Click **New Remote Site**
3. Settings:
   - **Remote Site Name**: `Polaris_Production`
   - **Remote Site URL**: `https://polaristest-theta.vercel.app`
   - **Description**: `Polaris Calculator Production`
   - **Active**: ✓ Checked
4. Click **Save**

### Step 3: Add to Opportunity Page Layout

#### Option A: Lightning App Builder (Recommended)

1. **Open Lightning App Builder:**
   - Go to any **Opportunity** record in Salesforce
   - Click **⚙️ (gear icon)** in top right → **Edit Page**
   - This opens the Lightning App Builder

2. **Add Visualforce Component:**
   - From the left sidebar, find **Standard** components
   - Drag the **Visualforce** component onto your page (typically in the main content area)
   - A placeholder box will appear where you dropped it

3. **Configure the Component:**
   - Click on the Visualforce component you just added
   - In the right sidebar, you'll see properties:
     - **Visualforce Page Name**: Select `PolarisCalculator` from the dropdown
     - **Label**: (Optional) Enter "Mortgage Calculator" or leave default
     - **Height**: Enter `800` (in pixels) - this controls how tall the calculator appears
   
4. **Add URL Parameters (IMPORTANT):**
   - Still in the right sidebar, scroll down to find **Visualforce Page Parameters** section
   - Click **Add Parameter** twice to add these two parameters:
   
   **Parameter 1:**
   - **Parameter Name**: `oppId`
   - **Parameter Value**: Click the dropdown → Select **{!recordId}**
     - This passes the current Opportunity ID to the calculator
   
   **Parameter 2:**
   - **Parameter Name**: `recordType`  
   - **Parameter Value**: Click the dropdown → Select **{!Record.RecordType.DeveloperName}**
     - This tells the calculator whether to show BTL or Bridging
   
   > **What are these parameters?**
   > - `oppId={!recordId}` - Automatically passes the current Opportunity's ID so the calculator knows which deal to load
   > - `recordType={!Record.RecordType.DeveloperName}` - Passes "BTL" or "Bridging" so the correct calculator type loads
   
5. **Preview and Adjust:**
   - Look at the preview in the middle of the screen
   - If the calculator looks too small/large, adjust the **Height** value
   - You can also drag the component to different sections of the page

6. **Save and Activate:**
   - Click **Save** in the top right
   - Click **Activate** to make it live
   - Choose **Assign as Org Default** (applies to all opportunities) or **App, Record Type, and Profile** (selective)
   - Click **Save** again
   - Click **Back** arrow to return to your Opportunity

**Result:** The calculator will now appear on all Opportunity pages, automatically loading with the current opportunity's details!

#### Option B: Classic Page Layout

1. **Setup** → **Object Manager** → **Opportunity** → **Page Layouts**
2. Edit the layout you want
3. Drag **Visualforce Page** from palette
4. Select `PolarisCalculator`
5. Set height: `800px`
6. Click **Save**

### Step 4: Create Custom Fields (Optional)

To store quote references on Opportunity:

1. **Setup** → **Object Manager** → **Opportunity** → **Fields & Relationships**
2. Click **New**, create these fields:

**Field 1:**
- **Data Type**: Text
- **Field Label**: `Polaris Quote ID`
- **Field Name**: `Polaris_Quote_ID`
- **Length**: 255
- **Description**: `ID of the quote in Polaris system`

**Field 2:**
- **Data Type**: Text
- **Field Label**: `Polaris Quote Reference`
- **Field Name**: `Polaris_Quote_Reference`
- **Length**: 50
- **Description**: `Human-readable quote reference (e.g., BTL-2024-001)`

3. Add fields to page layout
4. Uncomment lines in `PolarisCalculatorController.cls` (lines 56-57)

## 🔧 Configuration Options

### URL Parameters

Pass parameters to control the calculator:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `oppId` | Salesforce Opportunity ID | `oppId={!recordId}` |
| `stage` | Initial stage (1-5) | `stage=1` |
| `recordType` | Opportunity record type | `recordType={!Opportunity.RecordType.DeveloperName}` |

**Example URL:**
```
/apex/PolarisCalculator?oppId=006XXXXXXXX&stage=1&recordType=BTL
```

### Stage Mapping

Map Salesforce stages to Polaris stages:

| Polaris Stage | Salesforce Stage Name |
|---------------|----------------------|
| 1 | DIP (Decision in Principle) |
| 2 | Valuation |
| 3 | Underwriting |
| 4 | Legal |
| 5 | Completion |

## 🎨 Customization

### Change Calculator Type

Edit `PolarisCalculator.page` line 68-74 to customize logic:

```javascript
// Default to Bridging instead of BTL
let calculatorPath = '/bridging-calculator'; // Changed from /btl-calculator

// Or use record type
if (recordType === 'BTL') {
    calculatorPath = '/btl-calculator';
} else if (recordType === 'Bridging') {
    calculatorPath = '/bridging-calculator';
}
```

### Adjust Height

In Lightning App Builder:
- Select the Visualforce component
- Change **Height** property (recommended: 800px or 100%)

In Classic:
- Edit page layout
- Double-click the Visualforce component
- Change height value

### Custom Branding

Add your logo/branding by editing the loading screen in `PolarisCalculator.page`:

```html
<div class="loading-container" id="loading">
    <img src="/resource/YourLogoResource" alt="Loading" />
    <div class="loading-spinner"></div>
</div>
```

## 🔐 Security Configuration

### Content Security Policy (CSP)

If you see CSP errors:

1. **Setup** → Quick Find → **CSP Trusted Sites**
2. Click **New Trusted Site**
3. Settings:
   - **Trusted Site Name**: `Polaris_Calculator`
   - **Trusted Site URL**: `https://polaristest-theta.vercel.app`
   - **Active**: ✓ Checked
   - **Context**: All
   - **Allow site for**: Everything except "Connect src"

### CORS Configuration

Already configured in Polaris backend (server.js line 58-66):
```javascript
origin: ['https://polaristest-theta.vercel.app', 'http://localhost:3000']
```

For Salesforce access, you may need to add Salesforce domains to CORS.

## 📱 Mobile Support

The Visualforce page is mobile-responsive:
- Set `availableInTouch="true"` in metadata (already configured)
- Test on Salesforce Mobile App
- Adjust height if needed for mobile view

## 🧪 Testing

### Test in Salesforce Classic
```
https://your-instance.salesforce.com/apex/PolarisCalculator?oppId=006XXXXXXXX
```

### Test in Lightning
1. Navigate to any Opportunity
2. The calculator should appear in the page layout
3. Check browser console for errors

### Test Parameters
```
/apex/PolarisCalculator?oppId=006XXXXXXXX&stage=2&recordType=BTL
```

## 🐛 Troubleshooting

### Calculator Not Loading
- Check Remote Site Settings are configured
- Verify frontend URL is correct in Visualforce page
- Check browser console for CORS errors

### Parameters Not Passing
- Verify URL parameters in Lightning App Builder
- Use `{!recordId}` for current record
- Check JavaScript console for parameter values

### Height Issues
- Set height to `800px` minimum
- Use `100%` for full-page layouts
- Adjust based on your page layout

### CSP Errors
- Add Polaris domain to CSP Trusted Sites
- Check Content-Security-Policy in browser DevTools

## 🔄 Future Enhancements

### Bidirectional Communication

Already prepared in the code (line 97-115):
- `QUOTE_SAVED` - When user saves a quote
- `STAGE_CHANGE` - When stage is updated
- `CALCULATOR_READY` - When calculator loads

### Custom Fields Integration

Uncomment lines 56-57 in controller after creating custom fields:
```apex
opp.put('Polaris_Quote_ID__c', quoteId);
opp.put('Polaris_Quote_Reference__c', quoteReference);
```

### Opportunity Auto-Update

Add webhook listener in Polaris backend to update Salesforce when quotes are saved.

## 📞 Support

For issues:
1. Check browser console for JavaScript errors
2. Check Salesforce debug logs for Apex errors
3. Verify all remote site settings
4. Test direct URL access to Visualforce page

---

**Last Updated**: February 2026  
**Salesforce API Version**: 60.0  
**Polaris Version**: Production (polaristest-theta.vercel.app)
