import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
          <button className="confirm-modal-close" onClick={onCancel} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={isDestructive ? 'btn-confirm-destructive' : 'btn-confirm'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
