import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SLDS Vertical Navigation Tree
 * Hierarchical tree structure with expand/collapse interactions
 * following Salesforce Lightning Design System patterns
 */

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, canAccessAdmin, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  // Check if user can access admin pages
  const showAdminMenu = user && canAccessAdmin();
  
  // Only admins (level 1) can access user management
  const showUserManagement = user && isAdmin();

  // Navigation tree structure
  const navTree = [
    {
      id: 'home',
      label: 'Home',
      icon: 'utility:home',
      path: '/home'
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'utility:apps',
      path: '/products'
    },
    {
      id: 'calculator',
      label: 'Calculator',
      icon: 'utility:calculator',
      children: [
        { id: 'calc-overview', label: 'Overview', path: '/calculator' },
        { id: 'btl', label: 'BTL Calculator', path: '/calculator/btl' },
        { id: 'bridging', label: 'Bridging Calculator', path: '/calculator/bridging' }
      ]
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: 'utility:quote',
      path: '/quotes'
    },
    ...(showAdminMenu ? [{
      id: 'admin',
      label: 'Admin',
      icon: 'utility:settings',
      children: [
        { id: 'admin-overview', label: 'Overview', path: '/admin' },
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

  // Section expand/collapse state
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    navTree.forEach(item => {
      if (item.children) {
        // Auto-expand if current path matches any child
        initial[item.id] = item.children.some(child => location.pathname === child.path);
      }
    });
    return initial;
  });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 900;
      setIsDesktop(desktop);
      if (desktop) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = () => setMobileOpen(v => !v);
  const closeMobile = () => setMobileOpen(false);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (!isDesktop) setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Chevron icon component
  const ChevronIcon = ({ expanded }) => (
    <svg 
      className={`slds-tree__toggle-icon ${expanded ? 'slds-is-expanded' : ''}`} 
      aria-hidden="true" 
      viewBox="0 0 52 52"
    >
      <path d="M19.5 13l12 12c.7.7.7 1.8 0 2.5l-12 12c-1 1-2.7.3-2.7-1.2V14.2c0-1.5 1.7-2.2 2.7-1.2z"/>
    </svg>
  );

  // Render tree item (recursive for nested items)
  const renderTreeItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    const itemIsActive = item.path && isActive(item.path);

    return (
      <li 
        key={item.id} 
        className="slds-tree__item" 
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={level + 1}
        aria-selected={itemIsActive}
      >
        {hasChildren ? (
          <button 
            className={`slds-tree__item-content slds-tree__item-branch-btn`}
            style={{ paddingLeft: `${level * 1}rem` }}
            onClick={() => toggleSection(item.id)}
            aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
            type="button"
          >
            <span className="slds-tree__item-toggle-icon">
              <ChevronIcon expanded={isExpanded} />
            </span>
            <span className="slds-tree__item-label slds-tree__item-branch">{item.label}</span>
          </button>
        ) : (
          <button
            className={`slds-tree__item-content slds-tree__item-link ${itemIsActive ? 'slds-is-selected' : ''}`}
            style={{ paddingLeft: `${level * 1}rem` }}
            onClick={() => handleNavigate(item.path)}
            type="button"
          >
            <span className="slds-tree__item-label">{item.label}</span>
          </button>
        )}

        {hasChildren && (
          <ul 
            className={`slds-tree__group ${isExpanded ? 'slds-is-expanded' : 'slds-is-collapsed'}`} 
            role="group"
          >
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button 
        className="mobile-nav-toggle" 
        onClick={toggleMobile} 
        aria-expanded={mobileOpen} 
        aria-label="Toggle navigation"
        type="button"
      >
        <span className="hamburger" />
      </button>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && !isDesktop && (
        <div 
          className="nav-backdrop" 
          onClick={closeMobile}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* SLDS Tree Navigation - Rendered AFTER backdrop to be in front */}
      <nav 
        aria-label="Primary navigation" 
        className={`app-sidenav slds-tree-container ${mobileOpen && !isDesktop ? 'mobile-open' : ''}`}
      >
               
        <ul className="slds-tree" role="tree" aria-label="Site Navigation">
          {navTree.map(item => renderTreeItem(item))}
          
          {/* Logout - always at bottom */}
          {user && (
            <li className="slds-tree__item slds-tree__item--logout" role="treeitem" aria-level={1}>
              <button
                className="slds-tree__item-content slds-tree__item-link"
                onClick={() => { logout(); navigate('/login'); if (!isDesktop) setMobileOpen(false); }}
                type="button"
              >
                <span className="slds-tree__item-label">Logout</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export default Navigation;
