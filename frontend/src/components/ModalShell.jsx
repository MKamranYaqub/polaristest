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
        <div className="modal-header" style={{ background: '#2e5aac', padding: '1rem 1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffffff' }}>{title}</h2>
        </div>

        <div className="modal-body" style={{ padding: '1rem 1.25rem' }}>
          {children}
        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e0e6ed', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#f4f6f9' }}>
          {footer}
        </div>
      </div>
    </div>
  );
}
