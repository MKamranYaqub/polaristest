import React, { useState } from 'react';
import ModalShell from './ModalShell';
import '../styles/slds.css';

function RateEditModal({ rate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ...rate,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      rate: formData.rate === '' || formData.rate === null ? null : parseFloat(formData.rate),
      initial_term: formData.initial_term === '' || formData.initial_term === null ? null : Number(formData.initial_term),
      full_term: formData.full_term === '' || formData.full_term === null ? null : Number(formData.full_term),
      product_fee: formData.product_fee === '' || formData.product_fee === null ? null : Number(formData.product_fee)
    });
  };

  // Build footer buttons for ModalShell
  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onCancel}>
        Cancel
      </button>
      <button className="slds-button slds-button_brand" onClick={handleSubmit}>
        Save
      </button>
    </>
  );

  return (
    <ModalShell isOpen={true} onClose={onCancel} title={rate.id ? 'Edit Rate' : 'Add New Rate'} footer={footerButtons}>
      <form onSubmit={handleSubmit} className="slds-form slds-form_stacked">
        <div className="slds-form-element">
          <label className="slds-form-element__label">Set Key:</label>
          <div className="slds-form-element__control">
            <input
              className="slds-input"
              type="text"
              name="set_key"
              value={formData.set_key}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="slds-form-element">
                <label className="slds-form-element__label">Property Type:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="property"
                    value={formData.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Semi-Commercial">Semi-Commercial</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Tier:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    required
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Product:</label>
                <div className="slds-form-element__control">
                  <select
                    className="slds-select"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    required
                  >
                    <option value="2yr Fix">2yr Fix</option>
                    <option value="3yr Fix">3yr Fix</option>
                    <option value="2yr Tracker">2yr Tracker</option>
                  </select>
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Rate (%):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Initial Term (months):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="initial_term"
                    value={formData.initial_term ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <label className="slds-form-element__label">Full Term (months):</label>
                <div className="slds-form-element__control">
                  <input
                    className="slds-input"
                    type="number"
                    name="full_term"
                    value={formData.full_term ?? ''}
                    onChange={handleChange}
                    step="1"
                  />
                </div>
              </div>

              <div className="slds-form-element">
                <div className="slds-form-element__control">
                  <div className="slds-checkbox">
                    <input
                      type="checkbox"
                      name="is_tracker"
                      id="is_tracker"
                      checked={formData.is_tracker}
                      onChange={handleChange}
                    />
                    <label className="slds-checkbox__label" htmlFor="is_tracker">
                      <span className="slds-checkbox__faux"></span>
                      <span className="slds-form-element__label">Is Tracker Rate</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>
    </ModalShell>
  );
}

export default RateEditModal;