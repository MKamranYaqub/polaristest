import React from 'react';

// Simple, presentational placeholder table for calculator result fields.
// Props:
// - labels: array of strings (row labels)
// - values: optional object mapping label -> value to show instead of placeholder
// - note: optional string shown below the table
export default function CalculatorResultsPlaceholders({ labels = [], values = {}, note = '', columns = null, renderAsRows = false }) {
  // If `columns` is provided (array of column headers), render a multi-column table
  // where first column is Label and subsequent columns correspond to `columns`.
  if (Array.isArray(columns) && columns.length > 0) {
    // If requested to render as table rows, return fragment of <tr> elements so
    // callers can include them inside an existing table <tbody>.
    if (renderAsRows) {
      return (
        <>
          {labels.map((lab) => (
            <tr key={lab}>
              <td style={{ verticalAlign: 'top', fontWeight: 600 }}>{lab}</td>
              {columns.map((c) => (
                // center-align placeholder/value cells so they match header alignment
                <td key={c} style={{ verticalAlign: 'top', textAlign: 'center' }}>{(values && values[lab] && Object.prototype.hasOwnProperty.call(values[lab], c)) ? values[lab][c] : '—'}</td>
              ))}
            </tr>
          ))}
        </>
      );
    }

    return (
      <div className="results-placeholders slds-box slds-m-top_medium">
        <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ width: '100%', minWidth: Math.max(560, columns.length * 160) }}>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Label</th>
              {columns.map((c) => (
                <th key={c} style={{ textAlign: 'left' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((lab) => (
              <tr key={lab}>
                <td style={{ verticalAlign: 'top', fontWeight: 600 }}>{lab}</td>
                {columns.map((c) => (
                  <td key={c} style={{ verticalAlign: 'top' }}>{(values && values[lab] && Object.prototype.hasOwnProperty.call(values[lab], c)) ? values[lab][c] : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {note && (
          <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>{note}</div>
        )}
      </div>
    );
  }

  // Fallback: two-column layout
  // Fallback: two-column layout. Also supports renderAsRows to return <tr> fragments.
  if (renderAsRows) {
    return (
      <>
        {labels.map((lab) => (
          <tr key={lab}>
            <td style={{ verticalAlign: 'top', fontWeight: 600 }}>{lab}</td>
            <td style={{ verticalAlign: 'top', textAlign: 'center' }}>{(values && Object.prototype.hasOwnProperty.call(values, lab)) ? values[lab] : '—'}</td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="results-placeholders slds-box slds-m-top_medium">
      <table className="slds-table slds-table_cell-buffer slds-table_bordered" style={{ width: '100%', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ width: '55%' }}>Label</th>
            <th style={{ width: '45%' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((lab) => (
            <tr key={lab}>
              <td style={{ verticalAlign: 'top', fontWeight: 600 }}>{lab}</td>
              <td style={{ verticalAlign: 'top' }}>{(values && Object.prototype.hasOwnProperty.call(values, lab)) ? values[lab] : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && (
        <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>{note}</div>
      )}
    </div>
  );
}
