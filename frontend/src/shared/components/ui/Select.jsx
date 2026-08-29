import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import './Select.css';

export function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('ui-select-group', error && 'has-error', className)}>
      {label && (
        <label htmlFor={selectId} className="ui-select-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="ui-select-wrapper">
        {Icon && <Icon className="ui-select-icon" size={18} />}
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={cn('ui-select-field', Icon && 'has-icon')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <ChevronDown className="ui-select-arrow" size={16} />
      </div>
      {error && <span className="ui-select-error-msg">{error}</span>}
      {!error && helperText && <span className="ui-select-helper">{helperText}</span>}
    </div>
  );
}
