import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { soundEffects } from '../../utils/soundEffects';
import './Button.css';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled || loading) return;
    soundEffects.playPop();
    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={cn(
        'ui-btn',
        `ui-btn-${variant}`,
        `ui-btn-${size}`,
        fullWidth && 'ui-btn-full',
        loading && 'ui-btn-loading',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="btn-spinner" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="btn-icon left" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
      <span className="btn-text">{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="btn-icon right" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
    </button>
  );
}
