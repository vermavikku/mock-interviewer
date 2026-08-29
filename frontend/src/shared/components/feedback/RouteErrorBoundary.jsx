import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('Route error caught:', error);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0F19',
        color: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h2 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
          Something went wrong
        </h2>

        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="secondary" icon={RotateCcw} onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button variant="gradient" icon={Home} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
