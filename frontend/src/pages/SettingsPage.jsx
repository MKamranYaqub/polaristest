import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Settings</h1>
      <p>Theme and accessibility preferences</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => setActiveTab('theme')} style={{ marginRight: '1rem', fontWeight: activeTab === 'theme' ? 'bold' : 'normal' }}>Theme</button>
        <button onClick={() => setActiveTab('accessibility')} style={{ fontWeight: activeTab === 'accessibility' ? 'bold' : 'normal' }}>Accessibility</button>
      </div>
      
      {activeTab === 'theme' && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Theme Preference</h2>
          <div>
            <label><input type="radio" name="theme" value="light" checked={themeMode === 'light'} onChange={(e) => setThemeMode(e.target.value)} /> Light</label><br/>
            <label><input type="radio" name="theme" value="dark" checked={themeMode === 'dark'} onChange={(e) => setThemeMode(e.target.value)} /> Dark</label><br/>
            <label><input type="radio" name="theme" value="system" checked={themeMode === 'system'} onChange={(e) => setThemeMode(e.target.value)} /> System</label>
          </div>
        </div>
      )}
      
      {activeTab === 'accessibility' && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Accessibility Options</h2>
          <button onClick={handleResetAccessibility}>Reset</button>
          {resetMessage && <div style={{ color: 'green', marginTop: '1rem' }}>{resetMessage}</div>}
          <div style={{ marginTop: '1rem' }}>
            <label><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => updateSetting('reducedMotion', e.target.checked)} /> Reduce Motion</label><br/>
            <label><input type="checkbox" checked={settings.highContrast} onChange={(e) => updateSetting('highContrast', e.target.checked)} /> High Contrast</label><br/>
            <label><input type="checkbox" checked={settings.focusIndicators} onChange={(e) => updateSetting('focusIndicators', e.target.checked)} /> Enhanced Focus</label><br/>
            <label><input type="checkbox" checked={settings.textSpacing} onChange={(e) => updateSetting('textSpacing', e.target.checked)} /> Text Spacing</label><br/>
            <label><input type="checkbox" checked={settings.linkUnderlines} onChange={(e) => updateSetting('linkUnderlines', e.target.checked)} /> Link Underlines</label>
            <div style={{ marginTop: '1rem' }}>
              <label>Font Size:</label><br/>
              <label><input type="radio" name="fontSize" value="small" checked={settings.fontSize === 'small'} onChange={(e) => updateSetting('fontSize', e.target.value)} /> Small</label><br/>
              <label><input type="radio" name="fontSize" value="medium" checked={settings.fontSize === 'medium'} onChange={(e) => updateSetting('fontSize', e.target.value)} /> Medium</label><br/>
              <label><input type="radio" name="fontSize" value="large" checked={settings.fontSize === 'large'} onChange={(e) => updateSetting('fontSize', e.target.value)} /> Large</label><br/>
              <label><input type="radio" name="fontSize" value="x-large" checked={settings.fontSize === 'x-large'} onChange={(e) => updateSetting('fontSize', e.target.value)} /> Extra Large</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
