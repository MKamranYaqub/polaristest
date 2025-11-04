import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RatesTable from './components/RatesTable';
import CriteriaTable from './components/CriteriaTable';
import BTLcalculator from './components/BTL_Calculator';
import Constants from './components/Constants';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/slds.css';
import './styles/rates.css';
import './styles/auth.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>Mortgage Configuration Management</h1>
          <Navigation />
        </header>
        <main>
          <ErrorBoundary>
            <Routes>
              <Route path="/rates" element={<RatesTable />} />
              <Route path="/criteria" element={<CriteriaTable />} />
              <Route path="/calculator" element={<BTLcalculator />} />
              <Route path="/constants" element={<Constants />} />
              <Route path="/" element={<Navigate to="/rates" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;