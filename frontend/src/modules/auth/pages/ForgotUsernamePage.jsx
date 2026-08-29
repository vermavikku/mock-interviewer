import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { validateEmail } from '../../../shared/utils/validators';
import { useToast } from '../../../shared/context/ToastContext';

export function ForgotUsernamePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setLoading(false);
    setSubmitted(true);
    toast.success('Username recovery email sent!');
  };

  return (
    <AuthLayout
      title="Recover Username"
      subtitle="Enter the email associated with your account to receive your username."
    >
      {submitted ? (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Instructions Sent!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Instructions to recover your username have been sent to <strong>{email}</strong>. Please check your inbox and spam folders.
          </p>
          <Button
            variant="outline"
            fullWidth
            onClick={() => setSubmitted(false)}
          >
            Try another email
          </Button>
          <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', justifyContent: 'center' }}>
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. name@company.com"
            required
            autoFocus
          />

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            fullWidth
            loading={loading}
          >
            Send Recovery Email
          </Button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
