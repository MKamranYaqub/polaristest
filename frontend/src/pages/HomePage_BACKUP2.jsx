import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('HomePage mounted');
  }, []);

  // Key Benefits
  const benefits = [
    {
      icon: 'shield',
      title: 'FCA Regulated',
      description: 'Fully authorised and regulated for your protection.',
      color: '#10b981'
    },
    {
      icon: 'clock',
      title: 'Fast Decisions',
      description: 'DIP within 24 hours, funds in 3-7 days.',
      color: '#3b82f6'
    },
    {
      icon: 'world',
      title: 'International Expertise',
      description: 'Specialists in foreign nationals and expats.',
      color: '#8b5cf6'
    },
    {
      icon: 'like',
      title: 'Complex Cases',
      description: 'We find solutions others won\'t.',
      color: '#ec4899'
    }
  ];

  // Calculator Products - Main CTAs
  const calculators = [
    {
      name: 'Bridging Finance',
      tagline: 'Fast property finance',
      description: 'Short-term loans £100k-£50m. Funds in 3-7 days.',
      icon: 'event',
      link: '/calculator/bridging',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: ['Up to 75% LTV', '3-7 day funds', 'Regulated & unregulated']
    },
    {
      name: 'Buy-to-Let',
      tagline: 'Portfolio mortgages',
      description: 'BTL mortgages £150k-£3m per property.',
      icon: 'home',
      link: '/calculator/btl',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      features: ['Up to 75% LTV', 'Foreign nationals', 'Portfolio landlords']
    },
    {
      name: 'Bridge-Fusion',
      tagline: 'Hybrid solution',
      description: 'Bridge now, refinance to BTL later.',
      icon: 'merge',
      link: '/calculator/bridging',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      features: ['Best of both', 'No exit fees', 'Flexible transition']
    }
  ];

  // Trust Badges
  const trustBadges = [
    { icon: 'shield', text: 'FCA Authorised' },
    { icon: 'lock', text: '£500m+ Funded' },
    { icon: 'success', text: '24hr DIP' }
  ];

  return (
    <div className="slds-p-around_none" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      
      {/* =========================== */}
      {/* HERO SECTION */}
      {/* =========================== */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #003d8f 50%, #E84E0F 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '600px'
        }}
      >
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'rgba(232, 78, 15, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          filter: 'blur(120px)'
        }} />
        
        <div className="slds-p-vertical_xx-large slds-p-horizontal_large slds-text-align_center" style={{ position: 'relative', zIndex: 1, paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Badge */}
            <div style={{ 
              display: 'inline-block', 
              background: 'rgba(232, 78, 15, 0.2)', 
              padding: '10px 24px', 
              borderRadius: '30px',
              marginBottom: '2rem',
              border: '1px solid rgba(232, 78, 15, 0.4)'
            }}>
              <span style={{ color: '#ffffff', fontSize: '0.9375rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                🏆 MARKET FINANCIAL SOLUTIONS
              </span>
            </div>
            
            {/* Main Headline */}
            <h1 
              style={{ 
                fontSize: '3.75rem', 
                fontWeight: '800',
                color: 'white',
                lineHeight: '1.1',
                marginBottom: '1.5rem',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '-0.5px'
              }}
            >
              Property Finance That
              <br />
              <span style={{ color: '#E84E0F' }}>Moves at Your Speed</span>
            </h1>
            
            {/* Subheadline */}
            <p 
              style={{ 
                fontSize: '1.375rem',
                fontWeight: '300',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.7',
                maxWidth: '800px',
                margin: '0 auto 2.5rem'
              }}
            >
              Bespoke bridging loans and buy-to-let mortgages from <strong>£100k to £50m</strong>.
              <br />
              Specialist in complex cases, foreign nationals, and time-sensitive deals.
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(232,78,15,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,78,15,0.4)';
                  }}
                >
                  Get Your Quote in 60 Seconds →
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                >
                  📞 Speak to an Expert
                </a>
              </div>
            </div>
            
            {/* Trust Badges Row */}
            <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center slds-m-top_x-large">
              {trustBadges.map((badge, i) => (
                <div key={i} className="slds-col" style={{ padding: '0 12px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <svg className="slds-icon slds-icon_xx-small" aria-hidden="true" style={{ fill: '#10b981' }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${badge.icon}`}></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: '0.9375rem', fontWeight: '600' }}>{badge.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================== */}
      {/* WHY CHOOSE US SECTION */}
      {/* =========================== */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8f9fb' }}>
        <div className="slds-text-align_center slds-m-bottom_x-large">
          <h2 style={{ fontSize: '2.75rem', color: '#00205B', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
            Why Choose Market Financial Solutions?
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            We're not just another lender. We're specialists who understand complex property finance.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {whyChooseUs.map((item, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3 slds-m-bottom_large">
              <div 
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  height: '100%',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                }}
              >
                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}
                >
                  <svg className="slds-icon slds-icon_medium" aria-hidden="true" style={{ fill: item.color }}>
                    <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${item.icon}`}></use>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.375rem', color: '#00205B', fontWeight: '700', marginBottom: '0.75rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.7' }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================== */}
      {/* CALCULATOR SHOWCASE CTA */}
      {/* =========================== */}
      <div 
        className="slds-p-horizontal_large slds-p-vertical_xx-large" 
        style={{ 
          background: 'linear-gradient(135deg, #00205B 0%, #003d8f 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'rgba(232, 78, 15, 0.1)',
          borderRadius: '50%',
          filter: 'blur(150px)'
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="slds-grid slds-gutters slds-wrap slds-grid_vertical-align-center">
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
              <h2 style={{ fontSize: '2.5rem', color: 'white', fontWeight: '800', marginBottom: '1.5rem', lineHeight: '1.2' }}>
                Get an Instant Quote with Our Smart Calculators
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', marginBottom: '2rem' }}>
                No guesswork. No waiting. Enter your property details and get accurate, 
                real-time pricing in under 60 seconds. Save quotes, generate PDFs, and submit applications—all online.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                {['Instant rate calculations', 'Compare multiple products', 'Professional PDF quotes', 'Save & track applications'].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <svg className="slds-icon slds-icon_small slds-m-right_small" aria-hidden="true" style={{ fill: '#10b981' }}>
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: '1.0625rem', fontWeight: '500' }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/calculator"
                className="slds-button"
                style={{
                  background: '#E84E0F',
                  border: 'none',
                  color: 'white',
                  padding: '16px 36px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  boxShadow: '0 6px 20px rgba(232,78,15,0.4)',
                  textTransform: 'none'
                }}
              >
                Try Our Calculator Now →
              </Link>
            </div>
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-m-top_large slds-m-top_none@medium">
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <svg className="slds-icon slds-icon_large slds-m-bottom_medium" aria-hidden="true" style={{ fill: '#E84E0F', width: '80px', height: '80px' }}>
                    <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#calculator"></use>
                  </svg>
                  <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>60s</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>Average Quote Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================== */}
      {/* PRODUCT SUMMARY SECTIONS */}
      {/* =========================== */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        <div className="slds-text-align_center slds-m-bottom_x-large">
          <h2 style={{ fontSize: '2.75rem', color: '#00205B', fontWeight: '800', marginBottom: '1rem' }}>
            Our Property Finance Products
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            From short-term bridging to long-term BTL, we have the solution for your property investment.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {products.map((product, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-large-size_1-of-3 slds-m-bottom_large">
              <div 
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ background: product.gradient, height: '8px' }} />
                
                <div style={{ padding: '2rem', flex: 1 }}>
                  <div 
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '18px',
                      background: `${product.gradient}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <svg className="slds-icon slds-icon_large" aria-hidden="true" style={{ fill: '#00205B' }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${product.icon}`}></use>
                    </svg>
                  </div>
                  
                  <h3 style={{ fontSize: '1.75rem', color: '#00205B', fontWeight: '700', marginBottom: '0.5rem' }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#E84E0F', fontWeight: '600', marginBottom: '1rem' }}>
                    {product.tagline}
                  </p>
                  <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                    {product.description}
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                    {product.features.map((feature, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <svg className="slds-icon slds-icon_x-small slds-m-right_small" aria-hidden="true" style={{ fill: '#10b981' }}>
                          <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                        </svg>
                        <span style={{ color: '#374151', fontSize: '0.9375rem' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ padding: '0 2rem 2rem 2rem' }}>
                  <Link 
                    to={product.link}
                    className="slds-button width-100"
                    style={{
                      background: '#00205B',
                      border: 'none',
                      color: 'white',
                      padding: '14px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textTransform: 'none'
                    }}
                  >
                    Calculate {product.name} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================== */}
      {/* HOW IT WORKS SECTION */}
      {/* =========================== */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8f9fb' }}>
        <div className="slds-text-align_center slds-m-bottom_x-large">
          <h2 style={{ fontSize: '2.75rem', color: '#00205B', fontWeight: '800', marginBottom: '1rem' }}>
            How It Works
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            From enquiry to funding in 4 simple steps. Fast, transparent, and hassle-free.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {howItWorks.map((step, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4 slds-m-bottom_large">
              <div style={{ position: 'relative', textAlign: 'center', padding: '2rem 1rem' }}>
                {/* Step Number Circle */}
                <div style={{
                  width: '100px',
                  height: '100px',
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
                    top: '-12px',
                    right: '-12px',
                    background: '#E84E0F',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    fontWeight: '800',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(232,78,15,0.4)',
                    border: '3px solid #f8f9fb'
                  }}>{step.step}</div>
                </div>
                
                <h3 style={{ fontSize: '1.375rem', color: '#00205B', fontWeight: '700', marginBottom: '0.75rem' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>
                  {step.description}
                </p>
                
                {/* Connector Arrow (hide on last item and mobile) */}
                {idx < howItWorks.length - 1 && (
                  <div className="slds-hide slds-show_large" style={{
                    position: 'absolute',
                    top: '50px',
                    right: '-30px',
                    fontSize: '2.5rem',
                    color: '#E84E0F',
                    fontWeight: '700'
                  }}>→</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================== */}
      {/* TESTIMONIALS SECTION */}
      {/* =========================== */}
      <div className="slds-p-horizontal_large slds-p-vertical_xx-large" style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        <div className="slds-text-align_center slds-m-bottom_x-large">
          <h2 style={{ fontSize: '2.75rem', color: '#00205B', fontWeight: '800', marginBottom: '1rem' }}>
            Trusted by Property Professionals
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            Don't just take our word for it. Here's what our clients say.
          </p>
        </div>
        
        <div className="slds-grid slds-gutters slds-wrap">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3 slds-m-bottom_large">
              <div 
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '2px solid #f3f4f6',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Star Rating */}
                <div style={{ marginBottom: '1rem' }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} style={{ color: '#fbbf24', fontSize: '1.25rem', marginRight: '2px' }}>★</span>
                  ))}
                </div>
                
                {/* Quote */}
                <p style={{ 
                  fontSize: '1.0625rem', 
                  color: '#374151', 
                  lineHeight: '1.7', 
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                  flex: 1
                }}>
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: '700', color: '#00205B', marginBottom: '0.25rem' }}>
                    {testimonial.author}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================== */}
      {/* CONTACT/ENQUIRY FORM SECTION */}
      {/* =========================== */}
      <div 
        className="slds-p-horizontal_large slds-p-vertical_xx-large" 
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
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
          background: 'rgba(232, 78, 15, 0.2)',
          borderRadius: '50%',
          filter: 'blur(100px)'
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="slds-grid slds-gutters slds-wrap">
            {/* Left Column - Info */}
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-m-bottom_large slds-m-bottom_none@medium">
              <h2 style={{ fontSize: '2.5rem', color: 'white', fontWeight: '800', marginBottom: '1.5rem', lineHeight: '1.2' }}>
                Ready to Get Started?
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', marginBottom: '2.5rem' }}>
                Speak to our expert underwriters today. We're here to help with your property finance needs, 
                no matter how complex.
              </p>
              
              {/* Contact Details */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(232,78,15,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem'
                  }}>
                    <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: '#E84E0F' }}>
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#phone"></use>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Call Us</div>
                    <a href="tel:+442070601234" style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', textDecoration: 'none' }}>
                      +44 (0)20 7060 1234
                    </a>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(232,78,15,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem'
                  }}>
                    <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: '#E84E0F' }}>
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#email"></use>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email Us</div>
                    <a href="mailto:info@mfsuk.com" style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', textDecoration: 'none' }}>
                      info@mfsuk.com
                    </a>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(232,78,15,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem'
                  }}>
                    <svg className="slds-icon slds-icon_small" aria-hidden="true" style={{ fill: '#E84E0F' }}>
                      <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#clock"></use>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Business Hours</div>
                    <div style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600' }}>
                      Mon-Fri: 9am-6pm
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Form */}
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
              <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ fontSize: '1.5rem', color: '#00205B', fontWeight: '700', marginBottom: '1.5rem' }}>
                  Get a Callback
                </h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="name" style={{ fontWeight: '600', color: '#374151' }}>
                      Your Name *
                    </label>
                    <input 
                      type="text" 
                      id="name"
                      required
                      className="slds-input" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{ borderRadius: '8px', border: '2px solid #e5e7eb', padding: '12px' }}
                    />
                  </div>
                  
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="email" style={{ fontWeight: '600', color: '#374151' }}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      id="email"
                      required
                      className="slds-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{ borderRadius: '8px', border: '2px solid #e5e7eb', padding: '12px' }}
                    />
                  </div>
                  
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="phone" style={{ fontWeight: '600', color: '#374151' }}>
                      Phone Number *
                    </label>
                    <input 
                      type="tel" 
                      id="phone"
                      required
                      className="slds-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      style={{ borderRadius: '8px', border: '2px solid #e5e7eb', padding: '12px' }}
                    />
                  </div>
                  
                  <div className="slds-form-element slds-m-bottom_medium">
                    <label className="slds-form-element__label" htmlFor="message" style={{ fontWeight: '600', color: '#374151' }}>
                      How Can We Help?
                    </label>
                    <textarea 
                      id="message"
                      className="slds-textarea"
                      rows="4"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      style={{ borderRadius: '8px', border: '2px solid #e5e7eb', padding: '12px' }}
                      placeholder="Tell us about your property finance requirements..."
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="slds-button slds-button_brand width-100"
                    style={{
                      background: '#E84E0F',
                      border: 'none',
                      padding: '16px',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(232,78,15,0.3)',
                      marginTop: '1rem'
                    }}
                  >
                    Request Callback →
                  </button>
                  
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center' }}>
                    We'll respond within 24 hours on business days.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================== */}
      {/* FOOTER WITH NAVIGATION */}
      {/* =========================== */}
      <div 
        className="slds-p-horizontal_large slds-p-vertical_large" 
        style={{ 
          background: '#00205B',
          borderTop: '4px solid #E84E0F'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="slds-grid slds-gutters slds-wrap">
            {/* Column 1 - About */}
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_large">
              <h4 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>
                Market Financial Solutions
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                Specialist lender for bridging finance and buy-to-let mortgages. FCA authorised and regulated.
              </p>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                FRN: 123456
              </div>
            </div>
            
            {/* Column 2 - Products */}
            <div className="slds-col slds-size_1-of-2 slds-medium-size_1-of-4 slds-m-bottom_large">
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
                Our Products
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Bridging Finance', 'Buy-to-Let Mortgages', 'Bridge-Fusion', 'Development Finance'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.75rem' }}>
                    <a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', textDecoration: 'none', transition: 'color 0.2s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#E84E0F'}
                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 3 - Resources */}
            <div className="slds-col slds-size_1-of-2 slds-medium-size_1-of-4 slds-m-bottom_large">
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
                Resources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['BTL Calculator', 'Bridging Calculator', 'Case Studies', 'FAQs', 'Contact Us'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.75rem' }}>
                    <a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', textDecoration: 'none', transition: 'color 0.2s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#E84E0F'}
                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 4 - Legal */}
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_large">
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
                Legal
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Privacy Policy', 'Terms & Conditions', 'Cookie Policy', 'Complaints Procedure'].map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.75rem' }}>
                    <a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', textDecoration: 'none', transition: 'color 0.2s' }}
                       onMouseEnter={(e) => e.currentTarget.style.color = '#E84E0F'}
                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              © 2025 Market Financial Solutions. All rights reserved. | Authorised and regulated by the Financial Conduct Authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
