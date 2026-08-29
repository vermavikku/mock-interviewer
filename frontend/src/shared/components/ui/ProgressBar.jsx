import React from 'react';
import { cn } from '../../utils/cn';
import './ProgressBar.css';

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  color = 'primary', // 'primary' | 'success' | 'warning' | 'gradient' | 'cyan'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('ui-progress-wrapper', className)}>
      {(label || showValue) && (
        <div className="ui-progress-header">
          {label && <span className="ui-progress-label">{label}</span>}
          {showValue && <span className="ui-progress-val">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('ui-progress-track', `size-${size}`)}>
        <div
          className={cn('ui-progress-fill', `fill-${color}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
