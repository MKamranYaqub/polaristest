import React, { useState } from 'react';

/**
 * EditableResultRow Component
 * Renders an editable table row where each column value can be modified
 * with a reset button to restore original values
 * 
 * @param {string} label - The label for the row
 * @param {array} columns - Column headers
 * @param {object} columnValues - Current values for each column
 * @param {object} originalValues - Original values for each column (for reset)
 * @param {function} onValueChange - Callback when a value changes (newValue, columnKey)
 * @param {function} onReset - Callback when reset is clicked (columnKey)
 * @param {boolean} disabled - Whether editing is disabled
 * @param {string} suffix - Optional suffix (e.g., "%")
 */
export default function EditableResultRow({
  label,
  columns,
  columnValues,
  originalValues,
  onValueChange,
  onReset,
  disabled = false,
  suffix = ''
}) {
  const [editingColumn, setEditingColumn] = useState(null);
  const [localValues, setLocalValues] = useState({});

  const handleInputChange = (columnKey, value, inputElement) => {
    // If user is editing and there's a suffix, ensure we're only editing the numeric part
    let rawValue = value;
    
    if (suffix) {
      // If value ends with suffix, extract the raw value
      if (value.endsWith(suffix)) {
        rawValue = value.slice(0, -suffix.length);
      } else {
        // User might have deleted the suffix, so use the value as-is
        rawValue = value;
      }
    }
    
    // Update local state with raw value (without suffix)
    setLocalValues(prev => ({ ...prev, [columnKey]: rawValue.trim() }));
    
    // Only propagate non-empty values to parent
    if (rawValue.trim() !== '') {
      onValueChange(rawValue.trim(), columnKey);
    }
  };

  const handleBlur = (columnKey) => {
    const localValue = localValues[columnKey];
    // If field is empty on blur, reset to original value
    if (localValue !== undefined && localValue.trim() === '') {
      onReset(columnKey);
      setLocalValues(prev => {
        const updated = { ...prev };
        delete updated[columnKey];
        return updated;
      });
    } else if (localValue !== undefined && localValue.trim() !== '') {
      // Apply the value with suffix if it's not empty
      const valueWithSuffix = localValue.trim() + suffix;
      onValueChange(valueWithSuffix, columnKey);
    }
  };

  const handleReset = (columnKey) => {
    onReset(columnKey);
    setLocalValues(prev => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  return (
    <tr>
      <td className="vertical-align-middle font-weight-600">{label}</td>
      {columns.map((col) => {
        const isEditing = editingColumn === col;
        
        // Get the raw value (without suffix)
        let rawValue = '';
        if (isEditing && localValues[col] !== undefined) {
          rawValue = localValues[col];
        } else {
          const storedValue = columnValues?.[col] ?? '';
          // Remove suffix from stored value to get raw value
          if (suffix && storedValue.endsWith(suffix)) {
            rawValue = storedValue.slice(0, -suffix.length);
          } else {
            rawValue = storedValue;
          }
        }
        
        // When editing, show only raw value for easier editing (suffix added visually on blur)
        // When not editing, show with suffix
        const displayValue = isEditing ? rawValue : (rawValue + suffix);
        
        const originalValue = originalValues?.[col] ?? '';
        const hasOverride = columnValues?.[col] !== originalValue && originalValue !== '';
        
        return (
          <td key={col} className="vertical-align-middle" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={displayValue}
                onChange={(e) => handleInputChange(col, e.target.value, e.target)}
                onBlur={() => {
                  handleBlur(col);
                  setEditingColumn(null);
                }}
                disabled={disabled}
                style={{
                  flex: 1,
                  padding: '0.25rem 0.5rem',
                  border: hasOverride ? '2px solid #0176d3' : '1px solid #c6c6c6',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  backgroundColor: hasOverride ? '#f4f4f4' : 'white',
                  cursor: disabled ? 'not-allowed' : 'text'
                }}
                onFocus={() => setEditingColumn(col)}
              />
              {hasOverride && !disabled && (
                <button
                  onClick={() => handleReset(col)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #c6c6c6',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#0176d3',
                    fontWeight: '600'
                  }}
                  title={`Reset to ${originalValue}`}
                >
                  ↺
                </button>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
