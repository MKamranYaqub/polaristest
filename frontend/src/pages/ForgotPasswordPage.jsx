import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      setSuccess(true);
      
      // In development, show the reset link
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            Reset Password
          </h1>
          <p style={{ color: '#706e6b', fontSize: '14px' }}>
            Enter your email address and we'll help you reset your password
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="slds-form-element" style={{ marginBottom: '1rem' }}>
              <label className="slds-form-element__label" htmlFor="email">
                Email Address
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
                  autoFocus
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
              {loading ? 'Sending...' : 'Send Reset Link'}
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
              <h2>Reset link generated successfully!</h2>
            </div>

            <p style={{ color: '#3e3e3c', marginBottom: '1.5rem', fontSize: '14px', lineHeight: '1.5' }}>
              If an account exists with the email <strong>{email}</strong>, a password reset link has been generated.
            </p>

            {resetLink && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef8e7',
                border: '1px solid #f4d875',
                borderRadius: '0.25rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#826f00', marginBottom: '0.5rem' }}>
                  🔧 DEVELOPMENT MODE
                </p>
                <p style={{ fontSize: '12px', color: '#3e3e3c', marginBottom: '0.5rem' }}>
                  Use this link to reset your password:
                </p>
                <a
                  href={resetLink}
                  style={{
                    fontSize: '12px',
                    color: '#0176d3',
                    wordBreak: 'break-all',
                    textDecoration: 'underline'
                  }}
                >
                  {resetLink}
                </a>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                className="slds-button slds-button_neutral"
                style={{ width: '100%' }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
