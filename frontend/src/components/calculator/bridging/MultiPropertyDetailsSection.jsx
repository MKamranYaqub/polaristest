import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import { formatCurrencyInput } from '../../../utils/calculator/numberFormatting';

/**
 * MultiPropertyDetailsSection - Manages multiple property entries for portfolio bridging loans
 * Displays table with property details and calculates totals
 */
const MultiPropertyDetailsSection = ({ 
  expanded, 
  onToggle,
  rows,
  onRowChange,
  onAddRow,
  onDeleteRow,
  totals,
  onUseTotalGrossLoan,
  isReadOnly = false
}) => {
  return (
    <div className="multi-property-details-hidden">
    <CollapsibleSection 
      title="Multi Property Details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="overflow-x-auto">
        <table className="slds-table slds-table_bordered slds-table_cell-buffer">
          <thead>
            <tr className="slds-line-height_reset">
              <th scope="col" className="width-25">
                <div className="slds-truncate" title="Property Address">Property Address</div>
              </th>
              <th scope="col" className="width-12">
                <div className="slds-truncate" title="Property Type">Property Type</div>
              </th>
              <th scope="col" className="width-13">
                <div className="slds-truncate" title="Property Value">Property Value (£)</div>
              </th>
              <th scope="col" className="width-13">
                <div className="slds-truncate" title="Charge Type">Charge Type</div>
              </th>
              <th scope="col" className="width-15">
                <div className="slds-truncate" title="First Charge Amount">First Charge Amount (£)</div>
              </th>
              <th scope="col" className="width-13">
                <div className="slds-truncate" title="Gross Loan">Gross Loan (£)</div>
              </th>
              <th scope="col" className="width-9">
                <div className="slds-truncate" title="Actions">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    className="slds-input"
                    type="text"
                    value={row.property_address}
                    onChange={(e) => onRowChange(row.id, 'property_address', e.target.value)}
                    placeholder="Enter address"
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <select
                    className="slds-select"
                    value={row.property_type}
                    onChange={(e) => onRowChange(row.id, 'property_type', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Semi-Commercial">Semi-Commercial</option>
                  </select>
                </td>
                <td>
                  <input
                    className="slds-input"
                    type="text"
                    value={formatCurrencyInput(row.property_value)}
                    onChange={(e) => onRowChange(row.id, 'property_value', e.target.value)}
                    placeholder="£0"
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <select
                    className="slds-select"
                    value={row.charge_type}
                    onChange={(e) => onRowChange(row.id, 'charge_type', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="First charge">First charge</option>
                    <option value="Second charge">Second charge</option>
                  </select>
                </td>
                <td>
                  <input
                    className="slds-input"
                    type="text"
                    value={formatCurrencyInput(row.first_charge_amount)}
                    onChange={(e) => onRowChange(row.id, 'first_charge_amount', e.target.value)}
                    placeholder="£0"
                    disabled={row.charge_type === 'First charge' || isReadOnly}
                  />
                </td>
                <td>
                  <div className="padding-05 font-weight-600 font-monospace">
                    £{Number(row.gross_loan).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td>
                  <button
                    className="slds-button slds-button_icon slds-button_icon-border-filled"
                    onClick={() => onDeleteRow(row.id)}
                    disabled={rows.length <= 1 || isReadOnly}
                    title="Delete row"
                  >
                    <svg className="slds-button__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="background-gray-medium font-weight-700">
              <td colSpan="2" className="text-align-right padding-075">
                <strong>Totals:</strong>
              </td>
              <td className="padding-075 font-monospace">
                £{totals.property_value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
              <td className="padding-075 font-monospace">
                £{totals.first_charge_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="padding-075 font-monospace">
                £{totals.gross_loan.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="margin-top-1 display-flex flex-gap-075 align-items-center">
        <button
          className="slds-button slds-button_neutral"
          onClick={onAddRow}
          disabled={isReadOnly}
        >
          <svg className="slds-button__icon slds-button__icon_left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Property
        </button>
        <button
          className="slds-button slds-button_brand"
          onClick={() => onUseTotalGrossLoan(totals.gross_loan)}
          title="Transfer total gross loan to main Loan Details section"
          disabled={isReadOnly}
        >
          <svg className="slds-button__icon slds-button__icon_left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Use Total Gross Loan
        </button>
      </div>
    </CollapsibleSection>
    </div>
  );
};

export default MultiPropertyDetailsSection;
