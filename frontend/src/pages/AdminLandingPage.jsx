import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLandingPage = () => {
  const { user } = useAuth();

  const adminTools = [
    {
      id: 'constants',
      title: 'App Constants',
      description: 'Manage global application constants, dropdown values, and system configuration.',
      icon: 'settings',
      link: '/admin/constants',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: { label: 'Active', value: '24' }
    },
    {
      id: 'criteria',
      title: 'BTL Criteria',
      description: 'Configure Buy-to-Let lending criteria, LTV limits, and stress test parameters.',
      icon: 'rules',
      link: '/admin/criteria',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      stats: { label: 'Rules', value: '48' }
    },
    {
      id: 'btl-rates',
      title: 'BTL Rates',
      description: 'Update interest rates, product tiers, and fee structures for BTL products.',
      icon: 'chart',
      link: '/admin/btl-rates',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stats: { label: 'Products', value: '32' }
    },
    {
      id: 'bridging-rates',
      title: 'Bridging Rates',
      description: 'Manage bridging loan rates, product codes, and pricing models.',
      icon: 'graph',
      link: '/admin/bridging-rates',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: { label: 'Rates', value: '28' }
    },
    {
      id: 'global-settings',
      title: 'Global Settings',
      description: 'Configure system-wide settings, feature toggles, and environment variables.',
      icon: 'world',
      link: '/admin/global-settings',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stats: { label: 'Configs', value: '16' }
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts, roles, permissions, and access levels.',
      icon: 'people',
      link: '/admin/users',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stats: { label: 'Users', value: '7' }
    }
  ];

  const systemMetrics = [
    { label: 'System Status', value: 'Operational', status: 'success', icon: 'success' },
    { label: 'Active Users', value: '7', status: 'info', icon: 'people' },
    { label: 'Quotes Today', value: '23', status: 'warning', icon: 'chart' },
    { label: 'API Health', value: '99.9%', status: 'success', icon: 'shield' }
  ];

  return (
    <div className="slds-p-around_none" style={{ backgroundColor: '#f8f9fb', minHeight: '100vh' }}>
      {/* Premium Admin Hero */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #003d8f 100%)',
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
                  <span style={{ color: '#E84E0F', fontSize: '0.875rem', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>⚙️ SYSTEM ADMIN</span>
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
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '0.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Logged in as</div>
                  <div style={{ color: 'white', fontSize: '1rem', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{user?.name || user?.email || 'Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div style={{ padding: '0 2rem', maxWidth: '1400px', margin: '-50px auto 4rem', position: 'relative', zIndex: 10 }}>
        <div className="slds-grid slds-gutters_large slds-wrap">
          {systemMetrics.map((metric, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-2 slds-medium-size_1-of-4" style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
              <div 
                style={{
                  background: 'white',
                  padding: '2rem 1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <div className="slds-grid slds-grid_align-spread" style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{metric.label}</span>
                  <svg className="slds-icon slds-icon_x-small" aria-hidden="true" style={{ 
                    fill: metric.status === 'success' ? '#10b981' : metric.status === 'warning' ? '#E84E0F' : '#00205B',
                    flexShrink: 0
                  }}>
                    <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${metric.icon}`}></use>
                  </svg>
                </div>
                <div style={{ fontSize: '2rem', color: '#00205B', fontWeight: '700', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{metric.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Tools Grid */}
      <div style={{ padding: '0 2rem', maxWidth: '1400px', margin: '0 auto 5rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#00205B', fontWeight: '600', marginBottom: '0.75rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
            Configuration Tools
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#6b7280', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Manage system settings, rates, and configurations
          </p>
        </div>
        
        <div className="slds-grid slds-gutters_large slds-wrap">
          {adminTools.map((tool) => (
            <div key={tool.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3" style={{ marginBottom: '2rem', padding: '0 0.75rem' }}>
              <Link to={tool.link} className="slds-text-link_reset display-block height-100">
                <article 
                  className="height-100 transition-all"
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 15px 45px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Gradient accent */}
                  <div style={{ background: tool.gradient, height: '6px' }} />
                  
                  <div style={{ padding: '2rem 1.75rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
                    <div className="slds-grid slds-grid_align-spread" style={{ marginBottom: '1.5rem' }}>
                      <div 
                        style={{ 
                          background: `${tool.gradient}15`,
                          padding: '12px',
                          borderRadius: '12px',
                          display: 'inline-flex'
                        }}
                      >
                        <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: '#00205B' }}>
                          <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${tool.icon}`}></use>
                        </svg>
                      </div>
                      <div className="slds-text-align_right">
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{tool.stats.label}</div>
                        <div style={{ fontSize: '1.375rem', color: '#00205B', fontWeight: '700', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{tool.stats.value}</div>
                      </div>
                    </div>
                    
                    <h2 style={{ fontSize: '1.25rem', color: '#00205B', fontWeight: '600', marginBottom: '0.75rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      {tool.title}
                    </h2>
                    <p style={{ fontSize: '0.9375rem', color: '#6b7280', lineHeight: '1.7', marginBottom: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      {tool.description}
                    </p>
                  </div>
                  
                  <div style={{ padding: '0 1.75rem 1.75rem', marginTop: 'auto' }}>
                    <div 
                      className="slds-button" 
                      style={{
                        background: 'linear-gradient(135deg, #00205B 0%, #003d8f 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '600',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        fontSize: '0.9375rem',
                        boxShadow: '0 4px 12px rgba(0, 32, 91, 0.3)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 32, 91, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 32, 91, 0.3)';
                      }}
                    >
                      Configure →
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
