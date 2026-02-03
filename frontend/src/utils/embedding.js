/**
 * Utility functions for detecting and managing embedded mode
 * when the app is rendered inside a Salesforce iframe
 */

/**
 * Check if the app is running inside an iframe
 * @returns {boolean}
 */
export const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin, we're definitely in an iframe
    return true;
  }
};

/**
 * Check if embedded mode is requested via query parameter
 * @returns {boolean}
 */
export const hasEmbeddedParam = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('embedded') === '1' || params.get('embedded') === 'true';
};

/**
 * Determine if the app should run in embedded mode
 * Returns true if EITHER in an iframe OR has embedded query parameter
 * @returns {boolean}
 */
export const isEmbeddedMode = () => {
  return isInIframe() || hasEmbeddedParam();
};

/**
 * Get Salesforce parameters from URL
 * @returns {object} Object containing Salesforce opportunity ID, stage, user info, org ID, and embedded status
 */
export const getSalesforceParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    opportunityId: params.get('sf_opp_id') || null,
    stage: params.get('sf_stage') || null,
    userId: params.get('sf_user_id') || null,
    userName: params.get('sf_user_name') || null,
    orgId: params.get('sf_org_id') || null,
    embedded: params.get('embedded') || (params.get('embedded') === '1' || params.get('embedded') === 'true'),
  };
};

/**
 * Send a message to the parent window (Salesforce host)
 * @param {string} type - Message type
 * @param {object} data - Message payload
 */
export const sendMessageToHost = (type, data = {}) => {
  if (isInIframe()) {
    try {
      window.parent.postMessage(
        {
          source: 'polaris-calculator',
          type,
          data,
          timestamp: Date.now()
        },
        '*' // In production, replace with specific Salesforce origin
      );
    } catch (e) {
      console.error('Failed to send message to host:', e);
    }
  }
};

/**
 * Listen for messages from the parent window
 * @param {function} callback - Handler for incoming messages
 * @returns {function} Cleanup function to remove listener
 */
export const listenToHostMessages = (callback) => {
  const handler = (event) => {
    // In production, validate event.origin matches Salesforce domain
    // if (event.origin !== 'https://your-salesforce-domain.com') return;
    
    callback(event.data);
  };

  window.addEventListener('message', handler);
  
  // Return cleanup function
  return () => window.removeEventListener('message', handler);
};
