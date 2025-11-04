import React, { useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import BridgeRateEditModal from './BridgeRateEditModal';
import '../styles/slds.css';

function BridgeFusionRates() {
  const { supabase } = useSupabase();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState('set_key');
  const [sortDir, setSortDir] = useState('asc');
  const [filters, setFilters] = useState({
    set_key: '',
    property: '',
    product: '',
    type: ''
  });
  const [filterOptions, setFilterOptions] = useState({ properties: new Set(), products: new Set(), setKeys: new Set(), types: new Set() });

  const fetch = async () => {
    setLoading(true);
    try {
      // fetch filtered data (select * — we'll derive available columns from returned rows)
    let q = supabase.from('bridge_fusion_rates_full').select('*');
    if (filters.set_key) q = q.eq('set_key', filters.set_key);
    if (filters.property) q = q.eq('property', filters.property);
    if (filters.product) q = q.eq('product', filters.product);
    if (filters.type) q = q.eq('type', filters.type);
      // No term filters: `initial_term`/`full_term` are not present in bridge_fusion_rates_full

      const { data, error } = await q.order('set_key', { ascending: true });
      if (error) throw error;
      const rowsData = data || [];
      setRows(rowsData);

      // derive filter options from the returned rows dynamically (tolerant to schema differences)
      setFilterOptions({
        properties: new Set(rowsData.map(r => r.property).filter(Boolean)),
        products: new Set(rowsData.map(r => r.product).filter(Boolean)),
        setKeys: new Set(rowsData.map(r => r.set_key).filter(Boolean)),
        types: new Set(rowsData.map(r => r.type).filter(Boolean))
      });
    } catch (e) {
      setError(e.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [supabase]);
  useEffect(() => { fetch(); }, [supabase, filters]);

  const handleAdd = () => {
    // default values depending on product type
    const defaults = {
      id: null,
      set_key: '',
      property: 'Bridge',
  type: 'Fixed',
  product_fee: 2,
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
        if (rec.id) {
        const { error } = await supabase.from('bridge_fusion_rates_full').update(rec).eq('id', rec.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bridge_fusion_rates_full').insert([rec]);
        if (error) throw error;
      }
      setEditing(null);
      await fetch();
    } catch (e) {
      setError(e.message || e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rate?')) return;
    try {
  const { error } = await supabase.from('bridge_fusion_rates_full').delete().eq('id', id);
      if (error) throw error;
      await fetch();
    } catch (e) {
      setError(e.message || e);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedRows);
    if (ids.length === 0) { alert('Please select at least one rate to delete'); return; }
    if (!window.confirm(`Delete ${ids.length} selected rates?`)) return;
    try {
  const { error } = await supabase.from('bridge_fusion_rates_full').delete().in('id', ids);
      if (error) throw error;
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
    const sorted = [...rows];
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
      sorted.sort((x, y) => (sortDir === 'asc' ? compare(x, y) : -compare(x, y)));
    }
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

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
            if (['rate','product_fee','min_loan','max_loan','min_ltv','max_ltv','min_icr','max_defer_int','min_term','max_term','min_rolled_months','max_rolled_months'].includes(key)) {
              obj[key] = toNumeric(raw);
            } else if (['is_retention','is_tracker'].includes(key)) {
              obj[key] = toBoolean(raw);
            } else {
              obj[key] = raw === undefined ? null : raw.toString().trim();
            }
          }
          return obj;
        }).filter(r => r.set_key || r.setkey || r.set_key === 0);

        const mapped = records.map(r => {
          if (r.scope && !r.property) { r.property = r.scope; delete r.scope; }
          if (!r.set_key && r.setkey) { r.set_key = r.setkey; delete r.setkey; }
          return r;
        });

        if (!mapped || mapped.length === 0) { setError('No valid records found in CSV. Ensure each row includes set_key etc.'); const fileEl = document.getElementById('bridge-csv-import'); if (fileEl) fileEl.value = ''; return; }

        const cleaned = mapped.map(r => {
          const rec = { ...r };
          if ('created_at' in rec) delete rec.created_at; if ('updated_at' in rec) delete rec.updated_at; if ('id' in rec) delete rec.id;
          // ensure type and product_fee exist
          if (!rec.type) rec.type = 'Fixed';
          if (rec.product_fee === null || rec.product_fee === undefined) rec.product_fee = 2;
          return rec;
        });

        const chunkSize = 200;
        for (let i = 0; i < cleaned.length; i += chunkSize) {
          const chunk = cleaned.slice(i, i + chunkSize);
          // Use the full column set for conflict so rows differing by LTV/type/etc are allowed
          const onConflictCols = 'set_key,property,product,type,product_fee,min_ltv,max_ltv,rate,min_term,max_term,min_rolled_months,max_rolled_months,min_loan,max_loan,min_icr,max_defer_int';
          const { error } = await supabase.from('bridge_fusion_rates_full').upsert(chunk, { onConflict: onConflictCols });
          if (error) { setError(error.message || JSON.stringify(error)); return; }
        }
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
  const headers = ['set_key','property','product','type','product_fee','min_ltv','max_ltv','rate','min_term','max_term','min_rolled_months','max_rolled_months','min_loan','max_loan','min_icr','max_defer_int'];
    const headerRow = headers.map(h => formatCsvValue(h)).join(',');
    const dataRows = rows.map(r => headers.map(h => formatExportField(h, r)).join(','));
    const csv = [headerRow, ...dataRows].join('\r\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; const date = new Date().toISOString().split('T')[0]; a.download = `bridge_fusion_rates_full_${date}.csv`; a.click(); window.URL.revokeObjectURL(url);
  };

  if (loading) return (<div className="slds-spinner_container"><div className="slds-spinner slds-spinner_medium"><div className="slds-spinner__dot-a"></div><div className="slds-spinner__dot-b"></div></div><div className="slds-text-heading_small slds-m-top_medium">Loading bridge & fusion rates...</div></div>);
  if (error) return (<div className="slds-box slds-theme_error">Error: {String(error)}</div>);

  return (
    <div>
      <div className="slds-grid slds-grid_vertical-align-center slds-m-bottom_medium">
        <div className="slds-col">
          <button className="slds-button slds-button_brand slds-m-right_small" onClick={handleAdd}>Add Bridge/Fusion Rate</button>
          <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} id="bridge-csv-import" />
          <button className="slds-button slds-button_neutral slds-m-right_small" onClick={() => document.getElementById('bridge-csv-import').click()}>Import CSV</button>
          <button className="slds-button slds-button_neutral slds-m-right_small" onClick={handleExport}>Export CSV</button>
          {selectedRows.size > 0 && (
            <button className="slds-button slds-button_destructive slds-m-left_small" onClick={handleBulkDelete}>Delete Selected ({selectedRows.size})</button>
          )}
          <span className="slds-m-left_small slds-text-title">Total rows: {rows.length}</span>
        </div>
        <div className="slds-col_bump-left">
          <div className="slds-grid slds-grid_vertical-align-center">
            <button className="slds-button slds-button_neutral" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
            <span className="slds-m-horizontal_small">Page {currentPage} of {totalPages}</span>
            <button className="slds-button slds-button_neutral" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      </div>

      <div className="slds-grid slds-wrap slds-m-bottom_medium" style={{ gap: '0.5rem' }}>
        <div className="slds-form-element" style={{ minWidth: '200px' }}>
          <label className="slds-form-element__label">Set Key:</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filters.set_key} onChange={(e) => setFilters(prev => ({ ...prev, set_key: e.target.value }))}>
              <option value="">All Set Keys</option>
              {Array.from(filterOptions.setKeys).sort().map(sk => (<option key={sk} value={sk}>{sk}</option>))}
            </select>
          </div>
        </div>

        <div className="slds-form-element" style={{ minWidth: '150px' }}>
          <label className="slds-form-element__label">Property:</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filters.property} onChange={(e) => setFilters(prev => ({ ...prev, property: e.target.value }))}>
              <option value="">All Properties</option>
              {Array.from(filterOptions.properties).sort().map(prop => (<option key={prop} value={prop}>{prop}</option>))}
            </select>
          </div>
        </div>

        {/* Tier filter removed: `tier` column does not exist in bridge_fusion_rates_full table */}

        <div className="slds-form-element" style={{ minWidth: '150px' }}>
          <label className="slds-form-element__label">Product:</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filters.product} onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}>
              <option value="">All Products</option>
              {Array.from(filterOptions.products).sort().map(product => (<option key={product} value={product}>{product}</option>))}
            </select>
          </div>
        </div>

        <div className="slds-form-element" style={{ minWidth: '150px' }}>
          <label className="slds-form-element__label">Type:</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}>
              <option value="">All Types</option>
              {Array.from(filterOptions.types).sort().map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
        </div>

        {/* initial_term/full_term filters removed: not present in bridge_fusion_rates_full schema */}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="slds-table slds-table_bordered slds-table_cell-buffer">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={selectAll} onChange={(e) => toggleSelectAll(e.target.checked)} />
              </th>
              <th onClick={() => changeSort('set_key')} style={{ cursor: 'pointer' }}>Set Key {sortField === 'set_key' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => changeSort('property')} style={{ cursor: 'pointer' }}>Property {sortField === 'property' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => changeSort('product')} style={{ cursor: 'pointer' }}>Product {sortField === 'product' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => changeSort('type')} style={{ cursor: 'pointer' }}>Type {sortField === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => changeSort('product_fee')} style={{ cursor: 'pointer' }}>Product Fee {sortField === 'product_fee' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => changeSort('rate')} style={{ cursor: 'pointer' }}>Rate (%) {sortField === 'rate' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Min Term</th>
              <th>Max Term</th>
              <th>Min Rolled</th>
              <th>Max Rolled</th>
              <th>Min Loan</th>
              <th>Max Loan</th>
              <th>Min LTV</th>
              <th>Max LTV</th>
              <th>Min ICR</th>
              <th>Max Defer</th>
              <th>Actions</th>
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
                <td>{r.product_fee}</td>
                <td>{r.rate}</td>
                <td>{r.min_term}</td>
                <td>{r.max_term}</td>
                <td>{r.min_rolled_months}</td>
                <td>{r.max_rolled_months}</td>
                <td>£{r.min_loan?.toLocaleString()}</td>
                <td>£{r.max_loan?.toLocaleString()}</td>
                <td>{r.min_ltv}%</td>
                <td>{r.max_ltv}%</td>
                <td>{r.min_icr}%</td>
                <td>{r.max_defer_int}</td>
                <td>
                  <div className="slds-grid" style={{ gap: '0.25rem' }}>
                    <button className="slds-button slds-button_neutral" onClick={() => setEditing(r)}>Edit</button>
                    <button className="slds-button slds-button_destructive" onClick={() => handleDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <BridgeRateEditModal rate={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}
    </div>
  );
}

export default BridgeFusionRates;
