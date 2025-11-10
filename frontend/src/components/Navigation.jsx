import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';
import { useUser } from '../contexts/UserContext';
import '../styles/navigation.scss';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  const isAdmin = user && user.name && user.name.toLowerCase() === 'admin';

  const navItems = [
    { label: 'Calculator', path: '/calculator' },
    { label: 'Quotes', path: '/quotes' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin' });
  }

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
          {navItems.map((item) => (
            <SideNavLink
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
            </SideNavLink>
          ))}
        </SideNavItems>
      </SideNav>
    </>
  );
}

export default Navigation;
