/**
 * Salesforce Integration Routes
 * Handles OAuth flow, webhooks, and API communication with Salesforce
 */

import express from 'express';
import salesforceService from '../services/salesforceService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/salesforce/auth
 * Initiates OAuth flow - redirects user to Salesforce login
 */
router.get('/auth', (req, res) => {
  try {
    const authUrl = salesforceService.getAuthorizationUrl();
    logger.info('Initiating Salesforce OAuth flow');
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating Salesforce auth:', error);
    res.status(500).json({ 
      error: 'Failed to initiate Salesforce authentication',
      message: error.message 
    });
  }
});

/**
 * GET /api/salesforce/callback
 * OAuth callback - exchanges code for access token
 */
router.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    logger.error('Salesforce OAuth error:', error, error_description);
    return res.status(400).json({ 
      error: 'OAuth failed', 
      message: error_description || error 
    });
  }

  if (!code) {
    return res.status(400).json({ 
      error: 'Missing authorization code' 
    });
  }

  try {
    const tokenData = await salesforceService.exchangeCodeForToken(code);
    logger.info('Successfully authenticated with Salesforce');
    
    // For now, return success JSON (later redirect to frontend admin page)
    res.json({
      success: true,
      message: 'Successfully connected to Salesforce',
      instanceUrl: tokenData.instance_url,
      connectedAt: tokenData.connected_at
    });
  } catch (error) {
    logger.error('Error exchanging code for token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Salesforce',
      message: error.message
    });
  }
});

/**
 * GET /api/salesforce/connection-status
 * Check if Salesforce is connected and token is valid
 */
router.get('/connection-status', async (req, res) => {
  try {
    const isConnected = await salesforceService.isConnected();
    const tokenInfo = salesforceService.getTokenInfo();
    
    res.json({
      connected: isConnected,
      instanceUrl: tokenInfo?.instance_url || null,
      connectedAt: tokenInfo?.connected_at || null,
      expiresAt: tokenInfo?.expires_at || null
    });
  } catch (error) {
    logger.error('Error checking connection status:', error);
    res.status(500).json({ 
      error: 'Failed to check connection status',
      message: error.message 
    });
  }
});

/**
 * POST /api/salesforce/disconnect
 * Revoke Salesforce access token and clear stored credentials
 */
router.post('/disconnect', async (req, res) => {
  try {
    await salesforceService.disconnect();
    logger.info('Disconnected from Salesforce');
    res.json({ success: true, message: 'Disconnected from Salesforce' });
  } catch (error) {
    logger.error('Error disconnecting from Salesforce:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect',
      message: error.message 
    });
  }
});

/**
 * POST /api/salesforce/webhook
 * Receive webhook data from Salesforce
 * This endpoint will be called by Salesforce when events occur
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    logger.info('Received Salesforce webhook:', req.body);
    
    // TODO: Validate webhook signature/authentication
    // TODO: Process webhook data based on event type
    
    const { event_type, opportunity_id, data } = req.body;
    
    // Acknowledge receipt immediately
    res.json({ 
      success: true, 
      message: 'Webhook received',
      timestamp: new Date().toISOString()
    });
    
    // Process webhook asynchronously
    // This will be implemented when we add stage tracking
    
  } catch (error) {
    logger.error('Error processing Salesforce webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message 
    });
  }
});

/**
 * GET /api/salesforce/test-connection
 * Test Salesforce connection by making a simple API call
 */
router.get('/test-connection', async (req, res) => {
  try {
    const result = await salesforceService.testConnection();
    res.json({
      success: true,
      message: 'Successfully connected to Salesforce',
      userInfo: result
    });
  } catch (error) {
    logger.error('Connection test failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Connection test failed',
      message: error.message 
    });
  }
});

/**
 * POST /api/salesforce/create-opportunity
 * Create a test opportunity in Salesforce
 * Used for testing the integration
 */
router.post('/create-opportunity', express.json(), async (req, res) => {
  try {
    const { name, stageName, amount } = req.body;
    
    if (!name || !stageName) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, stageName' 
      });
    }
    
    const opportunity = await salesforceService.createOpportunity({
      Name: name,
      StageName: stageName,
      Amount: amount || 0,
      CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    });
    
    logger.info('Created Salesforce opportunity:', opportunity.id);
    res.json({
      success: true,
      opportunityId: opportunity.id,
      message: 'Opportunity created successfully'
    });
  } catch (error) {
    logger.error('Error creating opportunity:', error);
    res.status(500).json({ 
      error: 'Failed to create opportunity',
      message: error.message 
    });
  }
});

export default router;
