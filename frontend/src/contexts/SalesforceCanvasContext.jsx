import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SalesforceCanvasContext = createContext();

export const useSalesforceCanvas = () => {
  const context = useContext(SalesforceCanvasContext);
  if (!context) {
    throw new Error('useSalesforceCanvas must be used within SalesforceCanvasProvider');
  }
  return context;
};

/**
 * SalesforceCanvasProvider
 * 
 * Manages Salesforce Canvas SDK integration
 * Provides context, signed request, and client info to child components
 */
export const SalesforceCanvasProvider = ({ children }) => {
  const [canvasContext, setCanvasContext] = useState(null);
  const [signedRequest, setSignedRequest] = useState(null);
  const [isCanvasApp, setIsCanvasApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Check if Sfdc.canvas SDK is available
    if (typeof window.Sfdc === 'undefined' || !window.Sfdc.canvas) {
      console.log('Not running as Canvas app');
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

    console.log('Canvas Context:', sr.context);
    setSignedRequest(sr);
    setCanvasContext(sr.context);
    setClient(sr.client);
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
