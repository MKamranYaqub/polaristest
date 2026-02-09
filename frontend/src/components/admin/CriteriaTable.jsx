import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import WelcomeHeader from '../shared/WelcomeHeader';
import SalesforceIcon from "../shared/SalesforceIcon";
import CriteriaEditModal from './CriteriaEditModal';
import NotificationModal from '../modals/NotificationModal';
import '../../styles/slds.css';
import '../../styles/admin-tables.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CriteriaTable() {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    criteriaSets: new Set(),
    productScopes: new Set(),
    questionGroups: new Set(),
  });
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    criteria_set: '',
    product_scope: '',
    question_group: '',
  });
  const [sortField, setSortField] = useState('question_key');
  const [sortDir, setSortDir] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  const { token } = useAuth();

  // Exclude bookkeeping and unique identifier fields from UI and export/import
  const excluded = new Set(['created_at', 'updated_at', 'id']);

  // sanitize a record before sending to the API:
  // - remove id/timestamps
  // - convert empty-string values to null (Postgres integer columns cannot accept "")
  // - coerce numeric-looking values to Number for obvious numeric columns
  const sanitizeRecord = (input) => {
    const rec = { ...input };
    if ('created_at' in rec) delete rec.created_at;
    if ('updated_at' in rec) delete rec.updated_at;
    if ('id' in rec) delete rec.id;

    Object.keys(rec).forEach((k) => {
      let v = rec[k];
      if (v === undefined) { rec[k] = null; return; }
      if (typeof v === 'string') v = v.trim();
      // empty strings -> null
      if (v === '') { rec[k] = null; return; }

      // coerce obvious integers/numbers when the value is a numeric string
      if (typeof v === 'string' && /^-?\d+(?:\.\d+)?$/.test(v)) {
        const n = Number(v);
        if (Number.isFinite(n)) { rec[k] = n; return; }
      }

      // leave other values as-is
      rec[k] = v;
    });

    // Prefer explicit handling for display_order, option_sort_order, and tier (common integer fields)
    if ('display_order' in rec) {
      const dv = rec.display_order;
      if (dv === null || dv === '') rec.display_order = null;
      else {
        const pn = Number(String(dv).replace(/[^0-9-]/g, ''));
        rec.display_order = Number.isFinite(pn) ? pn : null;
      }
    }
    if ('option_sort_order' in rec) {
      const osv = rec.option_sort_order;
      if (osv === null || osv === '') rec.option_sort_order = null;
      else {
        const pn = Number(String(osv).replace(/[^0-9-]/g, ''));
        rec.option_sort_order = Number.isFinite(pn) ? pn : null;
      }
    }
    if ('tier' in rec) {
      const tv = rec.tier;
      if (tv === null || tv === '') rec.tier = null;
      else {
        const pn = Number(String(tv).replace(/[^0-9-]/g, ''));
        rec.tier = Number.isFinite(pn) ? pn : null;
      }
    }

    return rec;
  };

  const fetchCriteria = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch filter options
      const filterResponse = await fetch(`${API_BASE_URL}/api/criteria/filter-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (filterResponse.ok) {
        const filterData = await filterResponse.json();
        setFilterOptions({
          criteriaSets: new Set(filterData.criteriaSets || []),
          productScopes: new Set(filterData.productScopes || []),
          questionGroups: new Set(filterData.questionGroups || []),
        });
      }

      // Build query params for filtered data
      const params = new URLSearchParams();
      if (filters.criteria_set) params.append('criteria_set', filters.criteria_set);
      if (filters.product_scope) params.append('product_scope', filters.product_scope);

      const response = await fetch(`${API_BASE_URL}/api/criteria?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch criteria');
      }

      const data = await response.json();
      
      // Filter by question_group client-side if specified (API may not support it)
      let filteredData = data.criteria || [];
      if (filters.question_group) {
        filteredData = filteredData.filter(c => c.question_group === filters.question_group);
      }

      setCriteria(filteredData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
          const lines = text.split(/\r?\n/);
          const firstLine = lines[0] || '';
          const commaCount = (firstLine.match(/,/g) || []).length;
          const tabCount = (firstLine.match(/\t/g) || []).length;
          const semicolonCount = (firstLine.match(/;/g) || []).length;
          let delim = ',';
          if (tabCount > commaCount && tabCount >= semicolonCount) delim = '\t';
          else if (semicolonCount > commaCount && semicolonCount > tabCount) delim = ';';

          const rows = lines.map(row => row.split(delim));
          const rawHeaders = (rows[0] || []).map(h => (h || '').toString().trim());

          // helper: normalize header text to a safe column name (snake_case, alphanum + _)
          const normalizeHeader = (h) => {
            if (!h) return '';
            // strip BOM if present
            const noBOM = h.replace(/^\uFEFF/, '');
            return noBOM.toString().trim().toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');
          };

          // Map common header variants to expected DB columns
          const mapHeaderToColumn = (h) => {
            const n = normalizeHeader(h);
            if (!n) return '';
            if (n === 'scope') return 'product_scope';
            if (n === 'set' || n === 'set_key' || n === 'setkey') return 'criteria_set';
            if (n === 'question' ) return 'question_label';
            if (n === 'question_label' || n === 'questionlabel') return 'question_label';
            if (n === 'question_key' || n === 'questionkey') return 'question_key';
            if (n === 'option' || n === 'option_label' || n === 'optionlabel') return 'option_label';
            if (n === 'display_order' || n === 'displayorder') return 'display_order';
            if (n === 'option_sort_order' || n === 'optionsortorder' || n === 'sort_order' || n === 'sortorder' || n === 'option_order' || n === 'optionorder') return 'option_sort_order';
            // common DB fields keep their normalized form
            return n;
          };

          const headers = rawHeaders.map(mapHeaderToColumn);

          // Prepare records but don't upsert yet — show preview to the user for confirmation
          const records = rows.slice(1)
            .filter(row => row.some(cell => (cell || '').toString().trim()))
            .map(row => {
              const record = {};
              headers.forEach((headerKey, i) => {
                if (!headerKey) return; // skip blank/missing headers
                record[headerKey] = row[i] !== undefined && row[i] !== null ? row[i].toString().trim() : null;
              });
              // Do not mutate timestamps here; we'll remove them before actual upsert
              return record;
            });

          // compute preview headers (filtered) to avoid showing id/timestamps
          const previewHeaders = headers.filter(h => h && !excluded.has(h));

          // Build a small preview payload (first 5 rows)
          const preview = {
            headers: rawHeaders,
            previewHeaders,
            sampleRows: records.slice(0, 5),
            records
          };
        setImportPreview(preview);
        setShowImportPreview(true);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const [importLoading, setImportLoading] = useState(false);

  const confirmImport = async () => {
    if (!importPreview) return;
    setImportLoading(true);
    try {
      const { records } = importPreview;
      // sanitize records (remove id/timestamps, convert empty strings to null, coerce numeric strings)
      const prepared = records.map(r => sanitizeRecord(r));

      // Use backend API for import
      const response = await fetch(`${API_BASE_URL}/api/criteria/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          records: prepared,
          onConflict: 'criteria_set,product_scope,question_key,option_label'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to import criteria');
      }

      const result = await response.json();
      setNotification({
        show: true,
        type: 'success',
        title: 'Import Complete',
        message: result.message || `Successfully imported ${prepared.length} criteria`
      });

      // refresh - clear preview and reload criteria
      setShowImportPreview(false);
      setImportPreview(null);
      // clear the file input so user can re-select same file
      const fileEl = document.getElementById('criteria-csv-import');
      if (fileEl) fileEl.value = '';
      await fetchCriteria();
    } catch (err) {
      setError(err.message || String(err));
      // keep preview open so user can cancel or inspect
    } finally {
      setImportLoading(false);
    }
  };

  const cancelImport = () => {
    setShowImportPreview(false);
    setImportPreview(null);
    // clear the file input so user can re-select the same file if desired
    const fileEl = document.getElementById('criteria-csv-import');
    if (fileEl) fileEl.value = '';
  };

  const handleExport = () => {
    // Dynamically determine headers from all rows so CSV matches the table view
    const allKeys = new Set();
    for (const r of criteria) Object.keys(r).forEach(k => allKeys.add(k));
    // Prefer a sensible order for common fields, then append remaining keys alphabetically
    const preferred = ['id','display_order','criteria_set','product_scope','question_group','question_key','question_label','option_label','option_sort_order','tier','property_type','helper','info_tip'];
    const keys = [
      ...preferred.filter(k => allKeys.has(k)),
      ...Array.from(allKeys).filter(k => !preferred.includes(k)).sort()
    ];

    const formatCsvValue = (v) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      if (typeof v === 'number') return String(v);
      const s = String(v);
      if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const rows = [keys.join(',')];
    for (const r of criteria) {
      const rowValues = keys.map((h) => formatCsvValue(r[h] ?? ''));
      rows.push(rowValues.join(','));
    }

    const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criteria_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (criteria) => {
    setEditingCriteria(criteria);
  };

  // Save handler: use insert for new records, update for edits.
  const handleSave = async (updatedCriteria, isNew, original) => {
    try {
      const sanitized = sanitizeRecord(updatedCriteria);
      console.log('Saving criteria:', { isNew, sanitized, original });
      
      if (isNew) {
        // Create new criteria
        const response = await fetch(`${API_BASE_URL}/api/criteria`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ criteria: sanitized })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('Create criteria error response:', errData);
          throw new Error(errData.error?.message || errData.message || 'Failed to create criteria');
        }
      } else {
        // Update existing criteria
        if (updatedCriteria.id) {
          // Prefer id-based update when available
          console.log('Updating by ID:', updatedCriteria.id);
          const response = await fetch(`${API_BASE_URL}/api/criteria/${updatedCriteria.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ criteria: sanitized })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Update criteria error response:', errData);
            throw new Error(errData.error?.message || errData.message || 'Failed to update criteria');
          }
        } else {
          // Fallback: update using composite key fields
          const matchKey = original ? {
            criteria_set: original.criteria_set,
            product_scope: original.product_scope,
            question_key: original.question_key,
            option_label: original.option_label
          } : {
            criteria_set: sanitized.criteria_set,
            product_scope: sanitized.product_scope,
            question_key: sanitized.question_key,
            option_label: sanitized.option_label
          };

          console.log('Updating by composite key:', matchKey);
          const response = await fetch(`${API_BASE_URL}/api/criteria/by-key`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ criteria: sanitized, matchKey })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Update by key error response:', errData);
            throw new Error(errData.error?.message || errData.message || 'Failed to update criteria');
          }
        }
      }

      setEditingCriteria(null);
      fetchCriteria();
      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: isNew ? 'Criteria created successfully' : 'Criteria updated successfully'
      });
    } catch (err) {
      console.error('Error saving criteria:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Saving Criteria',
        message: err.message || String(err)
      });
    }
  };

  const handleDelete = async (criteriaItem) => {
    if (window.confirm('Are you sure you want to delete this criteria?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/criteria/by-key`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            criteria_set: criteriaItem.criteria_set,
            product_scope: criteriaItem.product_scope,
            question_key: criteriaItem.question_key,
            option_label: criteriaItem.option_label
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to delete criteria');
        }

        fetchCriteria();
        setSelectedRows(new Set());
        setNotification({
          show: true,
          type: 'success',
          title: 'Success',
          message: 'Criteria deleted successfully'
        });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) {
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one criteria to delete' });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected criteria?`)) {
      try {
        // Get the selected criteria objects
        const selectedCriteria = getCurrentPageCriteria().filter(c => selectedRows.has(getItemKey(c)));
        
        // Bulk delete via API
        const response = await fetch(`${API_BASE_URL}/api/criteria/bulk-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            criteria: selectedCriteria.map(c => ({
              criteria_set: c.criteria_set,
              product_scope: c.product_scope,
              question_key: c.question_key,
              option_label: c.option_label
            }))
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to delete criteria');
        }

        const result = await response.json();
        fetchCriteria();
        setSelectedRows(new Set());
        setSelectAll(false);
        setNotification({
          show: true,
          type: 'success',
          title: 'Success',
          message: result.message || `${selectedCriteria.length} criteria deleted successfully`
        });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getItemKey = (item) => {
    return `${item.criteria_set}-${item.product_scope}-${item.question_key}-${item.option_label}`;
  };

  const handleAdd = () => {
    setEditingCriteria({
      id: null,
      criteria_set: '',
      product_scope: '',
      question_group: '',
      question_key: '',
      question_label: '',
      option_label: '',
      tier: '',
      property_type: '',
      helper: '',
      info_tip: '',
      display_order: '',
      option_sort_order: ''
    });
  };

  const getCurrentPageCriteria = () => {
    // sort criteria client-side
    const sorted = [...criteria];
    if (sortField) {
      const compareValues = (a, b) => {
        if (a === undefined || a === null) return b === undefined || b === null ? 0 : 1;
        if (b === undefined || b === null) return -1;
        const na = Number(String(a).replace(/[^0-9.-]/g, ''));
        const nb = Number(String(b).replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        const sa = String(a).toLowerCase();
        const sb = String(b).toLowerCase();
        if (sa < sb) return -1;
        if (sa > sb) return 1;
        return 0;
      };
      sorted.sort((x, y) => {
        const res = compareValues(x[sortField], y[sortField]);
        return sortDir === 'asc' ? res : -res;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const changeSort = (field) => {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const totalPages = Math.ceil(criteria.length / itemsPerPage);

  // Build dynamic columns list from data, preferring a sensible order for common fields.
  // Exclude DB bookkeeping timestamps (created_at/updated_at) from UI and CSV.
  const allKeysSet = new Set();
  for (const r of criteria) Object.keys(r).forEach(k => allKeysSet.add(k));
  const preferred = ['display_order','criteria_set','product_scope','question_group','question_key','question_label','option_label','option_sort_order','tier','property_type','helper','info_tip'];
  // (excluded is declared earlier) — bookkeeping and unique identifier fields are ignored
  const columns = [
    ...preferred.filter(k => allKeysSet.has(k) && !excluded.has(k)),
    ...Array.from(allKeysSet).filter(k => !preferred.includes(k) && !excluded.has(k)).sort()
  ];

  // Friendly labels for columns (display only). Keep keys unchanged for sorting/upsert logic.
  const columnLabels = {
    display_order: 'Display Order',
    criteria_set: 'Criteria Set',
    product_scope: 'Product Scope',
    question_group: 'Question Group',
    question_key: 'Question Key',
    question_label: 'Question Label',
    option_label: 'Option Label',
    option_sort_order: 'Sort Order',
    tier: 'Tier',
    property_type: 'Property Type',
    helper: 'Helper',
    info_tip: 'Info Tip'
  };

  const humanize = (s) => {
    if (!s) return '';
    return s.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading criteria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-box">
          <h3>Error Loading Criteria</h3>
          <p>{error}</p>
          <button className="slds-button slds-button_brand" onClick={fetchCriteria}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-container--table">
      <div className="table-header-stacked">
        <div className="table-title-row">
          <WelcomeHeader />
          <div className="table-actions-row">
            <button className="slds-button slds-button_brand" onClick={handleAdd}>
              Add New Criteria
            </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="criteria-csv-import"
          />
          <button className="slds-button slds-button_neutral" 
            onClick={() => document.getElementById('criteria-csv-import').click()}>
            Import CSV
          </button>
          <button className="slds-button slds-button_neutral" onClick={handleExport}>
            Export CSV
          </button>
          {selectedRows.size > 0 && (
            <button className="slds-button slds-button_destructive" onClick={handleBulkDelete}>
              Delete Selected ({selectedRows.size})
            </button>
          )}
            <span className="total-count">Total: {criteria.length}</span>
          </div>
        </div>
      </div>

      {showImportPreview && importPreview && (
        <>
          <div className="slds-backdrop slds-backdrop_open" />
          <div className="slds-modal slds-fade-in-open">
            <div className="slds-modal__container">
              <div className="slds-modal__header">
                <button
                  className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                  onClick={cancelImport}
                  title="Close"
                >
                  <SalesforceIcon category="utility" name="close" size="x-small" className="slds-button__icon slds-button__icon_inverse" />
                  <span className="slds-assistive-text">Close</span>
                </button>
                <h2 className="slds-text-heading_medium">Import Preview</h2>
              </div>
              <div className="slds-modal__content slds-p-around_medium">
                <div className="slds-m-bottom_small">
                  <strong>Headers (raw):</strong> {importPreview.headers.join(', ')}
                </div>
                <div className="slds-m-bottom_small">
                  <strong>Headers (will be imported):</strong> {importPreview.previewHeaders.join(', ')}
                </div>
                <div className="slds-m-bottom_small">
                  <div className="slds-text-color_weak">Note: <code>created_at</code>, <code>updated_at</code> and <code>id</code> will be ignored. <code>display_order</code> will be coerced to an integer or set to null if empty/invalid.</div>
                </div>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table className="professional-table">
                    <thead>
                      <tr>
                        {importPreview.previewHeaders.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleRows.map((row, ri) => (
                        <tr key={ri}>
                          {importPreview.previewHeaders.map((h, hi) => (
                            <td key={hi}>{row[h] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="slds-modal__footer">
                <button className="slds-button slds-button_neutral" onClick={cancelImport} disabled={importLoading}>Cancel</button>
                <button className="slds-button slds-button_brand" onClick={confirmImport} disabled={importLoading}>{importLoading ? 'Importing...' : 'Import'}</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="filters-section">
        <div className="filter-field">
          <label>Criteria Set</label>
          <select
            value={filters.criteria_set}
            onChange={(e) => handleFilterChange('criteria_set', e.target.value)}
          >
            <option value="">All Sets</option>
            {Array.from(filterOptions.criteriaSets).sort().map(set => (
              <option key={set} value={set}>{set}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Product Scope</label>
          <select
            value={filters.product_scope}
            onChange={(e) => handleFilterChange('product_scope', e.target.value)}
          >
            <option value="">All Scopes</option>
            {Array.from(filterOptions.productScopes).sort().map(scope => (
              <option key={scope} value={scope}>{scope}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label style={{ visibility: 'hidden' }}>Actions</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="slds-button slds-button_neutral" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
            </button>
            {(filters.criteria_set || filters.product_scope || filters.question_group) && (
              <button 
                className="slds-button slds-button_text-destructive" 
                onClick={() => setFilters({ criteria_set: '', product_scope: '', question_group: '' })}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="filters-section filters-advanced">
          <div className="filter-field">
            <label>Question Group</label>
            <select
              value={filters.question_group}
              onChange={(e) => handleFilterChange('question_group', e.target.value)}
            >
              <option value="">All Groups</option>
              {Array.from(filterOptions.questionGroups).sort().map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="professional-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    const currentPageItems = getCurrentPageCriteria();
                    if (checked) {
                      setSelectedRows(new Set(currentPageItems.map(getItemKey)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </th>
              {columns.map((col) => (
                <th 
                  key={col} 
                  onClick={() => changeSort(col)} 
                  className={`sortable ${sortField === col ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                >
                  {columnLabels[col] || humanize(col)}
                </th>
              ))}
              <th className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageCriteria().map((item) => {
              const itemKey = getItemKey(item);
              return (
                <tr key={itemKey}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(itemKey)}
                      onChange={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(itemKey)) {
                          newSelected.delete(itemKey);
                        } else {
                          newSelected.add(itemKey);
                        }
                        setSelectedRows(newSelected);
                        setSelectAll(
                          getCurrentPageCriteria().every(c => 
                            newSelected.has(getItemKey(c))
                          )
                        );
                      }}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col}>{(item[col] === null || item[col] === undefined) ? '' : String(item[col])}</td>
                  ))}
                  <td className="sticky-action">
                    <div className="row-actions">
                      <button
                        className="slds-button slds-button_neutral"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="slds-button slds-button_destructive"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <div className="pagination-controls">
          <button
            className="slds-button slds-button_neutral"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button
            className="slds-button slds-button_neutral"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <div className="rows-per-page">
            <label>Rows:</label>
            <select value={itemsPerPage} onChange={(e) => { const v = Number(e.target.value); setItemsPerPage(v); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {editingCriteria && (
        <CriteriaEditModal
          criteria={editingCriteria}
          onSave={handleSave}
          onCancel={() => setEditingCriteria(null)}
          isNew={!editingCriteria.criteria_set}
        />
      )}
      
      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}

export default CriteriaTable;