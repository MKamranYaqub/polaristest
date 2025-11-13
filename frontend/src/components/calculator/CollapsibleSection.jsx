import React from 'react';
import '../../styles/Calculator.scss';

/**
 * Collapsible section component used throughout calculator UIs
 * Provides consistent expand/collapse behavior with chevron animation
 * 
 * @param {string} title - Section header title
 * @param {boolean} expanded - Whether section is expanded
 * @param {function} onToggle - Callback when header is clicked
 * @param {React.ReactNode} children - Section content
 */
export default function CollapsibleSection({ title, expanded, onToggle, children }) {
  return (
    <section className="collapsible-section">
      <header className="collapsible-header" onClick={onToggle}>
        <h2 className="header-title">{title}</h2>
        <svg 
          className={`chevron-icon ${expanded ? 'expanded' : ''}`} 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </header>
      <div className={`collapsible-body ${!expanded ? 'collapsed' : ''}`}>
        {children}
      </div>
    </section>
  );
}
