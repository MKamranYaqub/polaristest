import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';

const SalesforceCanvasContext = createContext();

export const useSalesforceCanvas = () => {
  const context = useContext(SalesforceCanvasContext);
  if (!context) {
    throw new Error('useSalesforceCanvas must be used within SalesforceCanvasProvider');
  }
  return context;
};

/**
 * Decode a signed_request JWT from URL parameters
 * Used when Canvas SDK isn't available but signed_request is passed via URL
 */
const decodeSignedRequestFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const signedRequest = params.get('signed_request');
    
    if (!signedRequest) {
      return null;
    }

    // The signed_request is a JWT - decode the payload (second part after the dot)
    // JWT format: header.payload.signature
    const parts = signedRequest.split('.');
    if (parts.length < 2) {
      console.warn('Invalid signed_request format');
      return null;
    }

    // Decode the JWT payload
    const decoded = jwtDecode(signedRequest);
    
    return {
      decoded,
      context: decoded?.context || null,
      parameters: decoded?.context?.environment?.parameters || {},
    };
  } catch (error) {
    console.error('Failed to decode signed_request from URL:', error);
    return null;
  }
};

/**
 * SalesforceCanvasProvider
 * 
 * Manages Salesforce Canvas SDK integration
 * Supports two modes:
 * 1. SDK Mode: Uses window.Sfdc.canvas when SDK is loaded
 * 2. JWT Mode: Decodes signed_request from URL parameters
 * 
 * Provides context, signed request, and client info to child components
 */
export const SalesforceCanvasProvider = ({ children }) => {
  const [canvasContext, setCanvasContext] = useState(null);
  const [signedRequest, setSignedRequest] = useState(null);
  const [isCanvasApp, setIsCanvasApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  // Canvas parameters extracted from signed_request (recordId, action, etc.)
  const [canvasParameters, setCanvasParameters] = useState({});
  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);

  useEffect(() => {
    // First, try to decode signed_request from URL (JWT approach)
    const urlSignedRequest = decodeSignedRequestFromUrl();
    
    if (urlSignedRequest) {
      // We have a signed_request in the URL - use JWT mode
      setIsCanvasApp(true);
      setCanvasContext(urlSignedRequest.context);
      setCanvasParameters(urlSignedRequest.parameters);
      setRecordId(urlSignedRequest.parameters?.recordId || null);
      setAction(urlSignedRequest.parameters?.action || null);
      setSignedRequest(urlSignedRequest.decoded);
      setLoading(false);
      return;
    }

    // Check if Sfdc.canvas SDK is available
    if (typeof window.Sfdc === 'undefined' || !window.Sfdc.canvas) {
      // Not running as Canvas app - this is normal for standalone mode
      setLoading(false);
      return;
    }

    setIsCanvasApp(true);

    // Get signed request from parent
    const sr = window.Sfdc.canvas.client.signedrequest();
    
    if (sr) {
      // Signed request already available (from page load)
      handleSignedRequest(sr);
    } else {
      // Request fresh signed request from Salesforce
      window.Sfdc.canvas.client.refreshSignedRequest((signedRequestData) => {
        handleSignedRequest(signedRequestData);
      });
    }

    // Setup auto-resize
    const clientInfo = getClientInfo();
    if (clientInfo) {
      window.Sfdc.canvas.client.autogrow(clientInfo);
    }
  }, []);

  const handleSignedRequest = (sr) => {
    if (!sr || !sr.context) {
      console.error('Invalid signed request received');
      setLoading(false);
      return;
    }

    // Canvas context loaded successfully
    setSignedRequest(sr);
    setCanvasContext(sr.context);
    setClient(sr.client);
    
    // Extract canvas parameters from environment
    const params = sr.context?.environment?.parameters || {};
    setCanvasParameters(params);
    setRecordId(params?.recordId || null);
    setAction(params?.action || null);
    
    setLoading(false);
  };

  const getClientInfo = () => {
    if (typeof window.Sfdc === 'undefined' || !window.Sfdc.canvas) {
      return null;
    }
    return window.Sfdc.canvas.oauth.client();
  };

  const refreshContext = (callback) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.ctx(
      (contextData) => {
        setCanvasContext(contextData.payload);
        if (callback) callback(contextData.payload);
      },
      clientInfo
    );
  };

  const resize = (size) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.resize(clientInfo, size);
  };

  const publish = (eventName, payload) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.publish(clientInfo, {
      name: eventName,
      payload: payload
    });
  };

  const subscribe = (eventName, callback) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.subscribe(clientInfo, {
      name: eventName,
      onData: callback
    });
  };

  const ajaxRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!isCanvasApp) {
        reject(new Error('Not running as Canvas app'));
        return;
      }

      const clientInfo = getClientInfo();
      const settings = {
        client: clientInfo,
        method: options.method || 'GET',
        contentType: options.contentType || 'application/json',
        data: options.data,
        success: (data) => {
          resolve(data.payload);
        },
        error: (error) => {
          reject(error);
        }
      };

      window.Sfdc.canvas.client.ajax(url, settings);
    });
  };

  const value = {
    isCanvasApp,
    loading,
    canvasContext,
    signedRequest,
    client,
    // Canvas parameters (from environment.parameters)
    canvasParameters,
    recordId,
    action,
    // User info from Canvas context
    user: canvasContext?.user,
    organization: canvasContext?.organization,
    environment: canvasContext?.environment,
    // Links and URLs
    links: canvasContext?.links,
    // Methods
    refreshContext,
    resize,
    publish,
    subscribe,
    ajaxRequest,
  };

  return (
    <SalesforceCanvasContext.Provider value={value}>
      {children}
    </SalesforceCanvasContext.Provider>
  );
};

SalesforceCanvasProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SalesforceCanvasContext;
