import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';

export function EndInterviewDialog({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Interview?"
      subtitle="Are you sure you want to wrap up this practice session?"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={20} className="text-danger" style={{ flexShrink: 0 }} />
          <span>Your current progress, questions, and transcript will be scored and saved to your history.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onClose}>
            Continue Interview
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            End Interview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
