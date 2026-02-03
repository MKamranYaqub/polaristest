import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * Decode Salesforce Canvas signed request
 * @param {string} signedRequest - Base64 encoded signed request from Salesforce
 * @param {string} consumerSecret - OAuth Consumer Secret
 * @returns {Object|null} Decoded canvas request or null if invalid
 */
function decodeSignedRequest(signedRequest, consumerSecret) {
  try {
    const parts = signedRequest.split('.', 2);
    const signature = parts[0];
    const payload = parts[1];

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', consumerSecret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      console.error('Canvas signature verification failed');
      return null;
    }

    // Decode payload
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    console.error('Error decoding signed request:', error);
    return null;
  }
}

/**
 * POST /api/canvas
 * Handle Salesforce Canvas signed request
 */
router.post('/', (req, res) => {
  const signedRequest = req.body.signed_request;
  
  if (!signedRequest) {
    return res.status(400).send('Missing signed_request parameter');
  }

  const consumerSecret = process.env.SALESFORCE_CLIENT_SECRET;
  
  if (!consumerSecret) {
    console.error('SALESFORCE_CLIENT_SECRET not configured');
    return res.status(500).send('Canvas not configured');
  }

  // Decode and verify the signed request
  const canvasRequest = decodeSignedRequest(signedRequest, consumerSecret);
  
  if (!canvasRequest) {
    return res.status(401).send('Invalid signed request');
  }

  console.log('Canvas request received:', {
    userId: canvasRequest.context?.user?.userId,
    orgId: canvasRequest.context?.organization?.organizationId,
    environmentContext: canvasRequest.context?.environment?.displayLocation
  });

  // Extract Salesforce context
  const context = canvasRequest.context || {};
  const user = context.user || {};
  const organization = context.organization || {};
  const environment = context.environment || {};
  const links = context.links || {};
  
  // Extract record context (e.g., Opportunity)
  const parameters = environment.parameters || {};
  const recordId = parameters.id || parameters.recordId || '';
  
  // Build URL for calculator with all context
  const calculatorType = parameters.calculatorType || 'bridging';
  const calculatorUrl = `/calculator/${calculatorType}`;
  
  // Render HTML page that loads calculator with Canvas context
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polaris Calculator</title>
  <script src="https://login.salesforce.com/canvas/sdk/js/58.0/canvas-all.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Salesforce Sans', Arial, sans-serif;
    }
    #calculator-container {
      width: 100%;
      height: 100vh;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f4f4f4;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0176d3;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="calculator-container">
    <div class="loading">
      <div class="spinner"></div>
    </div>
  </div>
  
  <script>
    // Store Canvas context globally
    window.SALESFORCE_CANVAS_CONTEXT = ${JSON.stringify({
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName
      },
      organization: {
        organizationId: organization.organizationId,
        name: organization.name,
        namespace: organization.namespace
      },
      environment: {
        displayLocation: environment.displayLocation,
        locationUrl: environment.locationUrl,
        parameters: parameters
      },
      record: {
        id: recordId,
        attributes: parameters
      },
      links: {
        instanceUrl: links.enterpriseUrl || links.partnerUrl || '',
        restUrl: links.restUrl || '',
        sobjectUrl: links.sobjectUrl || ''
      }
    })};
    
    console.log('[CANVAS] Context loaded:', window.SALESFORCE_CANVAS_CONTEXT);
    
    // Load the calculator
    const container = document.getElementById('calculator-container');
    const params = new URLSearchParams({
      sf_opp_id: '${recordId}',
      sf_user_id: '${user.userId || ''}',
      sf_user_name: '${user.fullName || ''}',
      sf_org_id: '${organization.organizationId || ''}',
      embedded: 'canvas'
    });
    
    // Add all environment parameters
    ${JSON.stringify(parameters)}
    
    const iframeUrl = 'https://polaristest-theta.vercel.app${calculatorUrl}?' + params.toString();
    
    container.innerHTML = '<iframe src="' + iframeUrl + '" style="width:100%; height:100%; border:none;"></iframe>';
    
    // Canvas SDK auto-resize
    Sfdc.canvas(function() {
      Sfdc.canvas.client.autogrow(Sfdc.canvas.byId('calculator-container'));
    });
  </script>
</body>
</html>
  `;

  res.send(html);
});

export default router;
