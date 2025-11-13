import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import '../styles/settings.css';

const SettingsPage = () => {
  const { themeMode, setThemeMode } = useTheme();
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('theme');
  const [resetMessage, setResetMessage] = useState('');

  const handleResetAccessibility = () => {
    resetSettings();
    setResetMessage('Settings reset to defaults');
    setTimeout(() => setResetMessage(''), 3000);
  };

  return (
    <div className="settings-page padding-2 max-width-1200 margin-0-auto">
      <h1>Settings</h1>
      <p>Theme and accessibility preferences</p>
      
      <div className="settings-tabs margin-top-2">
        <button 
          className={`settings-tab-button margin-right-1 ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Theme
        </button>
        <button 
          className={`settings-tab-button ${activeTab === 'accessibility' ? 'active' : ''}`}
          onClick={() => setActiveTab('accessibility')}
        >
          Accessibility
        </button>
      </div>
      
      {activeTab === 'theme' && (
        <div className="margin-top-2">
          <h2>Theme Preference</h2>
          <div>
            <label><input type="radio" name="theme" value="light" checked={themeMode === 'light'} onChange={(e) => setThemeMode(e.target.value)} /> Light</label><br/>
            <label><input type="radio" name="theme" value="dark" checked={themeMode === 'dark'} onChange={(e) => setThemeMode(e.target.value)} /> Dark</label><br/>
            <label><input type="radio" name="theme" value="system" checked={themeMode === 'system'} onChange={(e) => setThemeMode(e.target.value)} /> System</label>
          </div>
        </div>
      )}
      
      {activeTab === 'accessibility' && (
        <div className="margin-top-2">
          <h2>Accessibility Options</h2>
          <button className="slds-button slds-button_neutral" onClick={handleResetAccessibility}>Reset to Defaults</button>
          {resetMessage && (
            <div className="slds-notify slds-notify_alert slds-theme_success margin-top-1 padding-075">
              {resetMessage}
            </div>
          )}
          <div className="margin-top-2">
            {/* Toggle switches for boolean settings */}
            <div className="setting-item">
              <label className="toggle-label">
                <span className="setting-label-text">Reduce Motion</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.reducedMotion} 
                    onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <span className="setting-label-text">High Contrast</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.highContrast} 
                    onChange={(e) => updateSetting('highContrast', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <span className="setting-label-text">Enhanced Focus Indicators</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.focusIndicators} 
                    onChange={(e) => updateSetting('focusIndicators', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <span className="setting-label-text">Text Spacing</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.textSpacing} 
                    onChange={(e) => updateSetting('textSpacing', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <span className="setting-label-text">Link Underlines</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.linkUnderlines} 
                    onChange={(e) => updateSetting('linkUnderlines', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            {/* Font size radio buttons */}
            <div className="setting-item margin-top-2">
              <div className="setting-label-text margin-bottom-075 font-weight-500">Font Size</div>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="small" 
                    checked={settings.fontSize === 'small'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Small</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="medium" 
                    checked={settings.fontSize === 'medium'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Medium</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="large" 
                    checked={settings.fontSize === 'large'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Large</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fontSize" 
                    value="x-large" 
                    checked={settings.fontSize === 'x-large'} 
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  />
                  <span>Extra Large</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
