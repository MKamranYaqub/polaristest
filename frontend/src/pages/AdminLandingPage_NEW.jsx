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
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
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
          background: 'rgba(100, 116, 139, 0.3)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        
        <div className="slds-p-vertical_x-large slds-p-horizontal_large" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="slds-grid slds-grid_align-spread slds-grid_vertical-align-center slds-wrap">
              <div>
                <div style={{ 
                  display: 'inline-block', 
                  background: 'rgba(232, 78, 15, 0.15)', 
                  padding: '6px 16px', 
                  borderRadius: '20px',
                  marginBottom: '1rem',
                  border: '1px solid rgba(232, 78, 15, 0.3)'
                }}>
                  <span style={{ color: '#E84E0F', fontSize: '0.8125rem', fontWeight: '600' }}>⚙️ SYSTEM ADMIN</span>
                </div>
                <h1 
                  className="slds-text-heading_large slds-m-bottom_small" 
                  style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1.2'
                  }}
                >
                  Administration Dashboard
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)', maxWidth: '600px' }}>
                  Configure lending criteria, manage rates, and control system settings from one central hub.
                </p>
              </div>
              
              <div className="slds-col slds-size_1-of-1 slds-medium-size_auto slds-m-top_medium slds-m-top_none@medium">
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Logged in as</div>
                  <div style={{ color: 'white', fontSize: '1rem', fontWeight: '600' }}>{user?.email || 'Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="slds-p-horizontal_large" style={{ maxWidth: '1400px', margin: '-40px auto 3rem', position: 'relative', zIndex: 10 }}>
        <div className="slds-grid slds-gutters slds-wrap">
          {systemMetrics.map((metric, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-2 slds-medium-size_1-of-4">
              <div 
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                <div className="slds-grid slds-grid_align-spread slds-m-bottom_small">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>{metric.label}</span>
                  <svg className="slds-icon slds-icon_x-small" aria-hidden="true" style={{ 
                    fill: metric.status === 'success' ? '#10b981' : metric.status === 'warning' ? '#f59e0b' : '#3b82f6' 
                  }}>
                    <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${metric.icon}`}></use>
                  </svg>
                </div>
                <div style={{ fontSize: '1.875rem', color: '#00205B', fontWeight: '700' }}>{metric.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Tools Grid */}
      <div className="slds-p-horizontal_large" style={{ maxWidth: '1400px', margin: '0 auto 4rem' }}>
        <div className="slds-m-bottom_large">
          <h2 style={{ fontSize: '1.5rem', color: '#00205B', fontWeight: '700', marginBottom: '0.5rem' }}>
            Configuration Tools
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Manage system settings, rates, and configurations
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {adminTools.map((tool) => (
            <div key={tool.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3 slds-m-bottom_large">
              <Link to={tool.link} className="slds-text-link_reset display-block height-100">
                <article 
                  className="height-100 transition-all"
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Gradient accent */}
                  <div style={{ background: tool.gradient, height: '5px' }} />
                  
                  <div className="slds-p-around_large">
                    <div className="slds-grid slds-grid_align-spread slds-m-bottom_medium">
                      <div 
                        style={{ 
                          background: `${tool.gradient}15`,
                          padding: '12px',
                          borderRadius: '10px',
                          display: 'inline-flex'
                        }}
                      >
                        <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: '#00205B' }}>
                          <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${tool.icon}`}></use>
                        </svg>
                      </div>
                      <div className="slds-text-align_right">
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500' }}>{tool.stats.label}</div>
                        <div style={{ fontSize: '1.25rem', color: '#00205B', fontWeight: '700' }}>{tool.stats.value}</div>
                      </div>
                    </div>
                    
                    <h2 className="slds-text-heading_small slds-m-bottom_small" style={{ color: '#00205B', fontWeight: '700' }}>
                      {tool.title}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                      {tool.description}
                    </p>
                  </div>
                  
                  <div className="slds-p-horizontal_large slds-p-bottom_medium">
                    <div 
                      className="slds-button width-100" 
                      style={{
                        background: 'transparent',
                        border: '2px solid #e5e7eb',
                        color: '#00205B',
                        fontWeight: '600',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#00205B';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#00205B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#00205B';
                        e.currentTarget.style.borderColor = '#e5e7eb';
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
