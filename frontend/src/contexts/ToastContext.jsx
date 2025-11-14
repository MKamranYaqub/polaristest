import React, { createContext, useContext, useState } from 'react';
import { ToastNotification } from '@carbon/react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ kind = 'success', title, subtitle, timeout = 5000 }) => {
    const id = Date.now();
    const toast = { id, kind, title, subtitle, timeout };
    
    setToasts(prev => [...prev, toast]);
    
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - Fixed position at top-right */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px'
      }}>
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            kind={toast.kind}
            title={toast.title}
            subtitle={toast.subtitle}
            timeout={toast.timeout}
            onClose={() => removeToast(toast.id)}
            style={{ minWidth: '300px' }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
