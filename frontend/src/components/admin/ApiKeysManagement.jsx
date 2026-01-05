import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE_URL } from '../../config/api';
import WelcomeHeader from '../shared/WelcomeHeader';

/**
 * API Keys Management Component
 * Admin-only component for managing Power BI / Data Team API keys
 * 
 * Features:
 * - Create new API keys
 * - List all API keys with usage info
 * - Revoke/activate keys
 * - Delete keys permanently
 * - Copy API key to clipboard (only shown once during creation)
 */

function MaskedKey({ value }) {
  const [show, setShow] = useState(false);
  return (
    <div className="slds-grid slds-grid_vertical-align-center">
      <span className="slds-truncate" style={{ maxWidth: '28rem', fontFamily: 'monospace' }}>
        {show ? value : '••••••••••••••••••••••••••••••••'}
      </span>
      <div className="slds-button_group slds-m-left_x-small" role="group">
        <button 
          className="slds-button slds-button_neutral" 
          onClick={() => setShow(s => !s)}
          type="button"
        >
          {show ? 'Hide' : 'Reveal'}
        </button>
        <button 
          className="slds-button slds-button_neutral" 
          onClick={() => {
            navigator.clipboard.writeText(value);
          }}
          type="button"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
MaskedKey.propTypes = { value: PropTypes.string.isRequired };

function StatusBadge({ isActive }) {
  return (
    <span className={`slds-badge ${isActive ? 'slds-theme_success' : 'slds-theme_error'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
StatusBadge.propTypes = { isActive: PropTypes.bool.isRequired };

function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ApiKeysManagement() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [form, setForm] = useState({
    name: '',
    expiresInDays: 365,
    notes: ''
  });
  const [createdKey, setCreatedKey] = useState(null); // Store newly created key to show once

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load API keys');
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err.message);
      showToast({ kind: 'error', title: 'Load failed', subtitle: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast({ kind: 'error', title: 'Validation Error', subtitle: 'API key name is required' });
      return;
    }

    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/api-keys`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: form.name.trim(),
          permissions: ['read:reports'],
          expiresInDays: parseInt(form.expiresInDays) || null,
          notes: form.notes.trim() || null
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create API key');
      
      // Store the newly created key to display
      setCreatedKey({
        apiKey: data.apiKey,
        name: data.keyInfo.name,
        expiresAt: data.keyInfo.expiresAt
      });

      showToast({ 
        kind: 'success', 
        title: 'API Key Created', 
        subtitle: 'Save the key now - it cannot be retrieved later!' 
      });
      
      // Reset form
      setForm({ name: '', expiresInDays: 365, notes: '' });
      
      // Refresh list
      fetchApiKeys();
    } catch (err) {
      showToast({ kind: 'error', title: 'Create failed', subtitle: err.message });
      setError(err.message);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!confirm(`Revoke API key "${name}"? This will immediately stop all access.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/api-keys/${id}/revoke`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke API key');
      
      showToast({ kind: 'success', title: 'API Key Revoked' });
      fetchApiKeys();
    } catch (err) {
      showToast({ kind: 'error', title: 'Revoke failed', subtitle: err.message });
    }
  };

  const handleActivate = async (id, name) => {
    if (!confirm(`Reactivate API key "${name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/api-keys/${id}/activate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate API key');
      
      showToast({ kind: 'success', title: 'API Key Activated' });
      fetchApiKeys();
    } catch (err) {
      showToast({ kind: 'error', title: 'Activate failed', subtitle: err.message });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete API key "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete API key');
      
      showToast({ kind: 'warning', title: 'API Key Deleted' });
      fetchApiKeys();
    } catch (err) {
      showToast({ kind: 'error', title: 'Delete failed', subtitle: err.message });
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="slds-spinner_container">
          <div role="status" className="slds-spinner slds-spinner_medium">
            <span className="slds-assistive-text">Loading API Keys...</span>
            <div className="slds-spinner__dot-a"></div>
            <div className="slds-spinner__dot-b"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <WelcomeHeader />

      {error && (
        <div className="slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error slds-m-bottom_medium" role="alert">
          <span className="slds-assistive-text">Error</span>
          <h2>{error}</h2>
        </div>
      )}

      {/* Show newly created key (only once) */}
      {createdKey && (
        <div className="slds-notify slds-notify_alert slds-theme_success slds-m-bottom_medium" role="alert">
          <span className="slds-assistive-text">Success</span>
          <div className="slds-m-bottom_small">
            <h2 className="slds-text-heading_small slds-m-bottom_x-small">
              ✅ API Key Created: {createdKey.name}
            </h2>
            <p className="slds-text-body_small slds-m-bottom_small">
              <strong>⚠️ IMPORTANT:</strong> Copy this key now. It cannot be retrieved later!
            </p>
            <MaskedKey value={createdKey.apiKey} />
            {createdKey.expiresAt && (
              <p className="slds-text-body_small slds-m-top_small">
                Expires: {formatDate(createdKey.expiresAt)}
              </p>
            )}
          </div>
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => setCreatedKey(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create New API Key Form */}
      <div className="slds-box slds-m-bottom_medium">
        <h2 className="slds-text-heading_small slds-m-bottom_medium">Create New API Key</h2>
        <form onSubmit={handleCreate}>
          <div className="slds-grid slds-wrap" style={{ gap: 'var(--token-form-field-gap)' }}>
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="key-name">
                  <abbr className="slds-required" title="required">*</abbr> Name
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="text"
                    id="key-name"
                    className="slds-input"
                    placeholder="e.g., Power BI - Data Team"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="slds-form-element__help">Descriptive name for this API key</div>
              </div>
            </div>

            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="key-expires">
                  Expires In (Days)
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="text"
                    id="key-expires"
                    className="slds-input"
                    placeholder="365"
                    value={form.expiresInDays}
                    onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
                  />
                </div>
                <div className="slds-form-element__help">Leave empty for no expiration</div>
              </div>
            </div>

            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="key-notes">
                  Notes
                </label>
                <div className="slds-form-element__control">
                  <input
                    type="text"
                    id="key-notes"
                    className="slds-input"
                    placeholder="Optional notes about this API key..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div className="slds-form-element__help">&nbsp;</div>
              </div>
            </div>

            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
              <div className="slds-form-element">
                <label className="slds-form-element__label" htmlFor="key-submit">
                  &nbsp;
                </label>
                <div className="slds-form-element__control">
                  <button type="submit" className="slds-button slds-button_brand" style={{ width: '100%' }}>
                    Create API Key
                  </button>
                </div>
                <div className="slds-form-element__help">&nbsp;</div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* API Keys List */}
      <div className="slds-box">
        <h2 className="slds-text-heading_small slds-m-bottom_medium">
          Existing API Keys ({apiKeys.length})
        </h2>

        {apiKeys.length === 0 ? (
          <div className="slds-text-align_center slds-p-vertical_large">
            <p className="slds-text-body_regular slds-text-color_weak">
              No API keys created yet. Create one above to get started.
            </p>
          </div>
        ) : (
          <div className="slds-table_container">
            <table className="slds-table slds-table_cell-buffer slds-table_bordered">
              <thead>
                <tr className="slds-line-height_reset">
                  <th scope="col">
                    <div className="slds-truncate" title="Name">Name</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Status">Status</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Created">Created</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Expires">Expires</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Last Used">Last Used</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Notes">Notes</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Actions">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className="slds-hint-parent">
                    <td data-label="Name">
                      <div className="slds-truncate" title={key.name}>
                        <strong>{key.name}</strong>
                      </div>
                    </td>
                    <td data-label="Status">
                      <StatusBadge isActive={key.is_active} />
                    </td>
                    <td data-label="Created">
                      <div className="slds-truncate" title={formatDate(key.created_at)}>
                        {formatDate(key.created_at)}
                      </div>
                    </td>
                    <td data-label="Expires">
                      <div className="slds-truncate" title={formatDate(key.expires_at)}>
                        {formatDate(key.expires_at)}
                      </div>
                    </td>
                    <td data-label="Last Used">
                      <div className="slds-truncate" title={formatDate(key.last_used_at)}>
                        {formatDate(key.last_used_at)}
                      </div>
                    </td>
                    <td data-label="Notes">
                      <div className="slds-truncate" title={key.notes || '—'}>
                        {key.notes || '—'}
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="slds-button-group" role="group">
                        {key.is_active ? (
                          <button
                            className="slds-button slds-button_neutral slds-button_small"
                            onClick={() => handleRevoke(key.id, key.name)}
                            title="Revoke this API key"
                            type="button"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            className="slds-button slds-button_success slds-button_small"
                            onClick={() => handleActivate(key.id, key.name)}
                            title="Activate this API key"
                            type="button"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          className="slds-button slds-button_destructive slds-button_small"
                          onClick={() => handleDelete(key.id, key.name)}
                          title="Permanently delete this API key"
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="slds-box slds-theme_shade slds-m-top_medium">
        <h3 className="slds-text-heading_small slds-m-bottom_small">📘 Usage Instructions</h3>
        <ul className="slds-list_dotted">
          <li>
            <strong>Power BI Connection:</strong> Use the API key in the <code>X-API-Key</code> header when connecting to <code>/api/reporting/*</code> endpoints
          </li>
          <li>
            <strong>Rate Limits:</strong> Each API key is limited to 100 requests per hour
          </li>
          <li>
            <strong>Security:</strong> API keys are hashed and cannot be retrieved after creation. Store them securely!
          </li>
          <li>
            <strong>Rotation:</strong> Regularly rotate keys (quarterly recommended). Create new key, update systems, then revoke old key.
          </li>
        </ul>
      </div>
    </div>
  );
}
