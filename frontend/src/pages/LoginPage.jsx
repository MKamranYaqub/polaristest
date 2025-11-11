import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/slds.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect to home/calculator page after successful login
        navigate('/calculator/btl');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slds-p-around_large" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="slds-box slds-theme_default">
        <h1 className="slds-text-heading_large slds-m-bottom_medium" style={{ textAlign: 'center' }}>
          Project Polaris Login
        </h1>
        
        {(error || authError) && (
          <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium" role="alert">
            <span className="slds-assistive-text">Error</span>
            <h2>{error || authError}</h2>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="email">
              <abbr className="slds-required" title="required">*</abbr> Email
            </label>
            <div className="slds-form-element__control">
              <input
                type="email"
                id="email"
                className="slds-input"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="slds-form-element slds-m-bottom_medium">
            <label className="slds-form-element__label" htmlFor="password">
              <abbr className="slds-required" title="required">*</abbr> Password
            </label>
            <div className="slds-form-element__control">
              <input
                type="password"
                id="password"
                className="slds-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>
          </div>

          <div className="slds-m-top_medium">
            <button
              type="submit"
              className="slds-button slds-button_brand"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="slds-m-top_medium" style={{ textAlign: 'center', borderTop: '1px solid #dddbda', paddingTop: '1rem' }}>
          <p className="slds-text-body_small">
            Don't have an account?{' '}
            <Link to="/register" className="slds-text-link">
              Register here
            </Link>
          </p>
        </div>

        <div className="slds-m-top_medium slds-p-around_small" style={{ backgroundColor: '#f3f3f3', borderRadius: '4px' }}>
          <p className="slds-text-body_small" style={{ margin: 0, color: '#706e6b' }}>
            <strong>Demo Credentials:</strong><br />
            Email: admin@polaris.local<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
