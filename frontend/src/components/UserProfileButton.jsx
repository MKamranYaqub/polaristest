import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import ModalShell from './ModalShell';
import '../styles/Modal.css';

/**
 * UserProfileButton - Shows current user and allows profile editing
 * 
 * Features:
 * - Displays user initials/avatar
 * - Dropdown menu with profile info
 * - Edit profile modal
 * - Clear profile option
 */
const UserProfileButton = () => {
  const { user, getUserName, getUserInitials, updateUserProfile, clearUserProfile } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const handleEditClick = () => {
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setError('');
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setError('');

    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    const result = updateUserProfile({
      name: editName.trim(),
      email: editEmail.trim()
    });

    if (result.success) {
      setShowEditModal(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleClearProfile = () => {
    setShowMenu(false);
    setShowClearModal(true);
  };

  const confirmClearProfile = () => {
    clearUserProfile();
    setShowClearModal(false);
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
            backgroundColor: '#0176d3',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
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
                zIndex: 998
              }}
            />
            <div 
              className="slds-dropdown slds-dropdown_right slds-dropdown_medium"
              style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                zIndex: 999,
                minWidth: '280px',
                backgroundColor: 'white',
                border: '1px solid #d8dde6',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 12px 0 rgba(255, 56, 56, 0.16)'
              }}
            >
              {/* Profile Info */}
              <div className="slds-p-around_medium slds-border_bottom">
                <div className="slds-text-heading_small slds-m-bottom_xx-small" style={{ color: '#181818', fontWeight: '600' }}>
                  {user.name}
                </div>
                {user.email && (
                  <div className="slds-text-body_small" style={{ color: '#706e6b' }}>
                    {user.email}
                  </div>
                )}
                
              </div>

              {/* Menu Items */}
              <ul className="slds-dropdown__list" role="menu" style={{ padding: 0, margin: 0 }}>
                <li className="slds-dropdown__item" role="presentation" style={{ listStyle: 'none' }}>
                  <a
                    href="#"
                    className="slds-dropdown__item-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handleEditClick(); }}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      color: '#181818',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ marginRight: '0.5rem', fontSize: '16px' }}>✏️</span>
                    <span>Edit Profile</span>
                  </a>
                </li>
                <li className="slds-dropdown__item" role="presentation" style={{ listStyle: 'none' }}>
                  <a
                    href="#"
                    className="slds-dropdown__item-link"
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); handleClearProfile(); }}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      color: '#181818',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ marginRight: '0.5rem', fontSize: '16px' }}>🗑️</span>
                    <span>Clear Profile</span>
                  </a>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container" style={{ maxWidth: '500px' }}>
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowEditModal(false)}
                >
                  <span className="slds-assistive-text">Close</span>
                  ×
                </button>
                <h2 className="slds-text-heading_medium">Edit Profile</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleSaveEdit}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="editName">
                      <abbr className="slds-required" title="required">* </abbr>
                      Name
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        id="editName"
                        className="slds-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="editEmail">
                      Email (Optional)
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="email"
                        id="editEmail"
                        className="slds-input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium">
                      {error}
                    </div>
                  )}

                  <div className="slds-m-top_medium">
                    <button type="submit" className="slds-button slds-button_brand slds-m-right_small">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowEditModal(false)}
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

      {/* Clear Profile Confirmation Modal */}
      <ModalShell
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Profile"
        maxWidth="500px"
        footer={(
          <>
            <button
              className="slds-button slds-button_neutral"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </button>
            <button
              className="slds-button slds-button_destructive"
              onClick={confirmClearProfile}
            >
              Clear Profile
            </button>
          </>
        )}
      >
        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#3e3e3c' }}>
          Are you sure you want to clear your profile? You will be asked to enter your name again.
        </p>
      </ModalShell>
    </>
  );
};

export default UserProfileButton;
