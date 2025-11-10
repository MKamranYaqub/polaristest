import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Content, Theme } from '@carbon/react';
import '@carbon/styles/css/styles.css';
import Calculator from './components/Calculator';
import QuotesList from './components/QuotesList';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  CalculatorErrorFallback, 
  QuotesErrorFallback 
} from './components/ErrorFallbacks';
import { UserProvider } from './contexts/UserContext';
import UserNamePrompt from './components/UserNamePrompt';
import UserProfileButton from './components/UserProfileButton';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './pages/ProtectedRoute';
import './styles/index.scss';

function App() {
  return (
    <Router>
      <Theme theme="g10">
        <UserProvider>
          <ErrorBoundary title="Application Error" message="The application encountered an unexpected error.">
            <UserNamePrompt />
            <div className="app-shell">
              <header className="app-header">
                <h1 className="app-header__title">Project Polaris</h1>
                <div style={{ marginLeft: 'auto', marginRight: '1rem' }}>
                  <UserProfileButton />
                </div>
              </header>
              <div className="app-layout">
                <ErrorBoundary fallback={<div className="slds-p-around_medium">Navigation error</div>}>
                  <Navigation />
                </ErrorBoundary>
                
                <Content className="app-content">
                <Routes>
                  {/* Calculator with specialized error handling */}
                  <Route 
                    path="/calculator" 
                    element={
                      <ErrorBoundary fallback={CalculatorErrorFallback}>
                        <Calculator />
                      </ErrorBoundary>
                    } 
                  />
                  
                  {/* Quotes list with specialized error handling */}
                  <Route 
                    path="/quotes" 
                    element={
                      <ErrorBoundary fallback={QuotesErrorFallback}>
                        <QuotesList />
                      </ErrorBoundary>
                    } 
                  />
                  
                  {/* Admin section with protected route */}
                  <Route path="/admin" element={<ProtectedRoute />}>
                    <Route 
                      index 
                      element={
                        <ErrorBoundary>
                          <AdminPage />
                        </ErrorBoundary>
                      } 
                    />
                  </Route>
                  
                  <Route path="/" element={<Navigate to="/calculator" replace />} />
                </Routes>
              </Content>
            </div>
          </div>
        </ErrorBoundary>
      </UserProvider>
      </Theme>
    </Router>
  );
}

export default App;
