import React from 'react';
import { Link } from 'react-router-dom';

const CalculatorLandingPage = () => {
  const calculatorFeatures = [
    { icon: 'clock', title: 'Instant Results', desc: 'Get quotes in seconds' },
    { icon: 'shield', title: 'Accurate Rates', desc: 'Real-time pricing' },
    { icon: 'graph', title: 'Detailed Breakdown', desc: 'Full cost analysis' },
    { icon: 'file', title: 'Save & Export', desc: 'PDF generation' }
  ];

  const howItWorks = [
    { step: '1', title: 'Enter Details', desc: 'Property value, loan amount, and purpose', icon: 'edit' },
    { step: '2', title: 'View Options', desc: 'Compare rates across multiple products', icon: 'table' },
    { step: '3', title: 'Generate Quote', desc: 'Create professional PDF quotes instantly', icon: 'file' }
  ];

  return (
    <div className="slds-p-around_none" style={{ backgroundColor: '#f8f9fb', minHeight: '100vh' }}>
      {/* Premium Hero Section */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #003d8f 50%, #E84E0F 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'rgba(232, 78, 15, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />
        
        <div className="slds-p-vertical_xx-large slds-p-horizontal_large slds-text-align_center" style={{ position: 'relative', zIndex: 1, paddingBottom: '8rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ 
              display: 'inline-block', 
              background: 'rgba(232, 78, 15, 0.15)', 
              padding: '8px 20px', 
              borderRadius: '30px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(232, 78, 15, 0.3)'
            }}>
              <span style={{ color: '#E84E0F', fontSize: '0.875rem', fontWeight: '600' }}>🚀 SMART CALCULATORS</span>
            </div>
            
            <h1 
              className="slds-text-heading_large slds-m-bottom_medium" 
              style={{ 
                fontSize: '3.5rem', 
                fontWeight: '700',
                color: 'white',
                lineHeight: '1.1',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Property Finance Calculators
            </h1>
            <p 
              className="slds-text-heading_medium slds-m-bottom_large" 
              style={{ 
                fontSize: '1.25rem',
                fontWeight: '300',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.7',
                maxWidth: '700px',
                margin: '0 auto 2rem'
              }}
            >
              Bespoke bridging loans and buy-to-let mortgages for complex circumstances.
              Get instant, accurate quotes with our advanced calculators.
            </p>
            
            {/* Feature Pills */}
            <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center">
              {calculatorFeatures.map((feature, i) => (
                <div key={i} className="slds-col" style={{ padding: '0 6px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <svg className="slds-icon slds-icon_xx-small" aria-hidden="true" style={{ fill: '#E84E0F' }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${feature.icon}`}></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>{feature.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="slds-p-horizontal_large" style={{ maxWidth: '1400px', margin: '-80px auto 0', position: 'relative', zIndex: 10 }}>
        <div className="slds-grid slds-gutters slds-wrap justify-content-center">
          {/* BTL Calculator Card */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-m-bottom_large">
            <Link to="/calculator/btl" className="slds-text-link_reset display-block height-100">
              <article 
                className="slds-card height-100 transition-all"
                style={{ 
                  border: 'none', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: 'white',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '8px' }} />
                
                <div className="slds-p-around_large">
                  <div className="slds-media slds-m-bottom_medium">
                    <div className="slds-media__figure">
                      <span 
                        className="slds-icon_container" 
                        style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', padding: '14px', borderRadius: '14px' }}
                      >
                        <svg className="slds-icon slds-icon_large" aria-hidden="true" style={{ fill: '#00205B' }}>
                          <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#calculator"></use>
                        </svg>
                      </span>
                    </div>
                    <div className="slds-media__body slds-grid slds-grid_vertical-align-center">
                      <h2 className="slds-text-heading_medium" style={{ color: '#00205B', fontWeight: '700' }}>
                        Buy-to-Let Calculator
                      </h2>
                    </div>
                  </div>
                  
                  <p className="slds-m-bottom_medium" style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.7' }}>
                    Flexible buy-to-let mortgages designed to support both new and experienced landlords.
                    Ideal for complex circumstances including foreign nationals, expats, and offshore companies.
                  </p>
                  
                  <div className="slds-m-bottom_medium">
                    <ul className="slds-list_vertical slds-has-block-links_space">
                      {['Loan amounts from £150k to £3m per property', 'Up to 75% LTV', 'Deferred interest options', 'Bespoke underwriting'].map((item, i) => (
                        <li key={i} className="slds-item display-flex align-items-center slds-m-bottom_x-small">
                          <svg className="slds-icon slds-icon_x-small slds-m-right_small" aria-hidden="true" style={{ fill: '#10b981' }}>
                            <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                          </svg>
                          <span style={{ color: '#374151', fontSize: '0.9375rem' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="slds-p-horizontal_large slds-p-bottom_large">
                  <span 
                    className="slds-button slds-button_brand width-100" 
                    style={{ 
                      background: 'linear-gradient(135deg, #00205B 0%, #003d8f 100%)', 
                      borderColor: '#00205B',
                      height: '48px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0, 32, 91, 0.3)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Launch Calculator →
                  </span>
                </div>
              </article>
            </Link>
          </div>

          {/* Bridging Calculator Card */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-m-bottom_large">
            <Link to="/calculator/bridging" className="slds-text-link_reset display-block height-100">
              <article 
                className="slds-card height-100 transition-all"
                style={{ 
                  border: 'none', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: 'white',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', height: '8px' }} />
                
                <div className="slds-p-around_large">
                  <div className="slds-media slds-m-bottom_medium">
                    <div className="slds-media__figure">
                      <span 
                        className="slds-icon_container" 
                        style={{ background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)', padding: '14px', borderRadius: '14px' }}
                      >
                        <svg className="slds-icon slds-icon_large" aria-hidden="true" style={{ fill: '#00205B' }}>
                          <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#moneybag"></use>
                        </svg>
                      </span>
                    </div>
                    <div className="slds-media__body slds-grid slds-grid_vertical-align-center">
                      <h2 className="slds-text-heading_medium" style={{ color: '#00205B', fontWeight: '700' }}>
                        Bridging Calculator
                      </h2>
                    </div>
                  </div>
                  
                  <p className="slds-m-bottom_medium" style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.7' }}>
                    Fast, flexible bridging finance for residential and commercial properties.
                    We can issue funds in as little as 3 days to help you seize opportunities.
                  </p>
                  
                  <div className="slds-m-bottom_medium">
                    <ul className="slds-list_vertical slds-has-block-links_space">
                      {['Loans from £100k to £50m', 'Up to 75% LTV', 'Residential & Commercial', 'Auction & Refurbishment'].map((item, i) => (
                        <li key={i} className="slds-item display-flex align-items-center slds-m-bottom_x-small">
                          <svg className="slds-icon slds-icon_x-small slds-m-right_small" aria-hidden="true" style={{ fill: '#10b981' }}>
                            <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                          </svg>
                          <span style={{ color: '#374151', fontSize: '0.9375rem' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="slds-p-horizontal_large slds-p-bottom_large">
                  <span 
                    className="slds-button slds-button_brand width-100" 
                    style={{ 
                      background: 'linear-gradient(135deg, #E84E0F 0%, #d13a00 100%)', 
                      borderColor: '#E84E0F',
                      height: '48px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(232, 78, 15, 0.3)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Launch Calculator →
                  </span>
                </div>
              </article>
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="slds-m-top_xx-large">
          <div className="slds-text-align_center slds-m-bottom_x-large">
            <h2 style={{ fontSize: '2.25rem', color: '#00205B', fontWeight: '700', marginBottom: '1rem' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Simple, fast, accurate — get professional quotes in 3 easy steps
            </p>
          </div>
          
          <div className="slds-grid slds-gutters slds-wrap" style={{ marginBottom: '4rem' }}>
            {howItWorks.map((step, idx) => (
              <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3" style={{ position: 'relative' }}>
                <div className="slds-text-align_center slds-p-around_large">
                  <div style={{
                    width: '90px',
                    height: '90px',
                    margin: '0 auto 1.5rem',
                    background: 'linear-gradient(135deg, #00205B 0%, #E84E0F 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 40px rgba(0,32,91,0.25)',
                    position: 'relative'
                  }}>
                    <svg className="slds-icon slds-icon_medium" aria-hidden="true" style={{ fill: 'white' }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${step.icon}`}></use>
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: '#E84E0F',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(232,78,15,0.4)'
                    }}>{step.step}</div>
                  </div>
                  <h3 style={{ fontSize: '1.375rem', color: '#00205B', fontWeight: '700', marginBottom: '0.75rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div 
          className="slds-m-vertical_xx-large slds-text-align_center slds-p-around_x-large"
          style={{
            background: 'linear-gradient(135deg, #00205B 0%, #003d8f 100%)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,32,91,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(232, 78, 15, 0.2)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: '700', marginBottom: '1rem' }}>
              Need Expert Advice?
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
              Our dedicated underwriters are available to discuss complex cases and provide bespoke solutions tailored to your circumstances.
            </p>
            <div className="slds-grid slds-gutters slds-wrap slds-grid_align-center">
              <div className="slds-col">
                <a 
                  href="mailto:info@mfsuk.com" 
                  className="slds-button slds-button_neutral"
                  style={{
                    background: 'white',
                    color: '#00205B',
                    fontWeight: '600',
                    padding: '16px 36px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: 'none'
                  }}
                >
                  📧 info@mfsuk.com
                </a>
              </div>
              <div className="slds-col">
                <a 
                  href="tel:+442070601234" 
                  className="slds-button"
                  style={{
                    background: '#E84E0F',
                    color: 'white',
                    fontWeight: '600',
                    padding: '16px 36px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(232,78,15,0.4)'
                  }}
                >
                  📞 +44 (0)20 7060 1234
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorLandingPage;
