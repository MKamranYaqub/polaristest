/**
 * Salesforce Service
 * Handles OAuth authentication and API calls to Salesforce
 */

import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class SalesforceService {
  constructor() {
    this.clientId = process.env.SALESFORCE_CLIENT_ID;
    this.clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    this.callbackUrl = process.env.SALESFORCE_CALLBACK_URL || 'http://localhost:3001/api/salesforce/callback';
    this.loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    
    // In-memory token storage (replace with database in production)
    this.tokenData = null;
    
    // PKCE storage
    this.codeVerifier = null;
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE() {
    // Generate code_verifier (43-128 characters)
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code_challenge from verifier using SHA256
    const codeChallenge = crypto
      .createHash('sha256')
      .update(this.codeVerifier)
      .digest('base64url');
    
    return {
      codeVerifier: this.codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Generate Salesforce OAuth authorization URL
   */
  getAuthorizationUrl() {
    if (!this.clientId) {
      throw new Error('SALESFORCE_CLIENT_ID not configured');
    }

    // Generate PKCE challenge
    const { codeChallenge, codeChallengeMethod } = this.generatePKCE();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'api refresh_token offline_access',
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    });

    return `${this.loginUrl}/services/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Salesforce credentials not configured');
    }

    if (!this.codeVerifier) {
      throw new Error('PKCE code_verifier not found. Authorization flow must be restarted.');
    }

    try {
      const response = await axios.post(
        `${this.loginUrl}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.callbackUrl,
          code_verifier: this.codeVerifier
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.tokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        instance_url: response.data.instance_url,
        id: response.data.id,
        token_type: response.data.token_type,
        issued_at: response.data.issued_at,
        signature: response.data.signature,
        connected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      };

      logger.info('Successfully obtained Salesforce access token');
      // TODO: Store tokenData in database for persistence
      
      // Clear code verifier after successful exchange
      this.codeVerifier = null;
      
      return this.tokenData;
    } catch (error) {
      logger.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_description || 'Failed to obtain access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.tokenData?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${this.loginUrl}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokenData.refresh_token,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.tokenData.access_token = response.data.access_token;
      this.tokenData.issued_at = response.data.issued_at;
      this.tokenData.expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      logger.info('Successfully refreshed Salesforce access token');
      return this.tokenData;
    } catch (error) {
      logger.error('Error refreshing token:', error.response?.data || error.message);
      this.tokenData = null; // Clear invalid token
      throw new Error('Failed to refresh access token - please reconnect');
    }
  }

  /**
   * Get current token info
   */
  getTokenInfo() {
    if (!this.tokenData) return null;
    
    return {
      instance_url: this.tokenData.instance_url,
      connected_at: this.tokenData.connected_at,
      expires_at: this.tokenData.expires_at
    };
  }

  /**
   * Check if connected to Salesforce
   */
  async isConnected() {
    if (!this.tokenData?.access_token) {
      return false;
    }

    // Check if token is expired
    const expiresAt = new Date(this.tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      try {
        await this.refreshAccessToken();
        return true;
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  /**
   * Disconnect from Salesforce
   */
  async disconnect() {
    if (this.tokenData?.access_token) {
      try {
        // Revoke the token
        await axios.post(
          `${this.loginUrl}/services/oauth2/revoke`,
          new URLSearchParams({
            token: this.tokenData.access_token
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
      } catch (error) {
        logger.warn('Error revoking token:', error.message);
        // Continue anyway to clear local token
      }
    }

    this.tokenData = null;
    logger.info('Cleared Salesforce connection');
  }

  /**
   * Make authenticated API call to Salesforce
   */
  async makeApiCall(method, endpoint, data = null) {
    if (!await this.isConnected()) {
      throw new Error('Not connected to Salesforce');
    }

    try {
      const config = {
        method: method,
        url: `${this.tokenData.instance_url}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('Salesforce API call failed:', error.response?.data || error.message);
      
      // If token expired, try to refresh and retry once
      if (error.response?.status === 401) {
        try {
          await this.refreshAccessToken();
          // Retry the request
          const config = {
            method: method,
            url: `${this.tokenData.instance_url}${endpoint}`,
            headers: {
              'Authorization': `Bearer ${this.tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          };
          if (data) config.data = data;
          
          const response = await axios(config);
          return response.data;
        } catch (retryError) {
          throw new Error('Authentication failed - please reconnect to Salesforce');
        }
      }

      throw new Error(error.response?.data?.[0]?.message || error.message);
    }
  }

  /**
   * Test connection by getting user info
   */
  async testConnection() {
    const userInfo = await this.makeApiCall('GET', '/services/oauth2/userinfo');
    return {
      userId: userInfo.user_id,
      organizationId: userInfo.organization_id,
      username: userInfo.preferred_username,
      email: userInfo.email,
      name: userInfo.name
    };
  }

  /**
   * Create an Opportunity in Salesforce
   */
  async createOpportunity(opportunityData) {
    const result = await this.makeApiCall(
      'POST',
      '/services/data/v60.0/sobjects/Opportunity',
      opportunityData
    );
    return result;
  }

  /**
   * Get Opportunity by ID
   */
  async getOpportunity(opportunityId) {
    const result = await this.makeApiCall(
      'GET',
      `/services/data/v60.0/sobjects/Opportunity/${opportunityId}`
    );
    return result;
  }

  /**
   * Update Opportunity in Salesforce
   */
  async updateOpportunity(opportunityId, updates) {
    await this.makeApiCall(
      'PATCH',
      `/services/data/v60.0/sobjects/Opportunity/${opportunityId}`,
      updates
    );
    return { success: true };
  }

  /**
   * Query Salesforce using SOQL
   */
  async query(soql) {
    const result = await this.makeApiCall(
      'GET',
      `/services/data/v60.0/query?q=${encodeURIComponent(soql)}`
    );
    return result;
  }
}

// Export singleton instance
const salesforceServiceInstance = new SalesforceService();
export default salesforceServiceInstance;
