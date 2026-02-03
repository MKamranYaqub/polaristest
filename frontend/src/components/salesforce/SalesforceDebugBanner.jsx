import React from 'react';
import PropTypes from 'prop-types';
import { getSalesforceParams } from '../../utils/embedding';
import './SalesforceDebugBanner.scss';

/**
 * Debug banner that displays Salesforce parameters when embedded
 * Shows Opportunity ID, User, Org, and embedded mode status
 */
function SalesforceDebugBanner({ show = true }) {
  const sfParams = getSalesforceParams();
  
  // Only show if we have Salesforce parameters and show prop is true
  if (!show || !sfParams.opportunityId) {
    return null;
  }

  return (
    <div className="salesforce-debug-banner">
      <div className="salesforce-debug-banner__content">
        <span className="salesforce-debug-banner__icon">🔗</span>
        <div className="salesforce-debug-banner__info">
          <strong>Salesforce Integration Active</strong>
          <div className="salesforce-debug-banner__details">
            <span className="salesforce-debug-banner__param">
              <strong>Opportunity ID:</strong> {sfParams.opportunityId}
            </span>
            {sfParams.stage && (
              <span className="salesforce-debug-banner__param">
                <strong>Stage:</strong> {sfParams.stage}
              </span>
            )}
            {sfParams.userName && (
              <span className="salesforce-debug-banner__param">
                <strong>User:</strong> {sfParams.userName}
              </span>
            )}
            {sfParams.orgId && (
              <span className="salesforce-debug-banner__param">
                <strong>Org ID:</strong> {sfParams.orgId.substring(0, 15)}...
              </span>
            )}
            <span className="salesforce-debug-banner__param">
              <strong>Mode:</strong> {sfParams.embedded === 'canvas' ? 'Canvas' : sfParams.embedded ? 'Embedded' : 'Direct'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

SalesforceDebugBanner.propTypes = {
  show: PropTypes.bool,
};

export default SalesforceDebugBanner;
