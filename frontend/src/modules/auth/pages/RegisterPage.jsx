import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserPlus, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../../../shared/context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { validatePassword } from '../../../shared/utils/validators';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please provide a username');
      return;
    }
    if (!passwordValidation.isValid) {
      setError('Password does not meet the security requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({ username: username.trim(), password });
      setIsSuccess(true);
      toast.success('Account created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
      toast.error(err.message || 'Registration failed');
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Registration Successful!"
        subtitle="Your InterviewAI account has been created."
      >
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={36} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Welcome aboard, <strong>{username}</strong>! You can now sign in to practice interviews tailored to your experience.
          </p>
          <Button
            variant="gradient"
            size="lg"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start practicing interviews with real-time AI feedback."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', justifyContent: 'center' }}>
            {error}
          </div>
        )}

        <Input
          label="Username"
          icon={User}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. alexvance"
          required
          autoFocus
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password"
          required
        />

        {password.length > 0 && (
          <PasswordChecklist validation={passwordValidation} showStrength={true} />
        )}

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
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
          icon={UserPlus}
          loading={loading}
          disabled={!passwordValidation.isValid || !passwordsMatch || !username.trim()}
        >
          Create Free Account
        </Button>

        <div className="auth-card-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
