import React, { useEffect } from 'react';
import '../styles/Modal.css';

// ModalShell: reusable modal framing component
// Props:
// - isOpen: boolean
// - onClose: fn
// - title: string (header title)
// - children: modal body
// - footer: optional JSX for footer area (buttons)
// - maxWidth / maxHeight optional styling overrides
export default function ModalShell({ isOpen, onClose, title, children, footer, maxWidth = '800px', maxHeight = '90vh' }) {
  // Add Escape key listener to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Keep backdrop inert (clicks won't close modal) — close via Esc key or footer buttons
    <div className="modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, maxHeight, overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ background: 'var(--token-brand-header)', padding: 'var(--token-spacing-lg) var(--token-spacing-xl)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--token-font-size-lg)', fontWeight: 700, color: 'var(--token-text-inverse)' }}>{title}</h2>
        </div>

        <div className="modal-body" style={{ padding: 'var(--token-spacing-lg) var(--token-spacing-xl)' }}>
          {children}
        </div>

        <div className="modal-footer" style={{ padding: 'var(--token-spacing-md) var(--token-spacing-xl)', borderTop: '1px solid var(--token-ui-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--token-spacing-sm)', background: 'var(--token-ui-background-neutral)' }}>
          {footer}
        </div>
      </div>
    </div>
  );
}
