import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem } from '@carbon/react';
import { useUser } from '../contexts/UserContext';
import '../styles/navigation.scss';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  const isAdmin = user && user.name && user.name.toLowerCase() === 'admin';

  const calculatorItems = [
    { label: 'BTL Calculator', path: '/calculator/btl' },
    { label: 'Bridging Calculator', path: '/calculator/bridging' }
  ];

  const adminItems = [
    { label: 'Constants', path: '/admin/constants' },
    { label: 'BTL Criteria', path: '/admin/criteria' },
    { label: 'BTL Rates', path: '/admin/btl-rates' },
    { label: 'Bridging Rates', path: '/admin/bridging-rates' }
  ];

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 900;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = () => setMobileOpen(v => !v);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile toggle button - visible via CSS on small screens */}
      <button className="mobile-nav-toggle" onClick={toggleMobile} aria-expanded={mobileOpen} aria-label="Toggle navigation">
        <span className="hamburger" />
      </button>

      {/* Backdrop overlay - click to close */}
      {mobileOpen && !isDesktop && (
        <div className="nav-backdrop" onClick={closeMobile} />
      )}

      <SideNav
        aria-label="Primary navigation"
        expanded={isDesktop || mobileOpen}
        isChildOfHeader={false}
        className={`app-sidenav ${mobileOpen ? 'mobile-open' : 'mobile-closed'}`}
      >
        <SideNavItems>
          <SideNavMenu 
            title="Calculator"
            defaultExpanded={location.pathname.startsWith('/calculator')}
          >
            {calculatorItems.map((item) => (
              <SideNavMenuItem
                key={item.path}
                isActive={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  // close on mobile after navigation
                  if (!isDesktop) {
                    setMobileOpen(false);
                  }
                }}
              >
                {item.label}
              </SideNavMenuItem>
            ))}
          </SideNavMenu>

          <SideNavLink
            isActive={location.pathname === '/quotes'}
            onClick={() => {
              navigate('/quotes');
              // close on mobile after navigation
              if (!isDesktop) {
                setMobileOpen(false);
              }
            }}
          >
            Quotes
          </SideNavLink>
          
          {isAdmin && (
            <SideNavMenu 
              title="Admin"
              defaultExpanded={location.pathname.startsWith('/admin')}
            >
              {adminItems.map((item) => (
                <SideNavMenuItem
                  key={item.path}
                  isActive={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    // close on mobile after navigation
                    if (!isDesktop) {
                      setMobileOpen(false);
                    }
                  }}
                >
                  {item.label}
                </SideNavMenuItem>
              ))}
            </SideNavMenu>
          )}
        </SideNavItems>
      </SideNav>
    </>
  );
}

export default Navigation;
