import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from '@carbon/react';
import { listQuotes, getQuote, deleteQuote } from '../utils/quotes';
import { API_BASE_URL } from '../config/api';
import NotificationModal from './NotificationModal';
import ConfirmationModal from './ConfirmationModal';
import Breadcrumbs from './Breadcrumbs';

export default function QuotesList({ calculatorType = null, onLoad = null }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const rowsPerPage = 10;

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBorrowerType, setFilterBorrowerType] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  
  // Confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, quoteId: null });
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listQuotes({ calculator_type: calculatorType });
      setQuotes(res.quotes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetch(); 
    setCurrentPage(1); // Reset to first page when filter changes
  }, [calculatorType]);

  const navigate = useNavigate();

  const handleLoad = async (id) => {
    try {
      const res = await getQuote(id);
      const q = res.quote;
      if (onLoad) {
        onLoad(q);
        return;
      }
      // Default behavior: navigate to the specific calculator route (BTL or Bridging)
      // and pass the loaded quote in location state so the calculator auto-opens.
      const type = (q.calculator_type || '').toString().toLowerCase();
      let target = '/calculator/btl';
      if (type.includes('bridg') || type.includes('bridge') || type.includes('bridging')) {
        target = '/calculator/bridging';
      } else if (type.includes('btl')) {
        target = '/calculator/btl';
      }
      navigate(target, { state: { loadQuote: q } });
    } catch (e) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to load quote: ' + e.message });
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, quoteId: id });
  };
  
  const confirmDelete = async () => {
    const id = deleteConfirm.quoteId;
    try {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Delete failed: ' + e.message });
    }
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (calculatorType) {
        params.append('calculator_type', calculatorType);
      }
      
      const url = `${API_BASE_URL}/api/export/quotes${params.toString() ? '?' + params.toString() : ''}`;
      
      // Use XMLHttpRequest instead of fetch to avoid potential hooks
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result.data || []);
            } catch (e) {
              reject(new Error('Failed to parse response: ' + e.message));
            }
          } else {
            reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error. Make sure backend is running on port 3001.'));
        };
        
        xhr.send();
      });
      
      if (data.length === 0) {
        setNotification({ 
          show: true, 
          type: 'warning', 
          title: 'No Data', 
          message: 'No quotes found to export' 
        });
        return;
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => {
        return headers.map(header => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });
      
      const csv = [csvHeaders, ...csvRows].join('\n');
      
      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `quotes_export_${calculatorType || 'all'}_${timestamp}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      setNotification({ 
        show: true, 
        type: 'success', 
        title: 'Success', 
        message: `Exported ${data.length} rows to ${filename}` 
      });
    } catch (e) {
      setNotification({ 
        show: true, 
        type: 'error', 
        title: 'Export Error', 
        message: e.message || 'Failed to export quotes' 
      });
    } finally {
      setExporting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(quotes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentQuotes = quotes.slice(startIndex, endIndex);

  // Apply filters
  const filteredQuotes = quotes.filter(q => {
    // Name filter
    if (filterName && !q.name.toLowerCase().includes(filterName.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType && q.calculator_type !== filterType) {
      return false;
    }

    // Borrower Type filter
    if (filterBorrowerType && q.borrower_type !== filterBorrowerType) {
      return false;
    }

    // Created date filter
    if (filterCreatedFrom || filterCreatedTo) {
      const createdDate = new Date(q.created_at);
      if (filterCreatedFrom) {
        const fromDate = new Date(filterCreatedFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (createdDate < fromDate) return false;
      }
      if (filterCreatedTo) {
        const toDate = new Date(filterCreatedTo);
        toDate.setHours(23, 59, 59, 999);
        if (createdDate > toDate) return false;
      }
    }

    // Updated date filter
    if (filterUpdatedFrom || filterUpdatedTo) {
      if (!q.updated_at) return false; // Skip quotes that have never been updated
      const updatedDate = new Date(q.updated_at);
      if (filterUpdatedFrom) {
        const fromDate = new Date(filterUpdatedFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (updatedDate < fromDate) return false;
      }
      if (filterUpdatedTo) {
        const toDate = new Date(filterUpdatedTo);
        toDate.setHours(23, 59, 59, 999);
        if (updatedDate > toDate) return false;
      }
    }

    return true;
  });
  
  // Apply sorting
  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    // Convert dates to timestamps for comparison
    if (sortField === 'created_at' || sortField === 'updated_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    // String comparison (case-insensitive)
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Apply pagination to sorted results
  const totalFilteredPages = Math.ceil(sortedQuotes.length / rowsPerPage);
  const filteredStartIndex = (currentPage - 1) * rowsPerPage;
  const filteredEndIndex = filteredStartIndex + rowsPerPage;
  const paginatedQuotes = sortedQuotes.slice(filteredStartIndex, filteredEndIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterType, filterBorrowerType, filterCreatedFrom, filterCreatedTo, filterUpdatedFrom, filterUpdatedTo]);

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Home', path: '/' },
        { label: 'Quotes', path: '/quotes' }
      ]} />
      
      <div className="display-flex justify-content-space-between align-items-center margin-bottom-1">
        <h2>Quotes {calculatorType ? `(${calculatorType})` : ''}</h2>
        <button 
          className="slds-button slds-button_brand display-flex align-items-center flex-gap-05" 
          onClick={handleExport}
          disabled={exporting || loading}
        >
          {exporting ? (
            <>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              <span>Export to CSV</span>
            </>
          )}
        </button>
      </div>
      {loading && (
        <div className="display-flex justify-content-center align-items-center margin-vertical-2">
          <Loading description="Loading quotes" withOverlay={false} />
        </div>
      )}
      {error && <div className="slds-text-color_error">{error}</div>}
      
      {/* Filters Section */}
      <div className="quotes-filter-section">
        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Name</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              placeholder="Search by name..."
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Type</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All</option>
              <option value="BTL">BTL</option>
              <option value="BRIDGING">BRIDGING</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Borrower Type</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filterBorrowerType} onChange={(e) => setFilterBorrowerType(e.target.value)}>
              <option value="">All</option>
              <option value="Personal">Personal</option>
              <option value="Company">Company</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Created From</label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              value={filterCreatedFrom} 
              onChange={(e) => setFilterCreatedFrom(e.target.value)} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Created To</label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              value={filterCreatedTo} 
              onChange={(e) => setFilterCreatedTo(e.target.value)} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Updated From</label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              value={filterUpdatedFrom} 
              onChange={(e) => setFilterUpdatedFrom(e.target.value)} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label slds-text-body_small">Updated To</label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              value={filterUpdatedTo} 
              onChange={(e) => setFilterUpdatedTo(e.target.value)} 
            />
          </div>
        </div>

        <div className="display-flex align-items-flex-end">
          <button 
            className="slds-button slds-button_neutral" 
            onClick={() => {
              setFilterName('');
              setFilterType('');
              setFilterBorrowerType('');
              setFilterCreatedFrom('');
              setFilterCreatedTo('');
              setFilterUpdatedFrom('');
              setFilterUpdatedTo('');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="quotes-showing-count helper-text margin-bottom-05">
        Showing {paginatedQuotes.length} of {sortedQuotes.length} quotes
      </div>
      
      <div className="overflow-auto position-relative">
        <table className="slds-table slds-table_cell-buffer slds-table_bordered width-100">
          <thead>
            <tr>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('reference_number')}
                  title="Sort by Reference Number"
                >
                  <span className="slds-th__action-text">Ref #</span>
                  {sortField === 'reference_number' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('name')}
                  title="Sort by Quote Name"
                >
                  <span className="slds-th__action-text">Quote Name</span>
                  {sortField === 'name' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('calculator_type')}
                  title="Sort by Type"
                >
                  <span className="slds-th__action-text">Type</span>
                  {sortField === 'calculator_type' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th>Status</th>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('borrower_type')}
                  title="Sort by Borrower Type"
                >
                  <span className="slds-th__action-text">Borrower Type</span>
                  {sortField === 'borrower_type' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th>Borrower/Company</th>
              <th>Created By</th>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('created_at')}
                  title="Sort by Created Date"
                >
                  <span className="slds-th__action-text">Created</span>
                  {sortField === 'created_at' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th>Updated By</th>
              <th>
                <button 
                  className="slds-th__action" 
                  onClick={() => handleSort('updated_at')}
                  title="Sort by Updated Date"
                >
                  <span className="slds-th__action-text">Updated</span>
                  {sortField === 'updated_at' && (
                    <span className="slds-th__sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
              <th className="sticky-table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuotes.length === 0 ? (
              <tr>
                <td colSpan="11">
                  <div className="quotes-empty-state">
                    <div className="quotes-empty-state__icon">📋</div>
                    <div className="quotes-empty-state__title">
                      {sortedQuotes.length === 0 && quotes.length === 0 
                        ? 'No quotes yet' 
                        : 'No quotes match your filters'}
                    </div>
                    <div className="quotes-empty-state__message">
                      {sortedQuotes.length === 0 && quotes.length === 0 
                        ? 'Create your first quote using the calculator to get started.'
                        : 'Try adjusting your filters to see more results.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedQuotes.map(q => {
              // Determine status badge
              const dipStatus = q.dip_status || 'Not Issued';
              const quoteStatus = q.quote_status || 'Not Issued';
              
              // Choose the most relevant status to display
              let statusText = 'Draft';
              let statusClass = 'slds-badge_default';
              
              if (quoteStatus === 'Issued') {
                statusText = 'Quote Issued';
                statusClass = 'slds-theme_success';
              } else if (dipStatus === 'Issued') {
                statusText = 'DIP Issued';
                statusClass = 'slds-theme_info';
              } else if (dipStatus === 'Expired') {
                statusText = 'DIP Expired';
                statusClass = 'slds-theme_warning';
              }

              return (
              <tr key={q.id}>
                <td><strong>{q.reference_number || 'N/A'}</strong></td>
                <td>{q.name}</td>
                <td>{q.calculator_type}</td>
                <td>
                  <span className={`slds-badge ${statusClass}`}>
                    {statusText}
                  </span>
                </td>
                <td>{q.borrower_type || '—'}</td>
                <td>{q.borrower_type === 'Company' ? q.company_name : q.borrower_name || '—'}</td>
                <td>
                  <span title={q.created_by_id ? `User ID: ${q.created_by_id}` : 'No user info'}>
                    {q.created_by || '—'}
                  </span>
                </td>
                <td>{new Date(q.created_at).toLocaleString()}</td>
                <td>
                  <span title={q.updated_by_id ? `User ID: ${q.updated_by_id}` : 'No user info'}>
                    {q.updated_by || '—'}
                  </span>
                </td>
                <td>{q.updated_at ? new Date(q.updated_at).toLocaleString() : '—'}</td>
                <td className="sticky-table-cell">
                  <button className="slds-button slds-button_neutral" onClick={() => handleLoad(q.id)}>Load</button>
                  <button className="slds-button slds-button_destructive margin-left-8" onClick={() => handleDelete(q.id)}>Delete</button>
                </td>
              </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalFilteredPages > 1 && (
        <div className="display-flex justify-content-center align-items-center flex-gap-05 margin-top-1">
          <button 
            className="slds-button slds-button_neutral" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalFilteredPages}</span>
          <button 
            className="slds-button slds-button_neutral" 
            onClick={() => setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1))}
            disabled={currentPage === totalFilteredPages}
          >
            Next
          </button>
        </div>
      )}
      
      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, quoteId: null })}
        onConfirm={confirmDelete}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="slds-button_destructive"
      />
    </div>
  );
}
