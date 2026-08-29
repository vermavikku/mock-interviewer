import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '../../utils/cn';
import './Input.css';

export function PasswordInput({
  label,
  error,
  helperText,
  className = '',
  id,
  required,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('ui-input-group', error && 'has-error', className)}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="ui-input-wrapper">
        <Lock className="ui-input-icon" size={18} />
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className="ui-input-field has-icon has-toggle"
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="ui-input-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="ui-input-error-msg">{error}</span>}
      {!error && helperText && <span className="ui-input-helper">{helperText}</span>}
    </div>
  );
}
