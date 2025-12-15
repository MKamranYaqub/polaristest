import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

function MaskedValue({ value }) {
  const [show, setShow] = useState(false);
  return (
    <div className="slds-grid slds-grid_vertical-align-center">
      <span className="slds-truncate" style={{ maxWidth: '28rem' }}>
        {show ? value : '••••••••••••••••••••'}
      </span>
      <div className="slds-button_group slds-m-left_x-small" role="group">
        <button className="slds-button slds-button_neutral" onClick={() => setShow(s => !s)}>
          {show ? 'Hide' : 'Reveal'}
        </button>
        <button className="slds-button slds-button_neutral" onClick={() => navigator.clipboard.writeText(value)}>
          Copy
        </button>
      </div>
    </div>
  );
}
MaskedValue.propTypes = { value: PropTypes.string.isRequired };

export default function DataAccessVariables() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [variables, setVariables] = useState([]);
  const [form, setForm] = useState({ name: '', key: '', value: '', description: '', scope: 'general' });

  // Route-level protection ensures admin access; avoid double-blocking here

  const fetchVars = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data-access/variables', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load variables');
      setVariables(data.variables || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVars(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/data-access/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create variable');
      showToast({ kind: 'success', title: 'Variable created' });
      setForm({ name: '', key: '', value: '', description: '', scope: 'general' });
      fetchVars();
    } catch (err) {
      showToast({ kind: 'error', title: 'Create failed', subtitle: err.message });
      setError(err.message);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const res = await fetch(`/api/admin/data-access/variables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update variable');
      showToast({ kind: 'success', title: 'Variable updated' });
      fetchVars();
    } catch (err) {
      showToast({ kind: 'error', title: 'Update failed', subtitle: err.message });
      setError(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const res = await fetch(`/api/admin/data-access/variables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate');
      showToast({ kind: 'success', title: 'Variable deactivated' });
      fetchVars();
    } catch (err) {
      showToast({ kind: 'error', title: 'Deactivate failed', subtitle: err.message });
      setError(err.message);
    }
  };

  if (loading) return <div className="slds-p-around_medium">Loading variables…</div>;
  if (error) return <div className="slds-p-around_medium slds-text-color_error">{error}</div>;

  return (
    <div className="page-container">
      <h1 className="slds-text-heading_medium">Data Access Variables</h1>
      <p className="slds-text-body_regular slds-m-bottom_medium">Create and manage integration variables (e.g., API base URLs, client IDs, team tokens) for the Data team.</p>

      <form className="slds-grid slds-wrap slds-gutters slds-m-bottom_large" onSubmit={handleCreate}>
        <div className="slds-col slds-size_1-of-2 slds-large-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="var-name">Name</label>
            <div className="slds-form-element__control">
              <input id="var-name" className="slds-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2 slds-large-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="var-key">Key</label>
            <div className="slds-form-element__control">
              <input id="var-key" className="slds-input" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} required />
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2 slds-large-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="var-value">Value</label>
            <div className="slds-form-element__control">
              <input id="var-value" className="slds-input" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2 slds-large-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="var-scope">Scope</label>
            <div className="slds-form-element__control">
              <select id="var-scope" className="slds-select" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}>
                <option value="general">General</option>
                <option value="powerbi">Power BI</option>
                <option value="datascience">Data Science</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="var-desc">Description</label>
            <div className="slds-form-element__control">
              <input id="var-desc" className="slds-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-1 slds-large-size_1-of-4 slds-text-align_right">
          <div className="slds-m-top_medium">
            <button className="slds-button slds-button_brand" type="submit">Create</button>
          </div>
        </div>
      </form>

      <table className="slds-table slds-table_cell-buffer slds-table_bordered slds-table_fixed-layout">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Value</th>
            <th>Scope</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {variables.map(v => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td><code>{v.key}</code></td>
              <td><MaskedValue value={v.value} /></td>
              <td>{v.scope}</td>
              <td>{v.description || '—'}</td>
              <td>{v.is_active ? 'Active' : 'Inactive'}</td>
              <td>{new Date(v.created_at).toLocaleString()}</td>
              <td>
                <div className="slds-button_group" role="group">
                  <button className="slds-button slds-button_neutral" onClick={() => handleUpdate(v.id, { is_active: !v.is_active })}>
                    {v.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="slds-button slds-button_destructive" onClick={() => handleDeactivate(v.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="slds-m-top_large">
        <h2 className="slds-text-heading_small">Power BI Example</h2>
        <p className="slds-text-body_regular">Use these variables (e.g., `API_BASE_URL`, `DATA_TEAM_TOKEN`) in Power BI to fetch CSV exports:</p>
        <pre className="slds-code-block slds-m-top_small">
{`let
  baseUrl = "https://your.api" /* API_BASE_URL */,
  token = "<DATA_TEAM_TOKEN>",
  dataUrl = baseUrl & "/api/export/quotes.csv?from=2025-12-01&to=2025-12-31&calculator_type=BTL",
  csvResponse = Web.Contents(dataUrl, [ Headers = [ Authorization = "Bearer " & token, Accept = "text/csv; charset=utf-8" ] ] ),
  csv = Csv.Document(csvResponse, [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
  promoted = Table.PromoteHeaders(csv, [PromoteAllScalars = true])
in
  promoted`}
        </pre>
      </div>
    </div>
  );
}
