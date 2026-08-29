import React from 'react';
import { cn } from '../../utils/cn';
import './Input.css';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('ui-input-group', error && 'has-error', className)}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="ui-input-wrapper">
        {Icon && <Icon className="ui-input-icon" size={18} />}
        <input
          id={inputId}
          className={cn('ui-input-field', Icon && 'has-icon')}
          {...props}
        />
      </div>
      {error && <span className="ui-input-error-msg">{error}</span>}
      {!error && helperText && <span className="ui-input-helper">{helperText}</span>}
    </div>
  );
}
