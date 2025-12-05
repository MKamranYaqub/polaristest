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
      icon: 'utility:settings',
      link: '/admin/constants',
      color: 'slds-theme_alt-inverse'
    },
    {
      id: 'criteria',
      title: 'BTL Criteria',
      description: 'Configure Buy-to-Let lending criteria, LTV limits, and stress test parameters.',
      icon: 'utility:rules',
      link: '/admin/criteria',
      color: 'slds-theme_success'
    },
    {
      id: 'btl-rates',
      title: 'BTL Rates',
      description: 'Update interest rates, product tiers, and fee structures for BTL products.',
      icon: 'utility:chart',
      link: '/admin/btl-rates',
      color: 'slds-theme_warning'
    },
    {
      id: 'bridging-rates',
      title: 'Bridging Rates',
      description: 'Manage bridging loan rates, product codes, and pricing models.',
      icon: 'utility:graph',
      link: '/admin/bridging-rates',
      color: 'slds-theme_error'
    },
    {
      id: 'global-settings',
      title: 'Global Settings',
      description: 'Configure system-wide settings, feature toggles, and environment variables.',
      icon: 'utility:world',
      link: '/admin/global-settings',
      color: 'slds-theme_info'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts, roles, permissions, and access levels.',
      icon: 'utility:people',
      link: '/admin/users',
      color: 'slds-theme_offline'
    }
  ];

  return (
    <div className="slds-p-around_none">
      {/* Hero Section */}
      <div 
        className="slds-p-around_xx-large slds-text-align_center" 
        style={{ 
          background: 'var(--token-layer-surface, #f3f3f3)', 
          borderBottom: '1px solid #dddbda',
          marginBottom: '2rem'
        }}
      >
        <h1 className="slds-text-heading_large font-weight-300 slds-m-bottom_medium text-color-heading">
          System Administration
        </h1>
        <p className="slds-text-heading_medium font-weight-300 max-width-900 margin-auto text-color-body">
          Configure lending criteria, manage rates, and control system settings.
        </p>
      </div>

      <div className="slds-p-horizontal_large max-width-1200 margin-auto">
        <div className="slds-grid slds-gutters slds-wrap">
          {adminTools.map((tool) => (
            <div key={tool.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3 slds-m-bottom_large">
              <Link to={tool.link} className="slds-text-link_reset display-block height-100">
                <article className="slds-card slds-card_boundary height-100 hover-shadow transition-all border-radius-4 overflow-hidden display-flex flex-direction-column">
                  <div className="slds-p-around_medium border-bottom-gray bg-white flex-1">
                    <header className="slds-media slds-media_center slds-m-bottom_small">
                      <div className="slds-media__figure">
                        <span className={`slds-icon_container ${tool.color}`} title={tool.title}>
                          <svg className="slds-icon slds-icon_small" aria-hidden="true">
                            <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${tool.icon.split(':')[1]}`}></use>
                          </svg>
                        </span>
                      </div>
                      <div className="slds-media__body">
                        <h2 className="slds-text-heading_small font-weight-600 text-color-heading">
                          {tool.title}
                        </h2>
                      </div>
                    </header>
                    <p className="text-color-gray font-size-0875rem">
                      {tool.description}
                    </p>
                  </div>
                  <footer className="slds-card__footer slds-text-align_right slds-p-vertical_x-small slds-p-horizontal_medium background-gray-light border-top-gray">
                    <span className="slds-text-link font-size-0875rem font-weight-600">Configure</span>
                  </footer>
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
