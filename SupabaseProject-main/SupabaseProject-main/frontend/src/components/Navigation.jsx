import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/slds.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="slds-p-around_medium">
      <div className="slds-grid slds-grid_vertical-align-center slds-nav-vertical">
        <Link
          to="/calculator"
          className={`slds-nav-vertical__action ${location.pathname === '/calculator' ? 'active' : ''}`}
        >
          BTL Calculator
        </Link>
        <Link
          to="/rates"
          className={`slds-nav-vertical__action ${location.pathname === '/rates' ? 'active' : ''}`}
        >
          Manage Rates
        </Link>
        <Link
          to="/criteria"
          className={`slds-nav-vertical__action ${location.pathname === '/criteria' ? 'active' : ''}`}
        >
          Manage Criteria
        </Link>
        <Link
          to="/constants"
          className={`slds-nav-vertical__action ${location.pathname === '/constants' ? 'active' : ''}`}
        >
          Constants
        </Link>
        
      </div>
    </nav>
  );
}

export default Navigation;