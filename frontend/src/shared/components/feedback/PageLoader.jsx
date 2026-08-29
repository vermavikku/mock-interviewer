import React from 'react';
import { Sparkles } from 'lucide-react';

export function PageLoader({ text = 'Preparing AI session...' }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--grad-ai)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)',
        animation: 'float 3s ease-in-out infinite'
      }}>
        <Sparkles size={28} />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
}

export function PageError({ title = 'Error', message = 'Unable to load content.', onRetry }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)'
    }}>
      <h3 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
