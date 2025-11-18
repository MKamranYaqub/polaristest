import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SupabaseProvider } from './contexts/SupabaseContext';

// Suppress known Carbon Design System inert attribute warning
// This is a known issue in @carbon/react that will be fixed in future versions
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Received `false` for a non-boolean attribute `inert`')
  ) {
    return;
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </React.StrictMode>
);