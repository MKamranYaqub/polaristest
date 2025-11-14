import { useEffect, useState } from 'react';
import { UI_PREFERENCES, LOCALSTORAGE_CONSTANTS_KEY } from '../config/constants';

/**
 * Custom hook to access UI preferences from localStorage
 * Listens for storage events to update in real-time when Constants are changed
 */
export function useUiPreferences() {
  const [preferences, setPreferences] = useState(UI_PREFERENCES);

  useEffect(() => {
    // Load from localStorage on mount
    const loadPreferences = () => {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
        if (raw) {
          const overrides = JSON.parse(raw);
          if (overrides.uiPreferences) {
            setPreferences(prev => ({ ...prev, ...overrides.uiPreferences }));
          }
        }
      } catch (e) {
        console.warn('Failed to load UI preferences from localStorage:', e);
      }
    };

    loadPreferences();

    // Listen for storage events (changes from Constants component)
    const handleStorageChange = () => {
      loadPreferences();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return preferences;
}
