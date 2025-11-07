import React from 'react';
import ModalShell from './ModalShell';

/**
 * NotificationModal - Reusable modal for displaying messages to users
 * Replaces browser alert() with a consistent UI modal
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (default: 'Notification')
 * @param {string} message - Message to display
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info' (default: 'info')
 */
export default function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}) {
  // Determine icon and color based on type
  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: '#04844B', bgColor: '#E8F5E9' };
      case 'error':
        return { icon: '✕', color: '#C23934', bgColor: '#FFEBEE' };
      case 'warning':
        return { icon: '⚠', color: '#F59E0B', bgColor: '#FFF3CD' };
      case 'info':
      default:
        return { icon: 'ℹ', color: '#0176d3', bgColor: '#E3F3FF' };
    }
  };

  const typeStyle = getTypeStyle();
  
  // Default title based on type if not provided
  const defaultTitle = title || (
    type === 'success' ? 'Success' :
    type === 'error' ? 'Error' :
    type === 'warning' ? 'Warning' :
    'Notification'
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={defaultTitle}
      maxWidth="500px"
      footer={(
        <button className="slds-button slds-button_brand" onClick={onClose}>
          OK
        </button>
      )}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '1rem',
        padding: '0.5rem 0'
      }}>
        <div style={{ 
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: typeStyle.bgColor,
          color: typeStyle.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {typeStyle.icon}
        </div>
        <div style={{ 
          flex: 1,
          paddingTop: '0.5rem',
          color: '#333',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </div>
      </div>
    </ModalShell>
  );
}
