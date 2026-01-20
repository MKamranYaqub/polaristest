import React from 'react';
import { useSalesforceCanvas } from '../../contexts/SalesforceCanvasContext';

/**
 * Debug component to display Salesforce Canvas context values
 * Use this temporarily to inspect what's coming through from Salesforce
 * 
 * Usage: <CanvasDebug /> anywhere in your app
 * 
 * In production, add ?debug=canvas to the URL to show this panel
 */
const CanvasDebug = () => {
  const {
    isCanvasApp,
    loading,
    recordId,
    action,
    canvasParameters,
    user,
    organization,
    environment,
  } = useSalesforceCanvas();

  // Check for debug flag in URL (works in production too)
  const params = new URLSearchParams(window.location.search);
  const debugEnabled = params.get('debug') === 'canvas';

  // In production, only show if debug flag is set
  if (import.meta.env.PROD && !debugEnabled) {
    return null;
  }

  const debugStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'var(--token-layer-surface, #262626)',
    color: 'var(--token-text-primary, #f4f4f4)',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxWidth: '400px',
    maxHeight: '300px',
    overflow: 'auto',
    zIndex: 9999,
    border: '1px solid var(--token-border-subtle, #525252)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  const labelStyle = {
    color: '#78a9ff',
    marginRight: '8px',
  };

  const valueStyle = {
    color: '#42be65',
  };

  const headerStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#be95ff',
    borderBottom: '1px solid #525252',
    paddingBottom: '8px',
  };

  if (loading) {
    return (
      <div style={debugStyle}>
        <div style={headerStyle}>🔄 Canvas Debug</div>
        <p>Loading canvas context...</p>
      </div>
    );
  }

  return (
    <div style={debugStyle}>
      <div style={headerStyle}>🔧 Canvas Debug</div>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>isCanvasApp:</span>
        <span style={{ color: isCanvasApp ? '#42be65' : '#fa4d56' }}>
          {isCanvasApp ? 'true' : 'false'}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>recordId:</span>
        <span style={valueStyle}>{recordId || 'null'}</span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>action:</span>
        <span style={valueStyle}>{action || 'null'}</span>
      </div>

      {user && (
        <div style={{ marginBottom: '8px' }}>
          <span style={labelStyle}>user:</span>
          <span style={valueStyle}>{user.fullName || user.userId}</span>
        </div>
      )}

      {organization && (
        <div style={{ marginBottom: '8px' }}>
          <span style={labelStyle}>org:</span>
          <span style={valueStyle}>{organization.name}</span>
        </div>
      )}

      {Object.keys(canvasParameters).length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>canvasParameters:</div>
          <pre style={{ 
            margin: 0, 
            fontSize: '11px', 
            backgroundColor: '#161616',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
          }}>
            {JSON.stringify(canvasParameters, null, 2)}
          </pre>
        </div>
      )}

      {!isCanvasApp && (
        <div style={{ marginTop: '12px', color: '#f1c21b', fontSize: '11px' }}>
          💡 Not running in Canvas mode. Test with:<br/>
          <code style={{ fontSize: '10px' }}>
            ?signed_request=your_jwt_here
          </code>
        </div>
      )}
    </div>
  );
};

export default CanvasDebug;
