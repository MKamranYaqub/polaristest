import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Content, Theme } from '@carbon/react';
import '@carbon/styles/css/styles.css';
import Calculator from './components/Calculator';
import BTLCalculator from './components/BTL_Calculator';
import BridgingCalculator from './components/BridgingCalculator';
import QuotesList from './components/QuotesList';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  CalculatorErrorFallback, 
  QuotesErrorFallback 
} from './components/ErrorFallbacks';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ToastProvider } from './contexts/ToastContext';
import UserProfileButton from './components/UserProfileButton';
import ThemeToggle from './components/ThemeToggle';
import AdminPage from './pages/AdminPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './pages/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import './styles/index.scss';
import './styles/accessibility.css';
import './styles/utilities.css';

// AppContent component to use theme context
const AppContent = () => {
  const { resolvedTheme } = useTheme();

  return (
    <Theme theme={resolvedTheme}>
      <UserProvider>
        <ErrorBoundary title="Application Error" message="The application encountered an unexpected error.">
          <div className="app-shell">
          <header className="app-header">
            <h1 className="app-header__title">Project Polaris</h1>
            <div className="margin-left-auto display-flex align-items-center flex-gap-5 margin-right-05">
              <ThemeToggle />
              <UserProfileButton />
            </div>
          </header>
          <div className="app-layout">
            <ErrorBoundary fallback={<div className="slds-p-around_medium">Navigation error</div>}>
              <Navigation />
            </ErrorBoundary>
            
            <Content className="app-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Settings - Protected route accessible to all authenticated users */}
              <Route path="/settings" element={<ProtectedRoute requiredAccessLevel={5} />}>
                <Route 
                  index
                  element={
                    <ErrorBoundary>
                      <SettingsPage />
                    </ErrorBoundary>
                  } 
                />
              </Route>
              
              {/* Protected calculator routes - require authentication */}
              <Route path="/calculator" element={<ProtectedRoute requiredAccessLevel={5} />}>
                <Route 
                  path="btl" 
                  element={
                    <ErrorBoundary fallback={CalculatorErrorFallback}>
                      <BTLCalculator />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="bridging" 
                  element={
                    <ErrorBoundary fallback={CalculatorErrorFallback}>
                      <BridgingCalculator />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  index 
                  element={<Navigate to="/calculator/btl" replace />} 
                />
              </Route>
              
              {/* Protected quotes list - require authentication */}
              <Route path="/quotes" element={<ProtectedRoute requiredAccessLevel={5} />}>
                <Route 
                  index
                  element={
                    <ErrorBoundary fallback={QuotesErrorFallback}>
                      <QuotesList />
                    </ErrorBoundary>
                  } 
                />
              </Route>
              
              {/* Admin section with protected route - requires access level 1-5 except 4 (Underwriter) */}
              <Route path="/admin" element={<ProtectedRoute requiredAccessLevel={5} allowedAccessLevels={[1, 2, 3, 5]} />}>
                <Route 
                  path="constants" 
                  element={
                    <ErrorBoundary>
                      <AdminPage tab="constants" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="criteria" 
                  element={
                    <ErrorBoundary>
                      <AdminPage tab="criteria" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="btl-rates" 
                  element={
                    <ErrorBoundary>
                      <AdminPage tab="btlRates" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="bridging-rates" 
                  element={
                    <ErrorBoundary>
                      <AdminPage tab="bridgingRates" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="global-settings" 
                  element={
                    <ErrorBoundary>
                      <AdminPage tab="globalSettings" />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  index 
                  element={<Navigate to="/admin/constants" replace />} 
                />
              </Route>
              
              {/* User management - Admin only (access level 1) */}
              <Route path="/admin/users" element={<ProtectedRoute requiredAccessLevel={1} allowedAccessLevels={[1]} />}>
                <Route 
                  index
                  element={
                    <ErrorBoundary>
                      <UsersPage />
                    </ErrorBoundary>
                  } 
                />
              </Route>
              
              <Route path="/" element={<Navigate to="/calculator/btl" replace />} />
            </Routes>
          </Content>
        </div>
        </div>
      </ErrorBoundary>
    </UserProvider>
    </Theme>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}export default App;
