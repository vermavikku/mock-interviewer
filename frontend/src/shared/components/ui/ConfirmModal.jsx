import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, LogOut } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  icon: Icon = AlertTriangle,
  isLoading = false,
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            color: isDanger ? '#f87171' : '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            border: isDanger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Icon size={26} />
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
          {title}
        </h3>

        <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              color: '#ffffff',
            }}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
