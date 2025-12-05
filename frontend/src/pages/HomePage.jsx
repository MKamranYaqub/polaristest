import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('HomePage mounted');
  }, []);

  // Key Benefits - Simplified
  const benefits = [
    { icon: 'shield', title: 'FCA Regulated', color: '#10b981' },
    { icon: 'clock', title: '24hr DIP', color: '#3b82f6' },
    { icon: 'world', title: 'International', color: '#8b5cf6' },
    { icon: 'like', title: 'Complex Cases', color: '#ec4899' }
  ];

  // Calculator Products with Clear Links
  const calculators = [
    {
      name: 'Bridging Finance',
      description: 'Short-term loans £100k-£50m. Funds in 3-7 days.',
      icon: 'lightning',
      link: '/calculator/bridging',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      name: 'Buy-to-Let',
      description: 'BTL mortgages £150k-£3m per property.',
      icon: 'home',
      link: '/calculator/btl',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      name: 'Bridge-Fusion',
      description: 'Bridge now, refinance to BTL later.',
      icon: 'layers',
      link: '/calculator/bridging',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  return (
    <div className="slds-p-around_none" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      
      {/* HERO SECTION - Simplified */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #003d8f 50%, #E84E0F 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem 4rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            
            <h1 
              style={{ 
                fontSize: '3rem', 
                fontWeight: '700',
                color: 'white',
                lineHeight: '1.2',
                marginBottom: '2rem',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              Property Finance <span style={{ color: '#E84E0F' }}>Made Simple</span>
            </h1>
            
            <p 
              style={{ 
                fontSize: '1.125rem',
                fontWeight: '400',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.7',
                maxWidth: '700px',
                margin: '0 auto 3rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              Bridging loans and BTL mortgages from £100k to £50m. DIP in 24 hours.
            </p>
            
            {/* Primary CTA */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link 
                to="/calculator"
                className="slds-button slds-button_brand"
                style={{
                  background: '#E84E0F',
                  border: 'none',
                  padding: '14px 32px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(232,78,15,0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                Calculate Your Quote →
              </Link>
              {/* Products link removed */}
              <a 
                href="tel:+442070601234"
                className="slds-button"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  padding: '14px 32px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                📞 020 7060 1234
              </a>
            </div>
            
            {/* Trust Badges - Simplified */}
            <div className="slds-grid slds-gutters_medium slds-wrap slds-grid_align-center" style={{ marginTop: '2rem', maxWidth: '800px', margin: '0 auto' }}>
              {benefits.map((badge, i) => (
                <div key={i} className="slds-col" style={{ padding: '0.5rem', minWidth: '140px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    justifyContent: 'center'
                  }}>
                    <svg className="slds-icon slds-icon_xx-small" aria-hidden="true" style={{ fill: badge.color, flexShrink: 0 }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${badge.icon}`}></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', whiteSpace: 'nowrap' }}>{badge.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CALCULATORS SECTION - Clear Links */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff', padding: '5rem 2rem' }}>
        <div className="slds-text-align_center" style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', color: '#00205B', fontWeight: '700', marginBottom: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
            Choose Your Calculator
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Get instant quotes in 60 seconds. No obligation.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters_large slds-wrap" style={{ marginBottom: '3rem' }}>
          {calculators.map((calc, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
              <Link 
                to={calc.link}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '2px solid rgba(0,0,0,0.06)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = '#E84E0F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                  }}
                >
                  <div style={{ background: calc.gradient, height: '8px' }} />
                  <div style={{ padding: '2.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: calc.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0, 32, 91, 0.15)',
                      fontSize: '2rem'
                    }}>
                      {calc.name === 'Bridging Finance' && '⚡'}
                      {calc.name === 'Buy-to-Let' && '🏠'}
                      {calc.name === 'Bridge-Fusion' && '🔄'}
                    </div>
                    <h3 style={{ 
                      fontSize: '1.375rem', 
                      color: '#00205B', 
                      fontWeight: '600', 
                      marginBottom: '1rem',
                      lineHeight: '1.3',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                      {calc.name}
                    </h3>
                    <p style={{ 
                      fontSize: '0.9375rem', 
                      color: '#6b7280', 
                      lineHeight: '1.6',
                      marginBottom: '2rem',
                      flex: 1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                      {calc.description}
                    </p>
                    <div 
                      className="slds-button slds-button_brand"
                      style={{
                        background: '#E84E0F',
                        border: 'none',
                        padding: '12px 20px',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        textAlign: 'center',
                        color: 'white',
                        textTransform: 'none',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      Start Calculator →
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Calculator Link */}
        <div className="slds-text-align_center" style={{ marginTop: '3rem' }}>
          <p style={{ fontSize: '0.9375rem', color: '#6b7280', marginBottom: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Not sure which product? View all calculators
          </p>
          <Link 
            to="/calculator"
            className="slds-button slds-button_neutral"
            style={{
              padding: '12px 28px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              borderRadius: '6px',
              border: '2px solid #00205B',
              color: '#00205B',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              display: 'inline-block'
            }}
          >
            View All Calculators
          </Link>
        </div>
      </div>

      {/* WHY CHOOSE US - Condensed */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ backgroundColor: '#f8f9fb', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="slds-text-align_center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#00205B', fontWeight: '700', marginBottom: '0.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
              Why Choose MFS?
            </h2>
          </div>
          
          <div className="slds-grid slds-gutters_large slds-wrap">{[
              { icon: 'shield', title: 'FCA Regulated & Secure', desc: 'Fully authorised for your protection.', color: '#10b981' },
              { icon: 'clock', title: 'Lightning Fast', desc: 'DIP in 24 hours, funds in 3-7 days.', color: '#3b82f6' },
              { icon: 'world', title: 'International Experts', desc: 'Specialists in foreign nationals & expats.', color: '#8b5cf6' },
              { icon: 'like', title: 'Complex Cases Welcome', desc: 'We find solutions others won\'t.', color: '#ec4899' }
            ].map((item, idx) => (
              <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
                <div 
                  style={{
                    background: 'white',
                    padding: '2rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    height: '100%',
                    textAlign: 'center',
                    minHeight: '200px'
                  }}
                >
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      flexShrink: 0
                    }}
                  >
                    <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: item.color }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${item.icon}`}></use>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', color: '#00205B', fontWeight: '600', marginBottom: '0.75rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div 
        className="slds-p-horizontal_large slds-p-vertical_xx-large slds-text-align_center" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #E84E0F 100%)',
          color: 'white',
          padding: '4rem 2rem'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.25rem', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '1.0625rem', marginBottom: '2.5rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Get your quote in 60 seconds or speak to an expert now.
          </p>
          <div className="slds-grid slds-gutters_medium slds-wrap slds-grid_align-center">
            <div className="slds-col" style={{ marginBottom: '1rem' }}>
              <Link 
                to="/calculator"
                className="slds-button"
                style={{
                  background: '#E84E0F',
                  border: '2px solid white',
                  color: 'white',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  display: 'inline-block'
                }}
              >
                Get Your Quote
              </Link>
            </div>
            <div className="slds-col" style={{ marginBottom: '1rem' }}>
              <a 
                href="tel:+442070601234"
                className="slds-button"
                style={{
                  background: 'white',
                  border: 'none',
                  color: '#00205B',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  display: 'inline-block'
                }}
              >
                📞 Call Us Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - Simple */}
      <div className="slds-p-around_large slds-text-align_center" style={{ backgroundColor: '#00205B', color: 'rgba(255,255,255,0.8)', padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          © 2024 Market Financial Solutions. FCA Authorised and Regulated.
        </p>
        <p style={{ fontSize: '0.8125rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          Email: info@mfsuk.com | Phone: 020 7060 1234
        </p>
      </div>
    </div>
  );
};

export default HomePage;
