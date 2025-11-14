import React from 'react';
import { Tooltip } from '@carbon/react';
import '../styles/help-icon.css';

/**
 * HelpIcon - Contextual help icon with tooltip
 * Shows a (?) icon that displays helpful information on hover/click
 * 
 * @param {string} content - The help text to display in tooltip
 * @param {string} align - Tooltip alignment: 'top' | 'bottom' | 'left' | 'right'
 * @param {string} label - Accessible label for the icon
 */
export default function HelpIcon({ content, align = 'top', label = 'Help information' }) {
  if (!content) return null;

  return (
    <Tooltip align={align} label={content}>
      <button 
        className="help-icon" 
        type="button"
        aria-label={label}
        tabIndex={0}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          fill="currentColor" 
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
        </svg>
      </button>
    </Tooltip>
  );
}
