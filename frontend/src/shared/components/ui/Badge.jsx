import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({
  children,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'cyan' | 'secondary'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) {
  return (
    <span className={cn('badge', `badge-${variant}`, size === 'sm' && 'badge-sm', className)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
