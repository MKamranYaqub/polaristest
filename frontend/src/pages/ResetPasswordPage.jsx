import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token/${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired reset token');
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setUserEmail(data.email || '');
      }
    } catch (err) {
      setError('Failed to validate reset token');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f3f3'
      }}>
        <div className="slds-spinner_container">
          <div className="slds-spinner slds-spinner_medium" role="status">
            <span className="slds-assistive-text">Validating reset token...</span>
            <div className="slds-spinner__dot-a"></div>
            <div className="slds-spinner__dot-b"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f3f3',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          borderRadius: '0.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '300',
            color: '#181818',
            marginBottom: '1rem'
          }}>
            Invalid Reset Link
          </h1>
          <p style={{ color: '#706e6b', marginBottom: '2rem', fontSize: '14px' }}>
            {error || 'This password reset link is invalid or has expired.'}
          </p>
          <Link to="/forgot-password" className="slds-button slds-button_brand" style={{ marginRight: '0.5rem' }}>
            Request New Link
          </Link>
          <Link to="/login" className="slds-button slds-button_neutral">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f3f3',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: '0.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '300',
            color: '#181818',
            marginBottom: '0.5rem'
          }}>
            Set New Password
          </h1>
          {userEmail && (
            <p style={{ color: '#706e6b', fontSize: '14px' }}>
              for {userEmail}
            </p>
          )}
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
              <label className="slds-form-element__label" htmlFor="newPassword">
                <abbr className="slds-required" title="required">* </abbr>
                New Password
              </label>
              <div className="slds-form-element__control">
                <input
                  type="password"
                  id="newPassword"
                  className="slds-input"
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
              <label className="slds-form-element__label" htmlFor="confirmPassword">
                <abbr className="slds-required" title="required">* </abbr>
                Confirm Password
              </label>
              <div className="slds-form-element__control">
                <input
                  type="password"
                  id="confirmPassword"
                  className="slds-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error" style={{ marginBottom: '1rem' }}>
                <span className="slds-assistive-text">Error</span>
                <h2>{error}</h2>
              </div>
            )}

            <button
              type="submit"
              className="slds-button slds-button_brand"
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                style={{
                  color: '#0176d3',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success" style={{ marginBottom: '1.5rem' }}>
              <span className="slds-assistive-text">Success</span>
              <h2>Password Reset Successfully!</h2>
            </div>

            <p style={{ color: '#3e3e3c', marginBottom: '1.5rem', fontSize: '14px', lineHeight: '1.5', textAlign: 'center' }}>
              Your password has been reset. You will be redirected to the login page in a few seconds...
            </p>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                className="slds-button slds-button_brand"
                style={{ width: '100%' }}
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
