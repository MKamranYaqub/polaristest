import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './CanvasLoader.scss';

/**
 * Canvas Loader Component
 * Receives Salesforce Canvas context and redirects to appropriate calculator
 */
function CanvasLoader() {
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Canvas context is available
    if (window.SALESFORCE_CANVAS_CONTEXT) {
      const ctx = window.SALESFORCE_CANVAS_CONTEXT;
      setContext(ctx);

      console.log('[CANVAS] Context received:', ctx);

      // Extract parameters
      const recordId = ctx.record?.id || '';
      const userId = ctx.user?.userId || '';
      const userName = ctx.user?.fullName || '';
      const orgId = ctx.organization?.organizationId || '';
      const calculatorType = ctx.environment?.parameters?.calculatorType || 'bridging';

      // Build query parameters
      const params = new URLSearchParams({
        sf_opp_id: recordId,
        sf_user_id: userId,
        sf_user_name: userName,
        sf_org_id: orgId,
        embedded: 'canvas',
      });

      // Add all environment parameters
      if (ctx.environment?.parameters) {
        Object.entries(ctx.environment.parameters).forEach(([key, value]) => {
          if (key !== 'calculatorType' && value) {
            params.append(`sf_${key}`, value);
          }
        });
      }

      // Navigate to calculator
      const path = `/calculator/${calculatorType}?${params.toString()}`;
      console.log('[CANVAS] Navigating to:', path);
      
      setTimeout(() => {
        navigate(path, { replace: true });
      }, 500);

    } else {
      // No Canvas context - show error
      setError('Canvas context not found. This page must be loaded from Salesforce Canvas.');
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="canvas-loader error">
        <div className="error-icon">⚠️</div>
        <h2>Canvas Error</h2>
        <p>{error}</p>
        <p className="help-text">
          Please ensure this app is embedded in Salesforce as a Canvas app.
        </p>
      </div>
    );
  }

  return (
    <div className="canvas-loader">
      <div className="spinner"></div>
      <h2>Loading Salesforce Context...</h2>
      {context && (
        <div className="context-info">
          <p>Organization: {context.organization?.name}</p>
          <p>User: {context.user?.fullName}</p>
          <p>Record ID: {context.record?.id}</p>
        </div>
      )}
    </div>
  );
}

export default CanvasLoader;
