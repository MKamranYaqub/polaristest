import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomePage.css';

const HomePage = () => {
  const { user } = useAuth();

  const calculators = [
    {
      name: 'Bridging Finance',
      description: 'Short-term loans £100k-£50m. Funds in 3-7 days.',
      icon: 'lightning',
      link: '/calculator/bridging'
    },
    {
      name: 'Buy-to-Let',
      description: 'BTL mortgages £150k-£3m per property.',
      icon: 'home',
      link: '/calculator/btl'
    },
    {
      name: 'Bridge-Fusion',
      description: 'Bridge now, refinance to BTL later.',
      icon: 'layers',
      link: '/calculator/bridging'
    }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content-wrapper">
          <div className="hero-content-center">
            <h1 className="hero-title">
              Market Financial Solutions<br />
              <span className="hero-subtitle">Property Finance <span className="hero-subtitle-accent">Made Simple</span></span>
            </h1>

            <p className="hero-description">
              Bridging loans and BTL mortgages from £100k to £50m. DIP in 24 hours.
            </p>

            <div className="hero-cta-container">
              <Link to="/calculator" className="cta-button-primary slds-button">
                Calculate Your Quote
              </Link>
              <a href="tel:+442070601234" className="cta-button-secondary slds-button">
                020 7060 1234
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="calculators-section slds-p-horizontal_medium slds-p-vertical_large">
        <div className="section-header">
          <h2 className="section-title">Choose Your Calculator</h2>
          <p className="section-description">Get instant quotes in 60 seconds. No obligation.</p>
        </div>

        <div className="calculators-grid slds-grid slds-gutters_medium slds-wrap slds-grid_align-center">
          {calculators.map((calc, idx) => (
            <div key={idx} className="calculator-card-container slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
              <Link to={calc.link} className="calculator-card-link">
                <div className="calculator-card">
                  <div className="calculator-icon-wrapper">
                    {calc.name === 'Bridging Finance' && '⚡'}
                    {calc.name === 'Buy-to-Let' && '🏠'}
                    {calc.name === 'Bridge-Fusion' && '🔄'}
                  </div>
                  <h3 className="calculator-card-title">{calc.name}</h3>
                  <p className="calculator-card-description">{calc.description}</p>
                  <div className="calculator-card-cta">
                    Start Calculator <span>→</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="view-all-container">
          <Link to="/calculator" className="view-all-button slds-button">
            View All Calculators
          </Link>
        </div>
      </div>

      <div className="why-choose-section slds-p-horizontal_medium slds-p-vertical_large">
        <div className="why-choose-container">
          <div className="why-choose-header slds-text-align_center">
            <h2 className="why-choose-title">Why Choose MFS?</h2>
          </div>

          <div className="slds-grid slds-gutters_medium slds-wrap">
            {[
              { icon: 'shield', title: 'FCA Regulated', desc: 'Fully authorised for your protection.' },
              { icon: 'clock', title: 'Lightning Fast', desc: 'DIP in 24 hours, funds in 3-7 days.' },
              { icon: 'world', title: 'International', desc: 'Specialists in foreign nationals & expats.' },
              { icon: 'like', title: 'Complex Cases', desc: 'We find solutions others won\'t.' }
            ].map((item, idx) => (
              <div key={idx} className="benefit-card-container slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg className="benefit-icon-svg slds-icon slds-icon_small" aria-hidden="true">
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${item.icon}`}></use>
                    </svg>
                  </div>
                  <h3 className="benefit-card-title">{item.title}</h3>
                  <p className="benefit-card-description">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cta-section slds-p-horizontal_medium slds-p-vertical_large slds-text-align_center">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <div className="slds-grid slds-gutters_small slds-wrap slds-grid_align-center">
            <div className="slds-col">
              <Link to="/calculator" className="cta-button slds-button">
                Get Your Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-section slds-p-around_medium slds-text-align_center">
        <p className="footer-text">
          © 2024 Market Financial Solutions. FCA Authorised and Regulated.
        </p>
        <p className="footer-text-last">
          Email: info@mfsuk.com | Phone: 020 7060 1234
        </p>
      </div>
    </div>
  );
};

export default HomePage;
