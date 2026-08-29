/**
 * Validation rules for forms
 */

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strength = 0;
  if (hasMinLength) strength += 25;
  if (hasUppercase) strength += 25;
  if (hasNumber) strength += 25;
  if (hasSpecial) strength += 25;

  let label = 'Weak';
  let color = 'var(--color-danger)';
  if (strength >= 75) {
    label = 'Strong';
    color = 'var(--color-success)';
  } else if (strength >= 50) {
    label = 'Medium';
    color = 'var(--color-warning)';
  }

  return {
    isValid: hasMinLength && hasUppercase && hasNumber,
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecial,
    strength,
    strengthLabel: label,
    strengthColor: color
  };
}
