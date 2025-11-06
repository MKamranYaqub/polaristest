import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Content, Theme } from '@carbon/react';
import '@carbon/styles/css/styles.css';
import RatesTable from './components/RatesTable';
import CriteriaTable from './components/CriteriaTable';
import BTLCalculator from './components/BTL_Calculator';
import Calculator from './components/Calculator';
import Constants from './components/Constants';
import QuotesList from './components/QuotesList';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.scss';

function App() {
  return (
    <Router>
      <Theme theme="g10">
        <div className="app-shell">
          <header className="app-header">
            <h1 className="app-header__title">Project Polaris</h1>
          </header>
          <div className="app-layout">
            <Navigation />
            <Content className="app-content">
              <ErrorBoundary>
                <Routes>
                  <Route path="/rates" element={<RatesTable />} />
                  <Route path="/criteria" element={<CriteriaTable />} />
                  <Route path="/calculator" element={<Calculator />} />
                  <Route path="/quotes" element={<QuotesList />} />
                  <Route path="/constants" element={<Constants />} />
                  <Route path="/" element={<Navigate to="/rates" replace />} />
                </Routes>
              </ErrorBoundary>
            </Content>
          </div>
        </div>
      </Theme>
    </Router>
  );
}

export default App;
