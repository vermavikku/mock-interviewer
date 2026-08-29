import React from 'react';
import { AuthProvider } from '../shared/context/AuthContext';
import { ToastProvider } from '../shared/context/ToastContext';
import { InterviewProvider } from '../shared/context/InterviewContext';
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary';

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <InterviewProvider>
            {children}
          </InterviewProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
