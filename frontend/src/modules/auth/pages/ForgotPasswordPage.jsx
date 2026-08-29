import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { Button } from '../../../shared/components/ui/Button';
import { validatePassword } from '../../../shared/utils/validators';
import { useToast } from '../../../shared/context/ToastContext';

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please provide your username or registered email');
      return;
    }
    if (!passwordValidation.isValid) {
      setError('New password does not satisfy the security requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    await new Promise((res) => setTimeout(res, 800));
    setLoading(false);
    setIsSuccess(true);
    toast.success('Your password has been successfully reset!');
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Reset Complete!"
        subtitle="You can now sign in with your updated credentials."
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Password Updated!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Your account credentials have been securely updated.
          </p>
          <Button
            variant="gradient"
            size="lg"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new secure password for your account."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', justifyContent: 'center' }}>
            {error}
          </div>
        )}

        <Input
          label="Username or Email Address"
          icon={User}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. alexvance or alex@example.com"
          required
          autoFocus
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />

        {newPassword.length > 0 && (
          <PasswordChecklist validation={passwordValidation} showStrength={true} />
        )}

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          required
          helperText={
            confirmPassword.length > 0
              ? passwordsMatch
                ? '✓ Passwords match'
                : '✕ Passwords do not match'
              : ''
          }
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          icon={KeyRound}
          loading={loading}
          disabled={!passwordValidation.isValid || !passwordsMatch || !identifier.trim()}
        >
          Reset Password
        </Button>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
