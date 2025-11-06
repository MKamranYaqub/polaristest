import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotes, getQuote, deleteQuote } from '../utils/quotes';

export default function QuotesList({ calculatorType = null, onLoad = null }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBorrowerType, setFilterBorrowerType] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');

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
      // Default behavior: navigate to /calculator and pass quote in state so the calculator auto-opens
      navigate('/calculator', { state: { loadQuote: q } });
    } catch (e) {
      window.alert('Failed to load quote: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quote?')) return;
    try {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      window.alert('Delete failed: ' + e.message);
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

  // Apply pagination to filtered results
  const totalFilteredPages = Math.ceil(filteredQuotes.length / rowsPerPage);
  const filteredStartIndex = (currentPage - 1) * rowsPerPage;
  const filteredEndIndex = filteredStartIndex + rowsPerPage;
  const paginatedQuotes = filteredQuotes.slice(filteredStartIndex, filteredEndIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterType, filterBorrowerType, filterCreatedFrom, filterCreatedTo, filterUpdatedFrom, filterUpdatedTo]);

  return (
    <div>
      <h2>Quotes {calculatorType ? `(${calculatorType})` : ''}</h2>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {/* Filters Section */}
      <div style={{ 
        background: '#f3f3f3', 
        padding: '1rem', 
        marginBottom: '1rem', 
        borderRadius: '4px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="slds-form-element">
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Name</label>
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
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Type</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All</option>
              <option value="BTL">BTL</option>
              <option value="BRIDGING">BRIDGING</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Borrower Type</label>
          <div className="slds-form-element__control">
            <select className="slds-select" value={filterBorrowerType} onChange={(e) => setFilterBorrowerType(e.target.value)}>
              <option value="">All</option>
              <option value="Personal">Personal</option>
              <option value="Company">Company</option>
            </select>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Created From</label>
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
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Created To</label>
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
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Updated From</label>
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
          <label className="slds-form-element__label" style={{ fontSize: '0.875rem' }}>Updated To</label>
          <div className="slds-form-element__control">
            <input 
              type="date" 
              className="slds-input" 
              value={filterUpdatedTo} 
              onChange={(e) => setFilterUpdatedTo(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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

      <div style={{ marginBottom: '0.5rem', color: '#666' }}>
        Showing {paginatedQuotes.length} of {filteredQuotes.length} quotes
      </div>
      
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Type</th>
              <th>Borrower Type</th>
              <th>Borrower/Company</th>
              <th>Created</th>
              <th>Updated</th>
              <th style={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuotes.map(q => (
              <tr key={q.id}>
                <td><strong>{q.reference_number || 'N/A'}</strong></td>
                <td>{q.name}</td>
                <td>{q.calculator_type}</td>
                <td>{q.borrower_type || '—'}</td>
                <td>{q.borrower_type === 'Company' ? q.company_name : q.borrower_name || '—'}</td>
                <td>{new Date(q.created_at).toLocaleString()}</td>
                <td>{q.updated_at ? new Date(q.updated_at).toLocaleString() : '—'}</td>
                <td style={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>
                  <button className="slds-button slds-button_neutral" onClick={() => handleLoad(q.id)}>Load</button>
                  <button style={{ marginLeft: 8 }} className="slds-button slds-button_destructive" onClick={() => handleDelete(q.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalFilteredPages > 1 && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
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
    </div>
  );
}
