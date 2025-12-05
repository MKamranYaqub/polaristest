import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import SalesforceIcon from '../shared/SalesforceIcon';
import '../../styles/ThemeToggle.css';

/**
 * ThemeToggle - Quick toggle button for light/dark theme
 * Cycles through: Light → Dark → System
 */
const ThemeToggle = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const cycleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    if (themeMode === 'dark') {
      return <SalesforceIcon category="utility" name="moon" size="small" />;
    } else if (themeMode === 'system') {
      return <SalesforceIcon category="utility" name="settings" size="small" />;
    } else {
      return <SalesforceIcon category="utility" name="dayview" size="small" />;
    }
  };

  const getTooltip = () => {
    if (themeMode === 'dark') {
      return 'Dark theme (click for System)';
    } else if (themeMode === 'system') {
      return 'System theme (click for Light)';
    } else {
      return 'Light theme (click for Dark)';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      title={getTooltip()}
      className="flex-center radius-sm hover-bg theme-toggle-btn"
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
