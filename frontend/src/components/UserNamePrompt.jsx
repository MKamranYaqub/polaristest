import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import '../styles/Modal.css';

/**
 * UserNamePrompt - One-time prompt to collect user name
 * 
 * Shows on first visit or when user profile is cleared
 * Stores name persistently in localStorage
 * Never asks again unless user clears their profile
 */
const UserNamePrompt = () => {
  const { showNamePrompt, saveUserProfile } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus name input when modal opens
  useEffect(() => {
    if (showNamePrompt) {
      setTimeout(() => {
        document.getElementById('userName')?.focus();
      }, 100);
    }
  }, [showNamePrompt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // saveUserProfile is synchronous in the context, but wrap defensively
      const result = await Promise.resolve(saveUserProfile(name, email));
      if (!result || !result.success) {
        setError((result && result.error) || 'Failed to save profile');
      }
      // On success the context hides the modal (setShowNamePrompt(false)).
      // Still clear submitting state so the UI doesn't get stuck if the modal stays open unexpectedly.
    } catch (err) {
      console.error('UserNamePrompt: saveUserProfile threw', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Save with anonymous name
    saveUserProfile('Anonymous User', '');
  };

  if (!showNamePrompt) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="slds-modal slds-fade-in-open" role="dialog">
        <div className="slds-modal__container" style={{ maxWidth: '500px' }}>
          {/* Header */}
          <header className="slds-modal__header">
            <h2 className="slds-text-heading_medium">Welcome to Polaris</h2>
          </header>

          {/* Body */}
          <div className="slds-modal__content slds-p-around_medium">
            <div className="slds-text-body_regular slds-m-bottom_medium">
              <p className="slds-m-bottom_small">
                To help track your quotes and cases, please tell us your name.
              </p>
              <p className="slds-text-color_weak slds-text-body_small">
                This will be saved locally and used to automatically label all your quotes.
                You only need to do this once.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className="slds-form-element slds-m-bottom_medium">
                <label className="slds-form-element__label" htmlFor="userName">
                  <abbr className="slds-required" title="required">* </abbr>
                  Your Name
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="text"
                    id="userName"
                    className="slds-input"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Email Input (Optional) */}
              <div className="slds-form-element slds-m-bottom_medium">
                <label className="slds-form-element__label" htmlFor="userEmail">
                  Email (Optional)
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="email"
                    id="userEmail"
                    className="slds-input"
                    placeholder="e.g. john.smith@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
              </div>

              {/* Error Message */}
              {error && (
                <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium">
                  <span className="slds-assistive-text">error</span>
                  <span className="slds-icon_container slds-icon-utility-error slds-m-right_x-small">
                    <svg className="slds-icon slds-icon_x-small" aria-hidden="true">
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                    </svg>
                  </span>
                  <h2>{error}</h2>
                </div>
              )}

              {/* Privacy Note */}
              <div className="slds-box slds-theme_shade slds-text-body_small slds-m-bottom_medium">
                <p className="slds-text-color_weak">
                  🔒 Your information is stored locally in your browser only.
                  It will not be shared externally.
                </p>
              </div>

              {/* Buttons */}
              <div className="slds-grid slds-grid_align-spread">
                <button
                  type="submit"
                  className="slds-button slds-button_brand"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNamePrompt;
