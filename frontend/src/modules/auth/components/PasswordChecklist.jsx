import React from 'react';
import { Check, X } from 'lucide-react';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';

export function PasswordChecklist({ validation, showStrength = true }) {
  const { hasMinLength, hasUppercase, hasNumber, hasSpecial, strength, strengthLabel, strengthColor } = validation;

  return (
    <div className="password-checklist-box">
      {showStrength && (
        <div className="strength-meter-wrap">
          <div className="strength-header">
            <span className="strength-text">Password Strength:</span>
            <span className="strength-badge" style={{ color: strengthColor, fontWeight: 700 }}>
              {strengthLabel}
            </span>
          </div>
          <ProgressBar value={strength} max={100} size="sm" color={strength >= 75 ? 'success' : strength >= 50 ? 'warning' : 'primary'} />
        </div>
      )}

      <div className="req-checklist">
        <div className={`req-item ${hasMinLength ? 'valid' : 'invalid'}`}>
          {hasMinLength ? <Check size={14} className="text-success" /> : <X size={14} className="text-muted" />}
          <span>Minimum 8 characters</span>
        </div>
        <div className={`req-item ${hasUppercase ? 'valid' : 'invalid'}`}>
          {hasUppercase ? <Check size={14} className="text-success" /> : <X size={14} className="text-muted" />}
          <span>At least one uppercase letter (A-Z)</span>
        </div>
        <div className={`req-item ${hasNumber ? 'valid' : 'invalid'}`}>
          {hasNumber ? <Check size={14} className="text-success" /> : <X size={14} className="text-muted" />}
          <span>At least one number (0-9)</span>
        </div>
        <div className={`req-item ${hasSpecial ? 'valid' : 'invalid'}`}>
          {hasSpecial ? <Check size={14} className="text-success" /> : <X size={14} className="text-muted" />}
          <span>Optional: One special character (!@#$)</span>
        </div>
      </div>
    </div>
  );
}
