import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SalesforceIcon from './shared/SalesforceIcon';
import ModalShell from './ModalShell';
import '../styles/Modal.css';

/**
 * UserProfileButton - Shows current user from authentication
 * 
 * Features:
 * - Displays user initials/avatar from logged-in user
 * - Dropdown menu with profile info and access level
 * - Change password option
 * - Logout option
 */
const UserProfileButton = () => {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  // Helper functions
  const getUserName = () => user?.name || 'Unknown User';
  
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const parts = user.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAccessLevelLabel = () => {
    const levels = {
      1: 'Admin',
      2: 'UW Team Lead',
      3: 'Head of UW',
      4: 'Underwriter',
      5: 'Product Team'
    };
    return levels[user?.access_level] || 'Unknown';
  };

  const handlePasswordClick = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowMenu(false);
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      setSuccess('Password changed successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* User Avatar Button */}
      <div className="slds-dropdown-trigger slds-dropdown-trigger_click" style={{ position: 'relative' }}>
        <button
          className="slds-button slds-button_icon slds-button_icon-container"
          title={`Logged in as ${getUserName()}`}
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--token-brand-primary)',
            color: 'var(--token-text-inverse)',
            fontSize: 'var(--token-font-size-sm)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {getUserInitials()}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="dropdown-backdrop"
              onClick={() => setShowMenu(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 'var(--token-z-dropdown)'
              }}
            />
            <div 
              className="slds-dropdown slds-dropdown_right slds-dropdown_medium"
              style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                zIndex: 'calc(var(--token-z-dropdown) + 1)',
                minWidth: '280px',
                backgroundColor: 'var(--token-layer-surface)',
                border: '1px solid var(--token-border-subtle)',
                borderRadius: 'var(--token-radius-sm)',
                boxShadow: 'var(--token-shadow-modal)'
              }}
            >
              {/* Profile Info */}
              <div className="slds-p-around_medium slds-border_bottom">
                <div className="slds-text-heading_small slds-m-bottom_xx-small" style={{ color: 'var(--token-text-primary)', fontWeight: '600' }}>
                  {getUserName()}
                </div>
                {user.email && (
                  <div className="slds-text-body_small slds-m-bottom_xx-small" style={{ color: 'var(--token-text-muted)' }}>
                    {user.email}
                  </div>
                )}
                <div className="slds-text-body_small" style={{ color: 'var(--token-text-muted)', fontSize: 'var(--token-font-size-xs)' }}>
                  {getAccessLevelLabel()}
                </div>
              </div>

              {/* Menu Items */}
              <ul className="slds-dropdown__list" role="menu" style={{ padding: 0, margin: 0 }}>
                <li className="slds-dropdown__item" role="presentation" style={{ listStyle: 'none' }}>
                  <a
                    href="#"
                    className="slds-dropdown__item-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); setShowMenu(false); navigate('/settings'); }}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--token-spacing-md) var(--token-spacing-lg)',
                      color: 'var(--token-text-primary)',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ marginRight: 'var(--token-spacing-sm)', fontSize: '16px' }}>⚙️</span>
                    <span>Settings</span>
                  </a>
                </li>
                <li className="slds-dropdown__item" role="presentation" style={{ listStyle: 'none' }}>
                  <a
                    href="#"
                    className="slds-dropdown__item-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handlePasswordClick(); }}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--token-spacing-md) var(--token-spacing-lg)',
                      color: 'var(--token-ui-text-dark)',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ marginRight: 'var(--token-spacing-sm)', fontSize: '16px' }}>🔑</span>
                    <span>Change Password</span>
                  </a>
                </li>
                <li className="slds-dropdown__item" role="presentation" style={{ listStyle: 'none' }}>
                  <a
                    href="#"
                    className="slds-dropdown__item-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--token-spacing-md) var(--token-spacing-lg)',
                      color: 'var(--token-text-primary)',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ marginRight: 'var(--token-spacing-sm)', fontSize: '16px' }}>🚪</span>
                    <span>Logout</span>
                  </a>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container" style={{ maxWidth: '500px' }}>
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowPasswordModal(false)}
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Change Password</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handlePasswordChange}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="currentPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Current Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="currentPassword"
                        className="slds-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="newPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      New Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="newPassword"
                        className="slds-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="confirmPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Confirm New Password
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="confirmPassword"
                        className="slds-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success slds-m-bottom_medium">
                      {success}
                    </div>
                  )}

                  <div className="slds-m-top_medium">
                    <button type="submit" className="slds-button slds-button_brand slds-m-right_small">
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileButton;
