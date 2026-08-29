import React from 'react';
import { cn } from '../../utils/cn';
import './PageWrapper.css';

export function PageWrapper({ children, className = '', maxWidth = '1280px' }) {
  return (
    <div className={cn('page-wrapper animate-fade-in', className)} style={{ maxWidth }}>
      {children}
    </div>
  );
}
