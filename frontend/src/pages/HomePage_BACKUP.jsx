import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('HomePage mounted');
  }, []);

  const cards = [
    {
      title: 'BTL Calculator',
      description: 'Calculate Buy-to-Let mortgages with our advanced calculator.',
      icon: 'utility:calculator',
      link: '/calculator/btl',
      color: 'slds-theme_success'
    },
    {
      title: 'Bridging Calculator',
      description: 'Quickly estimate bridging loans and generate quotes.',
      icon: 'utility:moneybag',
      link: '/calculator/bridging',
      color: 'slds-theme_warning'
    },
    {
      title: 'Saved Quotes',
      description: 'View and manage your saved quotes and applications.',
      icon: 'utility:quote',
      link: '/quotes',
      color: 'slds-theme_info'
    }
  ];

  // Mock recent activity - in a real app this would come from an API
  const recentActivity = [
    { id: 1, action: 'Created new BTL Quote', target: 'Ref: Q-2023-001', date: 'Today, 10:23 AM', icon: 'utility:add' },
    { id: 2, action: 'Updated Client Details', target: 'Smith Application', date: 'Yesterday, 4:15 PM', icon: 'utility:edit' },
    { id: 3, action: 'Generated DIP', target: 'Ref: D-2023-089', date: 'Yesterday, 2:30 PM', icon: 'utility:file' },
  ];

  return (
    <div className="slds-p-around_none">
      {/* Welcome Header - Hero Style */}
      <div 
        className="slds-p-around_xx-large slds-text-align_center" 
        style={{ 
          background: 'var(--mfs-brand-navy, #00205B)', 
          color: 'white',
          marginBottom: '2rem'
        }}
      >
        <h1 className="slds-text-heading_large font-weight-300 slds-m-bottom_medium">
          Market Financial Solutions
        </h1>
        <p className="slds-text-heading_medium font-weight-300 max-width-900 margin-auto text-color-white-semi">
          Welcome back, {user?.email || 'User'}. What would you like to do today?
        </p>
      </div>

      <div className="slds-p-horizontal_large max-width-1200 margin-auto">
        {/* Quick Actions Cards */}
        <div className="slds-grid slds-gutters slds-wrap justify-content-center">
          {cards.map((card, index) => (
            <div key={index} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3 slds-m-bottom_large">
              <Link to={card.link} className="slds-text-link_reset display-block height-100">
                <article className="slds-card slds-card_boundary height-100 hover-shadow transition-all border-radius-4 overflow-hidden display-flex flex-direction-column">
                  <div className="slds-p-around_medium border-bottom-gray bg-white flex-1">
                    <header className="slds-media slds-media_center slds-m-bottom_small">
                      <div className="slds-media__figure">
                        <span className={`slds-icon_container ${card.color}`} title={card.title}>
                          <svg className="slds-icon slds-icon_large" aria-hidden="true">
                            <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${card.icon.split(':')[1]}`}></use>
                          </svg>
                        </span>
                      </div>
                      <div className="slds-media__body">
                        <h2 className="slds-text-heading_medium font-weight-600 text-color-heading">
                          {card.title}
                        </h2>
                      </div>
                    </header>
                    <p className="text-color-gray font-size-0875rem">
                      {card.description}
                    </p>
                  </div>
                  <footer className="slds-card__footer slds-text-align_right slds-p-vertical_x-small slds-p-horizontal_medium background-gray-light border-top-gray">
                    <span className="slds-text-link font-size-0875rem font-weight-600">Open</span>
                  </footer>
                </article>
              </Link>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="slds-m-top_large slds-m-bottom_xx-large">
          <article className="slds-card slds-card_boundary border-radius-4 overflow-hidden">
            <div className="slds-card__header slds-grid slds-p-around_medium border-bottom-gray background-gray-light">
              <header className="slds-media slds-media_center slds-has-flexi-truncate">
                <div className="slds-media__figure">
                  <span className="slds-icon_container slds-icon-standard-recent" title="Recent Activity">
                    <svg className="slds-icon slds-icon_small" aria-hidden="true">
                      <use xlinkHref="/assets/icons/standard-sprite/svg/symbols.svg#recent"></use>
                    </svg>
                    <span className="slds-assistive-text">Recent Activity</span>
                  </span>
                </div>
                <div className="slds-media__body">
                  <h2 className="slds-card__header-title">
                    <span className="slds-text-heading_small font-weight-600">Recent Activity</span>
                  </h2>
                </div>
              </header>
            </div>
            <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
              <ul className="slds-timeline">
                {recentActivity.map((item) => (
                  <li key={item.id} className="slds-timeline__item">
                    <div className="slds-media">
                      <div className="slds-media__figure">
                        <div className="slds-icon_container slds-icon-standard-task slds-timeline__icon" title="task">
                          <svg className="slds-icon slds-icon_small" aria-hidden="true">
                            <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${item.icon.split(':')[1]}`}></use>
                          </svg>
                        </div>
                      </div>
                      <div className="slds-media__body">
                        <div className="slds-grid slds-grid_align-spread slds-timeline__trigger">
                          <div className="slds-grid slds-grid_vertical-align-center slds-truncate_container_75 slds-no-space">
                            <h3 className="slds-truncate" title={item.action}>
                              <strong>{item.action}</strong> - {item.target}
                            </h3>
                          </div>
                          <div className="slds-timeline__actions slds-timeline__actions_inline">
                            <p className="slds-timeline__date text-color-gray">{item.date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <footer className="slds-card__footer slds-p-around_small border-top-gray text-align-center">
              <Link to="/quotes" className="slds-button slds-button_neutral">View All Activity</Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
