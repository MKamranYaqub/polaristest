import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import ModalShell from '../components/ModalShell';
import '../styles/Modal.css';

const UsersPage = () => {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', access_level: 4 });
  
  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess('User created successfully');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', name: '', access_level: 4 });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingUser.name,
          access_level: editingUser.access_level,
          is_active: editingUser.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successfully');
      setShowResetModal(false);
      setResetUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const getAccessLevelLabel = (level) => {
    const levels = {
      1: 'Admin',
      2: 'UW Team Lead',
      3: 'Head of UW',
      4: 'Underwriter',
      5: 'Product Team'
    };
    return levels[level] || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="slds-spinner_container" style={{ position: 'fixed', height: '100%' }}>
        <div className="slds-spinner slds-spinner_medium" role="status">
          <span className="slds-assistive-text">Loading</span>
          <div className="slds-spinner__dot-a"></div>
          <div className="slds-spinner__dot-b"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="slds-p-around_large">
      <div className="slds-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="slds-grid slds-grid_vertical-align-center">
          <div className="slds-col slds-has-flexi-truncate">
            <h3 className="slds-text-heading_large">User Management</h3>
            <p className="slds-text-body_small slds-m-top_xx-small" style={{ color: '#706e6b' }}>
              Manage user accounts, access levels, and permissions
            </p>
          </div>
          <div className="slds-col slds-no-flex slds-grid slds-grid_align-end">
            <button
              className="slds-button slds-button_brand"
              onClick={() => setShowCreateModal(true)}
            >
              <span style={{ marginRight: '0.5rem' }}>➕</span>
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium">
          <span className="slds-assistive-text">Error</span>
          <h2>{error}</h2>
          <button className="slds-button slds-button_icon slds-notify__close" onClick={() => setError('')}>
            <span className="slds-assistive-text">Close</span>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success slds-m-bottom_medium">
          <span className="slds-assistive-text">Success</span>
          <h2>{success}</h2>
          <button className="slds-button slds-button_icon slds-notify__close" onClick={() => setSuccess('')}>
            <span className="slds-assistive-text">Close</span>
            ×
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="slds-card">
        <div className="slds-card__body slds-card__body_inner">
          <table className="slds-table slds-table_cell-buffer slds-table_bordered">
            <thead>
              <tr className="slds-line-height_reset">
                <th scope="col" style={{ width: '25%' }}>
                  <div className="slds-truncate" title="Name">Name</div>
                </th>
                <th scope="col" style={{ width: '20%' }}>
                  <div className="slds-truncate" title="Email">Email</div>
                </th>
                <th scope="col" style={{ width: '15%' }}>
                  <div className="slds-truncate" title="Access Level">Access Level</div>
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  <div className="slds-truncate" title="Status">Status</div>
                </th>
                <th scope="col" style={{ width: '15%' }}>
                  <div className="slds-truncate" title="Last Login">Last Login</div>
                </th>
                <th scope="col" style={{ width: '15%' }}>
                  <div className="slds-truncate" title="Actions">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="slds-hint-parent">
                  <td>
                    <div className="slds-truncate" title={user.name}>{user.name}</div>
                  </td>
                  <td>
                    <div className="slds-truncate" title={user.email}>{user.email}</div>
                  </td>
                  <td>
                    <span className={`slds-badge ${user.access_level === 1 ? 'slds-theme_success' : ''}`}>
                      {getAccessLevelLabel(user.access_level)}
                    </span>
                  </td>
                  <td>
                    <span className={`slds-badge ${user.is_active ? 'slds-theme_success' : 'slds-theme_error'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="slds-truncate" title={formatDate(user.last_login)}>
                      {formatDate(user.last_login)}
                    </div>
                  </td>
                  <td>
                    <div className="slds-button-group" role="group">
                      <button
                        className="slds-button slds-button_icon slds-button_icon-border-filled"
                        title="Edit"
                        onClick={() => {
                          setEditingUser({ ...user });
                          setShowEditModal(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="slds-button slds-button_icon slds-button_icon-border-filled"
                        title="Reset Password"
                        onClick={() => {
                          setResetUserId(user.id);
                          setShowResetModal(true);
                        }}
                      >
                        🔑
                      </button>
                      <button
                        className="slds-button slds-button_icon slds-button_icon-border-filled"
                        title="Delete"
                        onClick={() => {
                          setDeleteUserId(user.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="slds-text-align_center slds-p-vertical_large" style={{ color: '#706e6b' }}>
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container" style={{ maxWidth: '600px' }}>
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowCreateModal(false)}
                >
                  <span className="slds-assistive-text">Close</span>
                  ×
                </button>
                <h2 className="slds-text-heading_medium">Create New User</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleCreateUser}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createName">
                      <abbr className="slds-required" title="required">* </abbr>
                      Name
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        id="createName"
                        className="slds-input"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createEmail">
                      <abbr className="slds-required" title="required">* </abbr>
                      Email
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="email"
                        id="createEmail"
                        className="slds-input"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      Password (min 8 characters)
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="createPassword"
                        className="slds-input"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="createAccessLevel">
                      <abbr className="slds-required" title="required">* </abbr>
                      Access Level
                    </label>
                    <div className="slds-form-element__control">
                      <select
                        id="createAccessLevel"
                        className="slds-select"
                        value={newUser.access_level}
                        onChange={(e) => setNewUser({ ...newUser, access_level: parseInt(e.target.value) })}
                        required
                      >
                        <option value={1}>1 - Admin</option>
                        <option value={2}>2 - UW Team Lead</option>
                        <option value={3}>3 - Head of UW</option>
                        <option value={4}>4 - Underwriter</option>
                        <option value={5}>5 - Product Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="slds-m-top_large">
                    <button type="submit" className="slds-button slds-button_brand slds-m-right_small">
                      Create User
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowCreateModal(false)}
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container" style={{ maxWidth: '600px' }}>
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowEditModal(false)}
                >
                  <span className="slds-assistive-text">Close</span>
                  ×
                </button>
                <h2 className="slds-text-heading_medium">Edit User</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleUpdateUser}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label">Email</label>
                    <div className="slds-form-element__control">
                      <input
                        type="text"
                        className="slds-input"
                        value={editingUser.email}
                        disabled
                        style={{ backgroundColor: '#f3f3f3' }}
                      />
                    </div>
                  </div>

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
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="editAccessLevel">
                      <abbr className="slds-required" title="required">* </abbr>
                      Access Level
                    </label>
                    <div className="slds-form-element__control">
                      <select
                        id="editAccessLevel"
                        className="slds-select"
                        value={editingUser.access_level}
                        onChange={(e) => setEditingUser({ ...editingUser, access_level: parseInt(e.target.value) })}
                        required
                      >
                        <option value={1}>1 - Admin</option>
                        <option value={2}>2 - UW Team Lead</option>
                        <option value={3}>3 - Head of UW</option>
                        <option value={4}>4 - Underwriter</option>
                        <option value={5}>5 - Product Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-checkbox" htmlFor="editIsActive">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={editingUser.is_active}
                        onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      />
                      <span className="slds-checkbox_faux"></span>
                      <span className="slds-form-element__label">Active</span>
                    </label>
                  </div>

                  <div className="slds-m-top_large">
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

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="slds-modal slds-fade-in-open" role="dialog">
            <div className="slds-modal__container" style={{ maxWidth: '500px' }}>
              <header className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={() => setShowResetModal(false)}
                >
                  <span className="slds-assistive-text">Close</span>
                  ×
                </button>
                <h2 className="slds-text-heading_medium">Reset User Password</h2>
              </header>

              <div className="slds-modal__content slds-p-around_medium">
                <form onSubmit={handleResetPassword}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="resetPassword">
                      <abbr className="slds-required" title="required">* </abbr>
                      New Password (min 8 characters)
                    </label>
                    <div className="slds-form-element__control">
                      <input
                        type="password"
                        id="resetPassword"
                        className="slds-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div className="slds-m-top_large">
                    <button type="submit" className="slds-button slds-button_brand slds-m-right_small">
                      Reset Password
                    </button>
                    <button
                      type="button"
                      className="slds-button slds-button_neutral"
                      onClick={() => setShowResetModal(false)}
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

      {/* Delete Confirmation Modal */}
      <ModalShell
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        maxWidth="500px"
        footer={(
          <>
            <button
              className="slds-button slds-button_neutral"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="slds-button slds-button_destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </button>
          </>
        )}
      >
        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#3e3e3c' }}>
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </ModalShell>
    </div>
  );
};

export default UsersPage;
