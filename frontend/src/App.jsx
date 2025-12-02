import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Content, Theme } from '@carbon/react';
import '@carbon/styles/css/styles.css';
import Calculator from './components/calculators/Calculator';
import BTLCalculator from './components/calculators/BTL_Calculator';
import BridgingCalculator from './components/calculators/BridgingCalculator';
import QuotesList from './components/calculators/QuotesList';
import AppShell from './components/layout/AppShell';
import Navigation from './components/layout/Navigation';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { 
  CalculatorErrorFallback, 
  QuotesErrorFallback 
} from './components/ui/ErrorFallbacks';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ToastProvider } from './contexts/ToastContext';
import AdminPage from './pages/AdminPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './pages/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import { isEmbeddedMode } from './utils/embedding';
import useHeaderColors from './hooks/useHeaderColors';
import './styles/index.scss';
import './styles/accessibility.css';
import './styles/utilities.css';

// AppContent component to use theme context
const AppContent = () => {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  
  // Load and apply header colors from Supabase
  useHeaderColors();
  
  // Add keyboard shortcut to clear cache (Ctrl+Shift+R or Cmd+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('Clearing cache...');
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        window.location.reload(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Public routes that shouldn't show navigation
  const isPublicRoute = ['/login', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  // Check if app is embedded (hides all navigation)
  const isEmbedded = isEmbeddedMode();
  
  // Show navigation only if NOT public route AND NOT embedded
  const showNavigation = !isPublicRoute && !isEmbedded;

  return (
    <Theme theme={resolvedTheme}>
      <UserProvider>
        <ErrorBoundary title="Application Error" message="The application encountered an unexpected error.">
          <AppShell>
            <div className="app-layout">
              {showNavigation && (
                <ErrorBoundary fallback={<div className="slds-p-around_medium">Navigation error</div>}>
                  <Navigation />
                </ErrorBoundary>
              )}
              
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
          </AppShell>
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
