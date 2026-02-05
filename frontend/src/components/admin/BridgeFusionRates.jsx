import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import WelcomeHeader from '../shared/WelcomeHeader';
import BridgeRateEditModal from './BridgeRateEditModal';
import NotificationModal from '../modals/NotificationModal';
import { getRateLifecycleStatus } from '../../utils/calculator/rateFiltering';
import '../../styles/slds.css';
import '../../styles/admin-tables.css';

function BridgeFusionRates() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('set_key');
  const [sortDir, setSortDir] = useState('asc');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    set_key: '',
    property: '',
    product: '',
    type: '',
    charge_type: '',
    rate_status: 'Active' // Default to showing Active rates only
  });
  const [filterOptions, setFilterOptions] = useState({ properties: new Set(), products: new Set(), setKeys: new Set(), types: new Set(), chargeTypes: new Set(), rateStatuses: new Set(['Active', 'Inactive']) });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });

  const fetch = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({ table: 'bridging' });
      if (filters.rate_status && filters.rate_status !== 'all') {
        params.append('rate_status', filters.rate_status);
      }
      
      const response = await window.fetch(`${API_BASE_URL}/api/rates?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }
      
      const { rates } = await response.json();
      const rowsData = rates || [];
      setRows(rowsData);

      // derive filter options from the returned rows dynamically (tolerant to schema differences)
      setFilterOptions({
        properties: new Set(rowsData.map(r => r.property).filter(Boolean)),
        products: new Set(rowsData.map(r => r.product).filter(Boolean)),
        setKeys: new Set(rowsData.map(r => r.set_key).filter(Boolean)),
        types: new Set(rowsData.map(r => r.type).filter(Boolean)),
        chargeTypes: new Set(rowsData.map(r => r.charge_type).filter(Boolean)),
        rateStatuses: new Set(['Active', 'Inactive'])
      });
    } catch (e) {
      setError(e.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [token, filters.rate_status]);
  
  // Reset to page 1 when filters change
  useEffect(() => { 
    setCurrentPage(1); 
  }, [filters]);

  const handleAdd = () => {
    // default values depending on product type
    const defaults = {
      id: null,
      set_key: '',
      property: 'Bridge',
  type: 'Fixed',
  product_fee: 2,
  charge_type: '',
    tier: '',
      product: '',
      rate: null,
      // Bridge defaults
      min_term: 3,
      max_term: 18,
      min_rolled_months: 3,
      max_rolled_months: 18,
      // common defaults
      min_loan: null,
      max_loan: null,
      min_ltv: null,
      max_ltv: null,
      min_icr: null,
      max_defer_int: null,
    };
    setEditing(defaults);
  };

  const changeSort = (field) => {
    if (sortField === field) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleSave = async (rec) => {
    try {
      // Validate date range if both dates are provided
      if (rec.start_date && rec.end_date) {
        if (new Date(rec.start_date) > new Date(rec.end_date)) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Validation Error',
            message: 'Start date must be before end date'
          });
          return;
        }
      }

      // Ensure rate_status has a default
      if (!rec.rate_status) rec.rate_status = 'Active';

      const tableName = 'bridge_fusion_rates_full';
      
      if (rec.id) {
        // Update existing rate
        const response = await window.fetch(`${API_BASE_URL}/api/rates/${rec.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rate: rec, tableName })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to update rate');
        }
      } else {
        // Create new rate
        const response = await window.fetch(`${API_BASE_URL}/api/rates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rate: rec, tableName })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create rate');
        }
      }
      setEditing(null);
      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: 'Rate saved successfully'
      });
      await fetch();
    } catch (e) {
      setError(e.message || e);
    }
  };

  // Bulk status update handler
  const handleBulkStatusUpdate = async (newStatus) => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Warning',
        message: 'Please select at least one rate to update'
      });
      return;
    }

    const confirmMessage = `Are you sure you want to set ${selectedIds.length} rate(s) to ${newStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await window.fetch(`${API_BASE}/api/rates/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ids: selectedIds,
          status: newStatus,
          tableName: 'bridge_fusion_rates_full'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update rates');
      }

      const result = await response.json();
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Success',
        message: result.message || `${selectedIds.length} rate(s) updated to ${newStatus}`
      });
      
      setSelectedRows(new Set());
      setSelectAll(false);
      await fetch();
    } catch (err) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update rates'
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rate?')) return;
    try {
      const response = await window.fetch(`${API_BASE_URL}/api/rates/${id}?tableName=bridge_fusion_rates_full`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete rate');
      }
      await fetch();
    } catch (e) {
      setError(e.message || e);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedRows);
    if (ids.length === 0) { 
      setNotification({ show: true, type: 'warning', title: 'Warning', message: 'Please select at least one rate to delete' }); 
      return; 
    }
    if (!window.confirm(`Delete ${ids.length} selected rates?`)) return;
    try {
      const response = await window.fetch(`${API_BASE_URL}/api/rates/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids, tableName: 'bridge_fusion_rates_full' })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete rates');
      }
      setSelectedRows(new Set());
      setSelectAll(false);
      await fetch();
    } catch (e) {
      setError(e.message || e);
    }
  };

  const toggleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const ids = getCurrentPageRows().map(r => r.id);
      setSelectedRows(new Set(ids));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleSelectRow = (id) => {
    const copy = new Set(selectedRows);
    if (copy.has(id)) copy.delete(id); else copy.add(id);
    setSelectedRows(copy);
    setSelectAll(getCurrentPageRows().every(r => copy.has(r.id)));
  };

  const getCurrentPageRows = () => {
    // Apply filters first
    let filtered = rows.filter(r => {
      if (filters.set_key && r.set_key !== filters.set_key) return false;
      if (filters.property && r.property !== filters.property) return false;
      if (filters.product && r.product !== filters.product) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.charge_type && r.charge_type !== filters.charge_type) return false;
      // Note: rate_status filter is applied at query level, not here
      return true;
    });
    
    // Then sort
    if (sortField) {
      const compare = (a, b) => {
        const va = a[sortField];
        const vb = b[sortField];
        if (va === undefined || va === null) return vb === undefined || vb === null ? 0 : 1;
        if (vb === undefined || vb === null) return -1;
        const na = Number(String(va).replace(/[^0-9.-]/g, ''));
        const nb = Number(String(vb).replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return -1; if (sa > sb) return 1; return 0;
      };
      filtered.sort((x, y) => (sortDir === 'asc' ? compare(x, y) : -compare(x, y)));
    }
    
    // Finally paginate
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  };

  // Update totalPages to use filtered count
  const getFilteredRowsCount = () => {
    return rows.filter(r => {
      if (filters.set_key && r.set_key !== filters.set_key) return false;
      if (filters.property && r.property !== filters.property) return false;
      if (filters.product && r.product !== filters.product) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.charge_type && r.charge_type !== filters.charge_type) return false;
      return true;
    }).length;
  };

  const totalPages = Math.max(1, Math.ceil(getFilteredRowsCount() / itemsPerPage));

  // Import/Export support (copied/adjusted from RatesTable)
  const parseCsv = (text) => {
    const rows = [];
    let cur = '';
    let row = [];
    let i = 0;
    let inQuotes = false;
    while (i < text.length) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') { cur += '"'; i += 2; continue; }
        inQuotes = !inQuotes; i++; continue;
      }
      if (!inQuotes && ch === ',') { row.push(cur); cur = ''; i++; continue; }
      if (!inQuotes && (ch === '\n' || (ch === '\r' && text[i + 1] === '\n'))) {
        row.push(cur); rows.push(row.map(c => (c === undefined ? '' : c))); cur = ''; row = []; if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++; continue;
      }
      cur += ch; i++;
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row.map(c => (c === undefined ? '' : c))); }
    return rows;
  };

  const handleImport = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCsv(text);
        if (!parsed || parsed.length < 1) { setError('CSV appears empty'); return; }
        const rawHeaders = parsed[0].map(h => (h || '').toString().trim());
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_'));
        const dataRows = parsed.slice(1).filter(r => r.some(cell => (cell || '').toString().trim() !== ''));
        const toNumeric = s => { if (s === null || s === undefined || s === '') return null; const n = Number(String(s).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : null; };
        const toBoolean = s => { if (s === null || s === undefined || s === '') return null; const v = String(s).toLowerCase().trim(); if (['yes','true','1'].includes(v)) return true; if (['no','false','0'].includes(v)) return false; return null; };

        const records = dataRows.map(row => {
          const obj = {};
          for (let i = 0; i < headers.length; i++) {
            const raw = row[i] === undefined ? '' : row[i];
            const key = headers[i];
            if (!key) continue;
            if (['rate','product_fee','min_loan','max_loan','min_ltv','max_ltv','min_icr','max_defer_int','min_term','max_term','min_rolled_months','max_rolled_months','erc_1','erc_2'].includes(key)) {
              obj[key] = toNumeric(raw);
            } else if (['is_retention','is_tracker'].includes(key)) {
              obj[key] = toBoolean(raw);
            } else {
              obj[key] = raw === undefined ? null : raw.toString().trim();
            }
          }
          
          // Auto-set ERC values for Fusion products if not already set
          if (obj.set_key === 'Fusion' || (obj.set_key && obj.set_key.toLowerCase().includes('fusion'))) {
            if (obj.erc_1 === null || obj.erc_1 === undefined) obj.erc_1 = 3;
            if (obj.erc_2 === null || obj.erc_2 === undefined) obj.erc_2 = 1.5;
          }
          
          return obj;
        }).filter(r => r.set_key || r.setkey || r.set_key === 0);

        const mapped = records.map(r => {
          if (r.scope && !r.property) { r.property = r.scope; delete r.scope; }
          if (!r.set_key && r.setkey) { r.set_key = r.setkey; delete r.setkey; }
          return r;
        });

        if (!mapped || mapped.length === 0) { setError('No valid records found in CSV. Ensure each row includes set_key etc.'); const fileEl = document.getElementById('bridge-csv-import'); if (fileEl) fileEl.value = ''; return; }

        // Remove any DB-managed fields (id, timestamps) before insert
        const cleanedRecords = mapped.map(r => {
          const rec = { ...r };
          if ('created_at' in rec) delete rec.created_at;
          if ('updated_at' in rec) delete rec.updated_at;
          if ('id' in rec) delete rec.id;
          // Remove 'status' column - only 'rate_status' exists in DB
          if ('status' in rec) delete rec.status;

          // Convert date strings to PostgreSQL format (YYYY-MM-DD)
          // Handle DD/MM/YYYY, MM/DD/YYYY, or empty values
          const convertDate = (dateStr) => {
            if (!dateStr || dateStr === '' || dateStr === undefined) return null;
            const str = String(dateStr).trim();
            if (!str) return null;
            // Already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            // DD/MM/YYYY format (UK) - convert to YYYY-MM-DD
            const ukMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (ukMatch) {
              const [, day, month, year] = ukMatch;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return null; // Invalid format
          };
          rec.start_date = convertDate(rec.start_date);
          rec.end_date = convertDate(rec.end_date);

          // ensure type and product_fee exist with defaults
          if (!rec.type) rec.type = 'Fixed';
          if (rec.product_fee === null || rec.product_fee === undefined) rec.product_fee = 2;

          return rec;
        });

        // Upsert via API
        const onConflictCols = 'set_key,property,product,type,charge_type,product_fee,min_ltv,max_ltv,start_date';
        const response = await window.fetch(`${API_BASE_URL}/api/rates/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            records: cleanedRecords,
            tableName: 'bridge_fusion_rates_full',
            onConflict: onConflictCols
          })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          setError(errData.message || 'Failed to import rates');
          return;
        }

        // Refresh table after import
        setSelectedRows(new Set()); setSelectAll(false);
        await fetch();
      } catch (err) { setError(err.message || String(err)); }
    };
    reader.readAsText(file, 'utf-8');
  };

  const formatCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    const s = String(value);
    if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const formatExportField = (header, r) => {
    if (!r) return '';
    switch (header) {
      case 'rate': return formatCsvValue(r.rate !== null && r.rate !== undefined ? `${r.rate}` : '');
      case 'min_loan': case 'max_loan': return r[header] ? formatCsvValue(`£${Number(r[header]).toLocaleString()}`) : '';
      default: return formatCsvValue(r[header]);
    }
  };

  const handleExport = () => {
  const headers = ['set_key','property','product','type','charge_type','product_fee','min_ltv','max_ltv','rate','min_term','max_term','min_rolled_months','max_rolled_months','min_loan','max_loan','min_icr','max_defer_int','erc_1','erc_2','rate_status','start_date','end_date'];
    const headerRow = headers.map(h => formatCsvValue(h)).join(',');
    const dataRows = rows.map(r => headers.map(h => formatExportField(h, r)).join(','));
    const csv = [headerRow, ...dataRows].join('\r\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; const date = new Date().toISOString().split('T')[0]; a.download = `bridge_fusion_rates_full_${date}.csv`; a.click(); window.URL.revokeObjectURL(url);
  };

  if (loading) return (<div className="loading-overlay"><div className="loading-spinner"></div><div className="loading-text">Loading bridge & fusion rates...</div></div>);
  if (error) return (<div className="error-state"><div className="error-box"><h3>Error Loading Rates</h3><p>{String(error)}</p><button className="slds-button slds-button_brand" onClick={() => fetch()}>Try Again</button></div></div>);

  return (
    <div className="admin-table-container">
      <div className="table-header-stacked">
        <div className="table-title-row">
          <WelcomeHeader />
          <div className="table-actions-row">
            <button className="slds-button slds-button_brand" onClick={handleAdd}>Add Bridge/Fusion Rate</button>
          <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} id="bridge-csv-import" />
          <button className="slds-button slds-button_neutral" onClick={() => document.getElementById('bridge-csv-import').click()}>Import CSV</button>
          <button className="slds-button slds-button_neutral" onClick={handleExport}>Export CSV</button>
          {selectedRows.size > 0 && (
            <button className="slds-button slds-button_destructive" onClick={handleBulkDelete}>Delete Selected ({selectedRows.size})</button>
          )}
          {selectedRows.size > 0 && (
            <>
              <button 
                className="slds-button slds-button_success" 
                onClick={() => handleBulkStatusUpdate('Active')}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? 'Updating...' : `Activate (${selectedRows.size})`}
              </button>
              <button 
                className="slds-button slds-button_neutral" 
                onClick={() => handleBulkStatusUpdate('Inactive')}
                disabled={bulkActionLoading}
                style={{ backgroundColor: 'var(--token-layer-surface)', borderColor: 'var(--token-border-subtle)' }}
              >
                {bulkActionLoading ? 'Updating...' : `Deactivate (${selectedRows.size})`}
              </button>
            </>
          )}
            <span className="total-count">Total: {getFilteredRowsCount()}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-field">
          <label>Status:</label>
          <select value={filters.rate_status} onChange={(e) => setFilters(prev => ({ ...prev, rate_status: e.target.value }))}>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Set Key:</label>
          <select value={filters.set_key} onChange={(e) => setFilters(prev => ({ ...prev, set_key: e.target.value }))}>
            <option value="">All Set Keys</option>
            {Array.from(filterOptions.setKeys).sort().map(sk => (<option key={sk} value={sk}>{sk}</option>))}
          </select>
        </div>

        <div className="filter-field">
          <label>Property:</label>
          <select value={filters.property} onChange={(e) => setFilters(prev => ({ ...prev, property: e.target.value }))}>
            <option value="">All Properties</option>
            {Array.from(filterOptions.properties).sort().map(prop => (<option key={prop} value={prop}>{prop}</option>))}
          </select>
        </div>

        <div className="filter-field">
          <label>Product:</label>
          <select value={filters.product} onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}>
            <option value="">All Products</option>
            {Array.from(filterOptions.products).sort().map(product => (<option key={product} value={product}>{product}</option>))}
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
            {(filters.set_key || filters.property || filters.product || filters.type || filters.charge_type || filters.rate_status !== 'Active') && (
              <button 
                className="slds-button slds-button_text-destructive" 
                onClick={() => setFilters({ set_key: '', property: '', product: '', type: '', charge_type: '', rate_status: 'Active' })}
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
            <label>Type:</label>
            <select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}>
              <option value="">All Types</option>
              {Array.from(filterOptions.types).sort().map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>

          <div className="filter-field">
            <label>Charge Type:</label>
            <select value={filters.charge_type} onChange={(e) => setFilters(prev => ({ ...prev, charge_type: e.target.value }))}>
              <option value="">All Charge Types</option>
              {Array.from(filterOptions.chargeTypes || []).sort().map(ct => (<option key={ct} value={ct}>{ct}</option>))}
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="professional-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={selectAll} onChange={(e) => toggleSelectAll(e.target.checked)} />
              </th>
              <th onClick={() => changeSort('set_key')} className={`sortable ${sortField === 'set_key' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Set Key</th>
              <th onClick={() => changeSort('property')} className={`sortable ${sortField === 'property' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Property</th>
              <th onClick={() => changeSort('product')} className={`sortable ${sortField === 'product' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Product</th>
              <th onClick={() => changeSort('type')} className={`sortable ${sortField === 'type' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Type</th>
              <th onClick={() => changeSort('charge_type')} className={`sortable ${sortField === 'charge_type' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Charge Type</th>
              <th onClick={() => changeSort('product_fee')} className={`sortable text-center ${sortField === 'product_fee' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Arrangement Fee</th>
              <th onClick={() => changeSort('rate')} className={`sortable text-center ${sortField === 'rate' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Rate (%)</th>
              <th className="text-center">Min Term</th>
              <th className="text-center">Max Term</th>
              <th className="text-center">Min Rolled</th>
              <th className="text-center">Max Rolled</th>
              <th className="text-center">Min Loan</th>
              <th className="text-center">Max Loan</th>
              <th className="text-center">Min LTV</th>
              <th className="text-center">Max LTV</th>
              <th className="text-center">Min ICR</th>
              <th className="text-center">Max Defer</th>
              <th className="text-center">ERC 1 (%)</th>
              <th className="text-center">ERC 2 (%)</th>
              <th onClick={() => changeSort('rate_status')} className={`sortable ${sortField === 'rate_status' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Rate Status</th>
              <th onClick={() => changeSort('start_date')} className={`sortable ${sortField === 'start_date' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>Start Date</th>
              <th onClick={() => changeSort('end_date')} className={`sortable ${sortField === 'end_date' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}>End Date</th>
              <th className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageRows().map(r => (
              <tr key={r.id}>
                <td><input type="checkbox" checked={selectedRows.has(r.id)} onChange={() => toggleSelectRow(r.id)} /></td>
                <td>{r.set_key}</td>
                <td>{r.property}</td>
                {/* tier column removed — not present in DB schema */}
                <td>{r.product}</td>
                <td>{r.type}</td>
                <td>{r.charge_type}</td>
                <td className="text-center">{r.product_fee}</td>
                <td className="text-center">{r.rate}</td>
                <td className="text-center">{r.min_term}</td>
                <td className="text-center">{r.max_term}</td>
                <td className="text-center">{r.min_rolled_months}</td>
                <td className="text-center">{r.max_rolled_months}</td>
                <td className="text-center">£{r.min_loan?.toLocaleString()}</td>
                <td className="text-center">£{r.max_loan?.toLocaleString()}</td>
                <td className="text-center">{r.min_ltv}%</td>
                <td className="text-center">{r.max_ltv}%</td>
                <td className="text-center">{r.min_icr}%</td>
                <td className="text-center">{r.max_defer_int}</td>
                <td className="text-center">{r.erc_1 || '—'}</td>
                <td className="text-center">{r.erc_2 || '—'}</td>
                <td>
                  {(() => {
                    const lifecycleStatus = getRateLifecycleStatus(r);
                    return (
                      <span 
                        className={`status-badge status-${lifecycleStatus.status}`}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: lifecycleStatus.color === 'green' ? 'var(--token-success-background, #defbe6)' :
                                          lifecycleStatus.color === 'red' ? 'var(--token-error-background, #fff1f1)' :
                                          lifecycleStatus.color === 'orange' ? 'var(--token-warning-background, #fff8e1)' :
                                          lifecycleStatus.color === 'blue' ? 'var(--token-info-background, #edf5ff)' : 'var(--token-layer-surface)',
                          color: lifecycleStatus.color === 'green' ? 'var(--token-success-text, #198038)' :
                                lifecycleStatus.color === 'red' ? 'var(--token-error-text, #da1e28)' :
                                lifecycleStatus.color === 'orange' ? 'var(--token-warning-text, #f57c00)' :
                                lifecycleStatus.color === 'blue' ? 'var(--token-info-text, #0043ce)' : 'var(--token-text-secondary)'
                        }}
                      >
                        {lifecycleStatus.label}
                      </span>
                    );
                  })()}
                </td>
                <td>{r.start_date ?? ''}</td>
                <td>{r.end_date ?? ''}</td>
                <td className="sticky-action">
                  <div className="row-actions">
                    <button className="slds-button slds-button_neutral" onClick={() => setEditing(r)}>Edit</button>
                    <button className="slds-button slds-button_destructive" onClick={() => handleDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <div className="pagination-controls">
          <button className="slds-button slds-button_neutral" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button className="slds-button slds-button_neutral" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
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

      {editing && <BridgeRateEditModal rate={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}
      
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

export default BridgeFusionRates;
