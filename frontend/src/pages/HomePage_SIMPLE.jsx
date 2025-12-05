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
      icon: 'event',
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
      icon: 'merge',
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
          overflow: 'hidden',
          minHeight: '500px'
        }}
      >
        <div className="slds-p-vertical_xx-large slds-p-horizontal_large slds-text-align_center" style={{ position: 'relative', zIndex: 1, paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <h1 
              style={{ 
                fontSize: '3.5rem', 
                fontWeight: '800',
                color: 'white',
                lineHeight: '1.1',
                marginBottom: '1.5rem',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '-0.5px'
              }}
            >
              Property Finance <span style={{ color: '#E84E0F' }}>Made Simple</span>
            </h1>
            
            <p 
              style={{ 
                fontSize: '1.25rem',
                fontWeight: '400',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.6',
                maxWidth: '700px',
                margin: '0 auto 2.5rem'
              }}
            >
              Bridging loans and BTL mortgages from £100k to £50m. DIP in 24 hours.
            </p>
            
            {/* Primary CTA */}
            <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center slds-m-bottom_large">
              <div className="slds-col">
                <Link 
                  to="/calculator"
                  className="slds-button slds-button_brand"
                  style={{
                    background: '#E84E0F',
                    border: 'none',
                    padding: '18px 40px',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(232,78,15,0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'none'
                  }}
                >
                  Calculate Your Quote →
                </Link>
              </div>
              <div className="slds-col">
                <a 
                  href="tel:+442070601234"
                  className="slds-button"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    padding: '18px 40px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    textTransform: 'none'
                  }}
                >
                  📞 020 7060 1234
                </a>
              </div>
            </div>
            
            {/* Trust Badges - Simplified */}
            <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center slds-m-top_large">
              {benefits.map((badge, i) => (
                <div key={i} className="slds-col" style={{ padding: '0 12px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <svg className="slds-icon slds-icon_xx-small" aria-hidden="true" style={{ fill: badge.color }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${badge.icon}`}></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>{badge.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CALCULATORS SECTION - Clear Links */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        <div className="slds-text-align_center slds-m-bottom_x-large">
          <h2 style={{ fontSize: '2.5rem', color: '#00205B', fontWeight: '800', marginBottom: '1rem' }}>
            Choose Your Calculator
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Get instant quotes in 60 seconds. No obligation.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {calculators.map((calc, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3 slds-m-bottom_large">
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
                  <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, rgba(232,78,15,0.1) 0%, rgba(0,32,91,0.1) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <svg className="slds-icon slds-icon_large" aria-hidden="true" style={{ fill: '#00205B' }}>
                        <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${calc.icon}`}></use>
                      </svg>
                    </div>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      color: '#00205B', 
                      fontWeight: '700', 
                      marginBottom: '0.75rem',
                      lineHeight: '1.2'
                    }}>
                      {calc.name}
                    </h3>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: '#6b7280', 
                      lineHeight: '1.6',
                      marginBottom: '1.5rem',
                      flex: 1
                    }}>
                      {calc.description}
                    </p>
                    <div 
                      className="slds-button slds-button_brand"
                      style={{
                        background: '#E84E0F',
                        border: 'none',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'white',
                        textTransform: 'none'
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
        <div className="slds-text-align_center slds-m-top_x-large">
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '1rem' }}>
            Not sure which product? View all calculators
          </p>
          <Link 
            to="/calculator"
            className="slds-button slds-button_neutral"
            style={{
              padding: '12px 32px',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: '2px solid #00205B',
              color: '#00205B'
            }}
          >
            View All Calculators
          </Link>
        </div>
      </div>

      {/* WHY CHOOSE US - Condensed */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ backgroundColor: '#f8f9fb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="slds-text-align_center slds-m-bottom_large">
            <h2 style={{ fontSize: '2.25rem', color: '#00205B', fontWeight: '800', marginBottom: '0.5rem' }}>
              Why Choose MFS?
            </h2>
          </div>
          
          <div className="slds-grid slds-gutters slds-wrap">
            {[
              { icon: 'shield', title: 'FCA Regulated & Secure', desc: 'Fully authorised for your protection.', color: '#10b981' },
              { icon: 'clock', title: 'Lightning Fast', desc: 'DIP in 24 hours, funds in 3-7 days.', color: '#3b82f6' },
              { icon: 'world', title: 'International Experts', desc: 'Specialists in foreign nationals & expats.', color: '#8b5cf6' },
              { icon: 'like', title: 'Complex Cases Welcome', desc: 'We find solutions others won\'t.', color: '#ec4899' }
            ].map((item, idx) => (
              <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4 slds-m-bottom_medium">
                <div 
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    height: '100%',
                    textAlign: 'center'
                  }}
                >
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}
                  >
                    <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: item.color }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${item.icon}`}></use>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', color: '#00205B', fontWeight: '700', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.9375rem', color: '#6b7280', lineHeight: '1.5' }}>
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
          color: 'white'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.9)' }}>
            Get your quote in 60 seconds or speak to an expert now.
          </p>
          <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center">
            <div className="slds-col">
              <Link 
                to="/calculator"
                className="slds-button"
                style={{
                  background: '#E84E0F',
                  border: '2px solid white',
                  color: 'white',
                  padding: '16px 36px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  textTransform: 'none'
                }}
              >
                Get Your Quote
              </Link>
            </div>
            <div className="slds-col">
              <a 
                href="tel:+442070601234"
                className="slds-button"
                style={{
                  background: 'white',
                  border: 'none',
                  color: '#00205B',
                  padding: '16px 36px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  textTransform: 'none'
                }}
              >
                📞 Call Us Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - Simple */}
      <div className="slds-p-around_large slds-text-align_center" style={{ backgroundColor: '#00205B', color: 'rgba(255,255,255,0.8)' }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          © 2024 Market Financial Solutions. FCA Authorised and Regulated.
        </p>
        <p style={{ fontSize: '0.8125rem' }}>
          Email: info@mfsuk.com | Phone: 020 7060 1234
        </p>
      </div>
    </div>
  );
};

export default HomePage;
