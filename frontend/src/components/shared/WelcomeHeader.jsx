import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * WelcomeHeader - Personalized welcome message for pages
 * Displays "Welcome back, [User Name]" based on logged-in user
 */
export default function WelcomeHeader({ className = '' }) {
  const { user } = useAuth();
  
  // Get user's name (prefer full name, fallback to username)
  const userName = user?.name || user?.username || 'User';
  
  return (
    <h1 
      className={className}
      style={{ 
        fontSize: 'var(--token-font-size-sm)', 
        fontWeight: 'var(--token-font-weight-regular)', 
        marginBottom: 'var(--token-spacing-md)',
        color: 'var(--mfs-brand-navy)'
      }}
    >
      Welcome back, <strong style={{ fontWeight: 'var(--token-font-weight-semibold)' }}>{userName}</strong>
    </h1>
  );
}
