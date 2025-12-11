import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import ThemeToggle from '../ui/ThemeToggle';
import UserProfileButton from '../ui/UserProfileButton';
import Breadcrumbs, { useBreadcrumbs } from './Breadcrumbs';
import { useTheme } from '../../contexts/ThemeContext';
import SupportPanel from '../../components/SupportPanel';
import '../../styles/salesforce-nav.scss';

/**
 * SalesforceNav - Salesforce Lightning-style horizontal navigation
 * Features:
 * - Horizontal tab navigation
 * - Dropdown menus for Products and Admin
 * - User first name display
 * - Theme toggle
 * - User profile button
 */
function SalesforceNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, canAccessAdmin, isAdmin, logout } = useAuth();
  const { user: userProfile } = useUser();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'g100';
  const breadcrumbs = useBreadcrumbs();
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showSupportPanel, setShowSupportPanel] = useState(false);

  // Get user's first name
  const getUserFirstName = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    if (authUser?.name) {
      return authUser.name.split(' ')[0];
    }
    return 'User';
  };

  // Check if user can access admin pages
  const showAdminMenu = authUser && canAccessAdmin();
  const showUserManagement = authUser && isAdmin();

  // Navigation structure
  const navItems = [
    {
      id: 'products',
      label: 'Products',
      type: 'dropdown',
      children: [
        { id: 'btl', label: 'Buy to Let', path: '/products/btl' },
        { id: 'bridging', label: 'Bridge & Fusion', path: '/products/bridging' }
      ]
    },
    {
      id: 'calculator',
      label: 'Calculator',
      type: 'dropdown',
      children: [
        { id: 'calc-preview', label: 'Calculator Preview', path: '/calculator' },
        { id: 'calc-btl', label: 'BTL Calculator', path: '/calculator/btl' },
        { id: 'calc-bridging', label: 'Bridging Calculator', path: '/calculator/bridging' }
      ]
    },
    {
      id: 'quotes',
      label: 'Quotes',
      path: '/quotes',
      type: 'link'
    },
    ...(showAdminMenu ? [{
      id: 'admin',
      label: 'Admin',
      type: 'dropdown',
      children: [
        { id: 'constants', label: 'Constants', path: '/admin/constants' },
        { id: 'criteria', label: 'BTL Criteria', path: '/admin/criteria' },
        { id: 'btl-rates', label: 'BTL Rates', path: '/admin/btl-rates' },
        { id: 'bridging-rates', label: 'Bridging Rates', path: '/admin/bridging-rates' },
        { id: 'global-settings', label: 'Global Settings', path: '/admin/global-settings' },
        ...(showUserManagement ? [
          { id: 'users', label: 'Users', path: '/admin/users' },
          { id: 'support-requests', label: 'Support Requests', path: '/admin/support-requests' }
        ] : [])
      ]
    }] : [])
  ];

  const isActive = (path) => {
    if (!path) return false;
    // Exact match only - prevents /calculator from matching /calculator/btl
    return location.pathname === path;
  };

  const isDropdownActive = (children) => {
    return children.some(child => isActive(child.path));
  };

  const handleNavClick = (path) => {
    if (path) {
      navigate(path);
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.sf-nav-item')) {
      setActiveDropdown(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="sf-nav-container">
      {/* Single Header Bar with Logo, Breadcrumbs, and Actions */}
      <div className="sf-global-header">
        <div className="sf-global-header__left">
          <div className="sf-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
            <img 
              src={isDarkMode ? "/assets/mfs-logo-dark.png" : "/assets/mfs-logo.png"} 
              alt="MFS Logo" 
              className="sf-brand__logo" 
            />
          </div>
          
          {/* Breadcrumbs in Header */}
          {breadcrumbs.length > 0 && (
            <div className="sf-header-breadcrumbs">
              <div>
                <Breadcrumbs items={breadcrumbs} />
                <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                  {breadcrumbs[breadcrumbs.length - 1].label}
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Tabs */}
          <nav className="sf-nav-tabs">
          {navItems.map(item => {
            if (item.type === 'link') {
              return (
                <button
                  key={item.id}
                  className={`sf-nav-item ${isActive(item.path) ? 'sf-nav-item--active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                </button>
              );
            }
            
            if (item.type === 'button') {
              return (
                <button
                  key={item.id}
                  className="sf-nav-item"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              );
            }
            
            if (item.type === 'dropdown') {
              const dropdownActive = isDropdownActive(item.children);
              return (
                <div key={item.id} className="sf-nav-item sf-nav-item--dropdown">
                  <button
                    className={`sf-nav-item__trigger ${dropdownActive ? 'sf-nav-item--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(item.id);
                    }}
                  >
                    {item.label}
                    <svg className="sf-icon sf-nav-chevron" viewBox="0 0 24 24">
                      <path d="M8 10l4 4 4-4"/>
                    </svg>
                  </button>
                  
                  {activeDropdown === item.id && (
                    <div className="sf-dropdown">
                      <ul className="sf-dropdown__list">
                        {item.children.map(child => (
                          <li key={child.id}>
                            <button
                              className={`sf-dropdown__item ${isActive(child.path) ? 'sf-dropdown__item--active' : ''}`}
                              onClick={() => handleNavClick(child.path)}
                            >
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })}
        </nav>
        </div>
        
        <div className="sf-global-header__right">
          {/* Support Icon Button */}
          <button
            onClick={() => setShowSupportPanel(true)}
            title="Support"
            className="flex-center radius-sm hover-bg theme-toggle-btn"
            style={{ marginLeft: '0.5rem' }}
          >
            <svg className="sf-icon" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
            </svg>
          </button>
          
          <ThemeToggle />
          <UserProfileButton />
        </div>
      </div>

      {/* Support Panel */}
      {showSupportPanel && (
        <SupportPanel onClose={() => setShowSupportPanel(false)} />
      )}
    </div>
  );
}

export default SalesforceNav;
