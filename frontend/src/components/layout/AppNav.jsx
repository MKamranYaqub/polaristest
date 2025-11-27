import React from 'react';
import Navigation from './Navigation';
import ThemeToggle from '../ui/ThemeToggle';
import UserProfileButton from '../ui/UserProfileButton';
import '../../styles/app-nav.scss';

/**
 * AppNav - Consolidated navigation component
 * Contains the header with title, theme toggle, user profile button,
 * and the sidebar navigation
 * 
 * This component is extracted as a separate class to support
 * future Salesforce embedding scenarios where the host controls navigation
 */
function AppNav() {
  return (
    <header className="app-header">
      <h1 className="app-header__title">
        <img src="/assets/mfs-logo.png" alt="MFS Logo" className="app-header__logo" />
        Project Polaris
      </h1>
      <div className="margin-left-auto display-flex align-items-center flex-gap-5 margin-right-05">
        <ThemeToggle />
        <UserProfileButton />
      </div>
    </header>
  );
}

export default AppNav;
