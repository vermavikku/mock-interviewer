import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogIn, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../../../shared/context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';

export function LoginPage() {
  const [username, setUsername] = useState('alexvance');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      await login(username, password, rememberMe);
      toast.success(`Welcome back, ${username}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password credentials');
      toast.error(err.message || 'Authentication failed');
    }
  };

  const handleDemoLogin = async () => {
    setUsername('alexvance');
    setPassword('Password123!');
    await login('alexvance', 'Password123!', true);
    toast.success('Signed in with Demo Engineer Account');
    navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account and continue your interview training."
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
          placeholder="Enter your password"
          required
        />

        <div className="auth-form-row">
          <label className="remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          icon={LogIn}
          loading={loading}
        >
          Sign In
        </Button>

        <div className="auth-card-links-row">
          {/* <Link to="/forgot-username" className="auth-link">
            Forgot Username?
          </Link> */}
          <Link to="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        <div className="auth-card-footer">
          Don't have an account yet?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
