import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access level definitions
  const ACCESS_LEVELS = {
    ADMIN: 1,
    UW_TEAM_LEAD: 2,
    HEAD_OF_UW: 3,
    UNDERWRITER: 4,
    PRODUCT_TEAM: 5,
  };

  // Permission checks
  const hasPermission = (requiredLevel) => {
    if (!user || !user.access_level) return false;
    // Lower number = higher permission (1 = Admin is highest)
    return user.access_level <= requiredLevel;
  };

  const canEditCalculators = () => {
    // Levels 1, 2, 3 can edit calculators
    return user && user.access_level >= 1 && user.access_level <= 3;
  };

  const canAccessAdmin = () => {
    // Levels 1-5 except 4 (Underwriter) can access admin pages
    return user && user.access_level !== 4;
  };

  const canEditRatesAndCriteria = () => {
    // Levels 1-5 except 4 (Underwriter) can edit rates/constants/criteria
    return user && user.access_level !== 4;
  };

  const isUnderwriter = () => {
    return user && user.access_level === 4;
  };

  const isAdmin = () => {
    return user && user.access_level === 1;
  };

  // Fetch current user info
  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
      setError(null);
      return data.user;
    } catch (err) {
      console.error('Fetch user error:', err);
      setError(err.message);
      logout();
      return null;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password change failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        await fetchUser(token);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    changePassword,
    fetchUser,
    hasPermission,
    canEditCalculators,
    canAccessAdmin,
    canEditRatesAndCriteria,
    isUnderwriter,
    isAdmin,
    ACCESS_LEVELS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
