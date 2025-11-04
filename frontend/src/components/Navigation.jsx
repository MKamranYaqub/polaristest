import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';
import '../styles/navigation.scss';

const navItems = [
  { label: 'BTL Calculator', path: '/calculator' },
  { label: 'Manage Rates', path: '/rates' },
  { label: 'Manage Criteria', path: '/criteria' },
  { label: 'Constants', path: '/constants' }
];

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <SideNav aria-label="Primary navigation" expanded isChildOfHeader={false} className="app-sidenav">
      <SideNavItems>
        {navItems.map((item) => (
          <SideNavLink
            key={item.path}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
}

export default Navigation;
