import React from 'react';

/**
 * SliderResultRow Component
 * Renders a slider control as a table row for interactive result fields
 * 
 * @param {string} label - The label for the row
 * @param {number} value - Current value (used as fallback if columnValues not provided)
 * @param {function} onChange - Callback when value changes, receives (newValue, columnKey)
 * @param {number} min - Minimum value (fallback if columnMinValues not provided)
 * @param {number} max - Maximum value (fallback if columnMaxValues not provided)
 * @param {number} step - Step increment
 * @param {string} suffix - Optional suffix to display (e.g., "%", "months")
 * @param {boolean} disabled - Whether the slider is disabled
 * @param {array} columns - Column headers for multi-column tables
 * @param {object} columnValues - Values for each column {columnKey: value}
 * @param {object} columnMinValues - Min values for each column {columnKey: min}
 * @param {object} columnMaxValues - Max values for each column {columnKey: max}
 */
export default function SliderResultRow({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  suffix = '',
  disabled = false,
  columns = null,
  columnValues = null,
  columnMinValues = null,
  columnMaxValues = null
}) {
  const handleChange = (e, columnKey = null) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue, columnKey);
  };

  // Multi-column mode
  if (Array.isArray(columns) && columns.length > 0) {
    return (
      <tr>
        <td className="vertical-align-middle font-weight-600">{label}</td>
        {columns.map((col) => {
          const colValue = columnValues && columnValues[col] !== undefined ? columnValues[col] : value;
          const colMin = columnMinValues && columnMinValues[col] !== undefined ? columnMinValues[col] : min;
          const colMax = columnMaxValues && columnMaxValues[col] !== undefined ? columnMaxValues[col] : max;
          const range = colMax - colMin;
          const percentage = range > 0 ? ((colValue - colMin) / range) * 100 : 0;
          
          return (
            <td key={col} className="vertical-align-middle" style={{ padding: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="range"
                  min={colMin}
                  max={colMax}
                  step={step}
                  value={colValue}
                  onChange={(e) => handleChange(e, col)}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #0176d3 0%, #0176d3 ${percentage}%, #dddbda ${percentage}%, #dddbda 100%)`,
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <span 
                  style={{ 
                    minWidth: '60px', 
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#080707'
                  }}
                >
                  {colValue}{suffix}
                </span>
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  // Single column mode
  const range = max - min;
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
  
  return (
    <tr>
      <td className="vertical-align-middle font-weight-600">{label}</td>
      <td className="vertical-align-middle" style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '100px',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #0176d3 0%, #0176d3 ${percentage}%, #dddbda ${percentage}%, #dddbda 100%)`,
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <span 
            style={{ 
              minWidth: '60px', 
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#080707'
            }}
          >
            {value}{suffix}
          </span>
        </div>
      </td>
    </tr>
  );
}
