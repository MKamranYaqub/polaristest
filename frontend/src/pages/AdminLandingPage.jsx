import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import PropTypes from 'prop-types';

// Loading skeleton component for professional loading state
const SkeletonPulse = ({ width = '48px', height = '24px' }) => (
  <div 
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, var(--token-layer-02, #e0e0e0) 25%, var(--token-layer-01, #f0f0f0) 50%, var(--token-layer-02, #e0e0e0) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px'
    }}
  />
);

SkeletonPulse.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string
};

const AdminLandingPage = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  
  // Dynamic stats state
  const [stats, setStats] = useState({
    users: 0,
    btlRates: 0,
    bridgingRates: 0,
    quotesToday: 0,
    supportRequests: 0,
    criteriaRules: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dynamic stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      if (!supabase) {
        console.warn('Supabase client not available');
        setError('Database connection unavailable');
        setLoading(false);
        return;
      }
      
      try {
        // Get today's date at midnight for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        // Fetch all counts in parallel
        const [
          usersResult, 
          btlRatesResult, 
          bridgingRatesResult, 
          btlQuotesResult,
          bridgeQuotesResult,
          supportResult, 
          criteriaResult
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('rates_flat').select('*', { count: 'exact', head: true }),
          supabase.from('bridge_fusion_rates_full').select('*', { count: 'exact', head: true }),
          supabase.from('quotes').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
          supabase.from('bridge_quotes').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
          supabase.from('support_requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'pending']),
          supabase.from('criteria_config_flat').select('*', { count: 'exact', head: true })
        ]);
        
        // Log any errors for debugging
        const results = { usersResult, btlRatesResult, bridgingRatesResult, btlQuotesResult, bridgeQuotesResult, supportResult, criteriaResult };
        Object.entries(results).forEach(([key, result]) => {
          if (result.error) {
            console.error(`Error fetching ${key}:`, result.error.message);
          }
        });
        
        // Calculate combined quotes today
        const btlToday = btlQuotesResult.count || 0;
        const bridgeToday = bridgeQuotesResult.count || 0;
        
        setStats({
          users: usersResult.count || 0,
          btlRates: btlRatesResult.count || 0,
          bridgingRates: bridgingRatesResult.count || 0,
          quotesToday: btlToday + bridgeToday,
          supportRequests: supportResult.count || 0,
          criteriaRules: criteriaResult.count || 0
        });
        
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [supabase]);

  const adminTools = [
    {
      id: 'constants',
      title: 'App Constants',
      description: 'Manage global application constants, dropdown values, and system configuration.',
      icon: 'settings',
      link: '/admin/constants',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: { label: 'Active', value: '24', isStatic: true }
    },
    {
      id: 'criteria',
      title: 'BTL Criteria',
      description: 'Configure Buy-to-Let lending criteria, LTV limits, and stress test parameters.',
      icon: 'rules',
      link: '/admin/criteria',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      stats: { label: 'Rules', value: stats.criteriaRules }
    },
    {
      id: 'btl-rates',
      title: 'BTL Rates',
      description: 'Update interest rates, product tiers, and fee structures for BTL products.',
      icon: 'chart',
      link: '/admin/btl-rates',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stats: { label: 'Products', value: stats.btlRates }
    },
    {
      id: 'bridging-rates',
      title: 'Bridging Rates',
      description: 'Manage bridging loan rates, product codes, and pricing models.',
      icon: 'graph',
      link: '/admin/bridging-rates',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: { label: 'Rates', value: stats.bridgingRates }
    },
    {
      id: 'global-settings',
      title: 'Global Settings',
      description: 'Configure system-wide settings, feature toggles, and environment variables.',
      icon: 'world',
      link: '/admin/global-settings',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stats: { label: 'Configs', value: '16', isStatic: true }
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts, roles, permissions, and access levels.',
      icon: 'people',
      link: '/admin/users',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stats: { label: 'Users', value: stats.users }
    },
    {
      id: 'support',
      title: 'Support Requests',
      description: 'View and manage user support requests, bug reports, and suggestions.',
      icon: 'question',
      link: '/admin/support-requests',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      stats: { label: 'Open', value: stats.supportRequests, highlight: stats.supportRequests > 0 }
    }
  ];

  const systemMetrics = [
    { label: 'System Status', value: 'Operational', status: 'success', icon: 'success' },
    { label: 'Active Users', value: stats.users, status: 'info', icon: 'people' },
    { label: 'Quotes Today', value: stats.quotesToday, status: 'warning', icon: 'chart' },
    { label: 'API Health', value: '99.9%', status: 'success', icon: 'shield' }
  ];

  return (
    <div className="page-container">
      {/* Premium Admin Hero */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          background: 'rgba(232, 78, 15, 0.2)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />
        
        <div style={{ padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="slds-grid slds-grid_align-spread slds-grid_vertical-align-center slds-wrap">
              <div>
                <div style={{ 
                  display: 'inline-block', 
                  background: 'rgba(232, 78, 15, 0.15)', 
                  padding: '8px 20px', 
                  borderRadius: '30px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(232, 78, 15, 0.3)'
                }}>
                  <span style={{ color: 'var(--token-color-brand-orange)', fontSize: 'var(--token-font-size-sm)', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>⚙️ SYSTEM ADMIN</span>
                </div>
                <h1 
                  style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '600',
                    color: 'white',
                    lineHeight: '1.2',
                    marginBottom: '1rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Administration Dashboard
                </h1>
                <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Configure lending criteria, manage rates, and control system settings from one central hub.
                </p>
              </div>
              
              <div className="slds-col slds-size_1-of-1 slds-medium-size_auto" style={{ marginTop: '2rem' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem 2rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--token-font-size-sm)', marginBottom: '0.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Logged in as</div>
                  <div style={{ color: 'white', fontSize: 'var(--token-font-size-md)', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{user?.name || user?.email || 'Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div style={{ padding: '0 2rem', maxWidth: '1400px', margin: '-50px auto 4rem', position: 'relative', zIndex: 10 }}>
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .metric-card {
              background: var(--token-layer-surface, white);
              padding: 1.75rem 1.5rem;
              border-radius: var(--token-radius-md, 12px);
              box-shadow: 0 4px 24px rgba(0,0,0,0.06);
              border: 1px solid var(--token-border-subtle, rgba(0,0,0,0.06));
              transition: all 0.25s ease;
            }
            .metric-card:hover {
              box-shadow: 0 8px 32px rgba(0,0,0,0.10);
              transform: translateY(-2px);
            }
            .dark-mode .metric-card,
            :root[data-carbon-theme="g100"] .metric-card {
              background: var(--token-layer-02, #262626);
              border-color: var(--token-border-subtle, rgba(255,255,255,0.1));
            }
          `}
        </style>
        <div className="slds-grid slds-gutters_large slds-wrap">
          {systemMetrics.map((metric, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-2 slds-medium-size_1-of-4" style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
              <div className="metric-card">
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.8125rem', 
                    color: 'var(--token-text-secondary)', 
                    fontWeight: '500', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                  }}>
                    {metric.label}
                  </span>
                </div>
                <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                  {loading ? (
                    <SkeletonPulse width="60px" height="32px" />
                  ) : (
                    <span style={{ 
                      fontSize: '1.875rem', 
                      color: 'var(--token-text-primary, var(--token-color-brand-navy))', 
                      fontWeight: '700', 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      lineHeight: '1'
                    }}>
                      {metric.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '8px', 
            color: '#ef4444',
            fontSize: '0.875rem',
            marginTop: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Admin Tools Grid */}
      <div style={{ padding: '0 2rem', maxWidth: '1400px', margin: '0 auto 5rem' }}>
        <style>
          {`
            .admin-tool-card {
              background: var(--token-layer-surface, white);
              border-radius: var(--token-radius-md, 12px);
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
              border: 1px solid var(--token-border-subtle, rgba(0,0,0,0.06));
              transform: translateY(0);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            .admin-tool-card:hover {
              transform: translateY(-8px);
              box-shadow: 0 20px 50px rgba(0,0,0,0.12);
            }
            .dark-mode .admin-tool-card,
            :root[data-carbon-theme="g100"] .admin-tool-card {
              background: var(--token-layer-02, #262626);
              border-color: var(--token-border-subtle, rgba(255,255,255,0.1));
            }
            .admin-tool-btn {
              background: linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 100%);
              border: none;
              color: white;
              font-weight: 600;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              transition: all 0.2s ease;
              width: 100%;
              font-size: 0.875rem;
              box-shadow: 0 4px 12px rgba(0, 32, 91, 0.25);
              cursor: pointer;
            }
            .admin-tool-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0, 32, 91, 0.35);
            }
          `}
        </style>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: 'var(--token-text-primary, var(--token-color-brand-navy))', 
            fontWeight: '600', 
            marginBottom: '0.5rem', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
            letterSpacing: '-0.01em' 
          }}>
            Configuration Tools
          </h2>
          <p style={{ 
            fontSize: '0.9375rem', 
            color: 'var(--token-text-secondary)', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
          }}>
            Manage system settings, rates, and configurations
          </p>
        </div>
        
        <div className="slds-grid slds-gutters_large slds-wrap">
          {adminTools.map((tool) => (
            <div key={tool.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3" style={{ marginBottom: '1.5rem', padding: '0 0.75rem' }}>
              <Link to={tool.link} className="slds-text-link_reset" style={{ display: 'block', height: '100%' }}>
                <article className="admin-tool-card">
                  {/* Gradient accent bar */}
                  <div style={{ background: tool.gradient, height: '4px' }} />
                  
                  <div style={{ padding: '1.5rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
                    <div className="slds-grid slds-grid_align-end" style={{ marginBottom: '1rem' }}>
                      <div className="slds-text-align_right">
                        <div style={{ 
                          fontSize: '0.6875rem', 
                          color: 'var(--token-text-helper)', 
                          fontWeight: '500', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '2px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                        }}>
                          {tool.stats.label}
                        </div>
                        <div style={{ minWidth: '40px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {loading && !tool.stats.isStatic ? (
                            <SkeletonPulse width="36px" height="24px" />
                          ) : (
                            <span style={{ 
                              fontSize: '1.25rem', 
                              color: tool.stats.highlight ? '#ef4444' : 'var(--token-text-primary, var(--token-color-brand-navy))', 
                              fontWeight: '700', 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                            }}>
                              {tool.stats.value}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '1.0625rem', 
                      color: 'var(--token-text-primary, var(--token-color-brand-navy))', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem', 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    }}>
                      {tool.title}
                    </h3>
                    <p style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--token-text-secondary)', 
                      lineHeight: '1.6', 
                      marginBottom: '1.25rem',
                      flex: '1',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    }}>
                      {tool.description}
                    </p>
                    
                    <div className="admin-tool-btn">
                      Configure
                      <svg style={{ marginLeft: '6px', width: '14px', height: '14px', fill: 'white' }} viewBox="0 0 20 20">
                        <path d="M7.05 4.05a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L11.44 10 7.05 5.61a.75.75 0 010-1.06z" />
                      </svg>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLandingPage;

