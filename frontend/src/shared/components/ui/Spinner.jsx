import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ size = 'md', className = '', color = 'primary' }) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48,
  };

  return (
    <div className={cn('flex-center', className)}>
      <Loader2
        size={sizeMap[size] || 24}
        className="btn-spinner"
        style={{ color: color === 'primary' ? 'var(--color-primary)' : 'currentColor' }}
      />
    </div>
  );
}
