import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import ThemeToggle from '../ui/ThemeToggle';
import UserProfileButton from '../ui/UserProfileButton';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * AppNav - Consolidated navigation component
 * Contains the header with title, theme toggle, user profile button,
 * and the sidebar navigation
 * 
 * This component is extracted as a separate class to support
 * future Salesforce embedding scenarios where the host controls navigation
 */
function AppNav() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'g100';
  
  return (
    <header className="app-header">
      <h1 className="app-header__title">
        <Link to="/home" className="app-header__home-link" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <img 
            src={isDarkMode ? "/assets/mfs-logo-dark.png" : "/assets/mfs-logo.png"} 
            alt="MFS Logo" 
            className="app-header__logo" 
          />
          Market Financial Solutions
        </Link>
      </h1>
      <div className="margin-left-auto display-flex align-items-center flex-gap-5 margin-right-05">
        <ThemeToggle />
        <UserProfileButton />
      </div>
    </header>
  );
}

export default AppNav;
