import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Award,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { Badge } from '../../../shared/components/ui/Badge';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { useAuth } from '../../../shared/context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { formatDate } from '../../../shared/utils/formatters';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout, refreshProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security' | 'tokens'
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Profile Edit Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Full Stack Engineer');
  const [seniorityLevel, setSeniorityLevel] = useState(user?.seniorityLevel || 'Senior');
  const [bio, setBio] = useState(user?.bio || '');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setTargetRole(user.targetRole || 'Full Stack Engineer');
      setSeniorityLevel(user.seniorityLevel || 'Senior');
      setBio(user.bio || '');
    }
  }, [user]);

  // Pull fresh profile from the DB on mount so the form is pre-filled with
  // the latest persisted info (even if the localStorage cache is stale).
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        targetRole,
        seniorityLevel,
        bio,
      });
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully! Other device sessions revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Password update failed');
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    // Keep the modal open and spin the red button until revocation completes
    setRevoking(true);
    try {
      await logout();
      toast.success('All sessions have been revoked. Please sign in again.');
      setShowRevokeModal(false);
      navigate('/login');
    } catch (err) {
      toast.error('Session revocation error');
      setShowRevokeModal(false);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <PageWrapper className="profile-page-container">
      {/* Profile Hero Header Card */}
      <div className="profile-hero-card glass-panel animate-fade-in">
        <div className="profile-hero-content">
          <div className="profile-avatar-wrapper">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'alex'}`}
              alt={user?.name || 'Candidate Avatar'}
              className="profile-avatar-img"
            />
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h1 className="profile-full-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || user?.username || 'Candidate'}
              </h1>
              <Badge variant="primary" size="md">
                {user?.seniorityLevel || 'Senior'}
              </Badge>
              <Badge variant="secondary" size="md">
                {user?.role || 'CANDIDATE'}
              </Badge>
            </div>

            <span className="profile-username-tag">@{user?.username || 'candidate'}</span>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} /> {user?.email || 'candidate@example.com'}
              </span>
              <span className="profile-meta-item">
                <Briefcase size={14} /> {user?.targetRole || 'Full Stack Engineer'}
              </span>
              <span className="profile-meta-item">
                <Calendar size={14} /> Member since {user?.createdAt ? formatDate(user.createdAt) : 'August 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Performance Metric Cards */}
      <div className="profile-stats-grid animate-fade-in">
        <div className="profile-stat-card glass-panel">
          <div className="profile-stat-icon" style={{ background: 'rgba(15, 118, 110, 0.15)', color: '#0F766E' }}>
            <Award size={24} />
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-val">{user?.stats?.completedSessions ?? user?.interviewsCompleted ?? 4}</span>
            <span className="profile-stat-lbl">Interviews Completed</span>
          </div>
        </div>

        <div className="profile-stat-card glass-panel">
          <div className="profile-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Sparkles size={24} />
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-val">{user?.stats?.averageScore ?? user?.averageScore ?? 84}%</span>
            <span className="profile-stat-lbl">Average AI Score</span>
          </div>
        </div>

        <div className="profile-stat-card glass-panel">
          <div className="profile-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Clock size={24} />
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-val">{user?.stats?.totalPracticeMinutes ?? 120} min</span>
            <span className="profile-stat-lbl">Practice Time</span>
          </div>
        </div>

        <div className="profile-stat-card glass-panel">
          <div className="profile-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Shield size={24} />
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-val">Protected</span>
            <span className="profile-stat-lbl">Security Status</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <User size={16} />
          <span>Personal & Role Info</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <KeyRound size={16} />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <Shield size={16} />
          <span>Session & Privacy</span>
        </button>
      </div>

      {/* Tab 1: Personal Details Form */}
      {activeTab === 'details' && (
        <div className="profile-panel-card glass-panel animate-fade-in">
          <div className="panel-header-block">
            <h3 className="panel-title">Candidate Profile & Target Role</h3>
            <p className="panel-desc">
              Your profile information helps Google Gemini customize mock interview questions and difficulty.
            </p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <Input
                label="Username (Login Identifier)"
                value={user?.username || ''}
                onChange={() => {}}
                placeholder="e.g. alex_vance"
                disabled
              />

              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
              />

              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Vance"
              />

              <Input
                label="Target Job Title"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Staff Infrastructure Engineer"
                required
              />

              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                  Seniority Level
                </label>
                <select
                  value={seniorityLevel}
                  onChange={(e) => setSeniorityLevel(e.target.value)}
                  className="profile-textarea"
                  style={{ minHeight: '44px', padding: '8px 12px' }}
                >
                  <option value="Junior">Junior (0-2 YOE)</option>
                  <option value="Mid">Mid-Level (3-5 YOE)</option>
                  <option value="Senior">Senior (5-8 YOE)</option>
                  <option value="Lead">Team Lead (7-10 YOE)</option>
                  <option value="Staff">Staff / Principal (10+ YOE)</option>
                </select>
              </div>

              <div className="form-group-full">
                <label className="input-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                  Professional Bio & Interview Goals
                </label>
                <textarea
                  className="profile-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your technical background, preferred frameworks, and focus areas..."
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="md"
              icon={CheckCircle2}
              loading={isSaving}
            >
              Save Profile Changes
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="profile-panel-card glass-panel animate-fade-in">
          <div className="panel-header-block">
            <h3 className="panel-title">Security & Password Management</h3>
            <p className="panel-desc">
              Your account is secured with enterprise-grade encryption. Updating your password will immediately revoke prior device sessions.
            </p>
          </div>

          <div className="security-status-grid">
            <div className="security-status-card">
              <Lock size={20} className="sec-icon text-success" />
              <div>
                <h4 className="sec-title">Enterprise Encryption</h4>
                <p className="sec-desc">Irreversible cryptographic hashing protects your credentials.</p>
              </div>
            </div>

            <div className="security-status-card">
              <Shield size={20} className="sec-icon text-primary" />
              <div>
                <h4 className="sec-title">Active Session Guard</h4>
                <p className="sec-desc">Unauthorized or outdated sessions are automatically rejected.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} style={{ maxWidth: 540 }}>
            {passError && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: 16, justifyContent: 'center' }}>
                {passError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />

              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                required
              />

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="gradient"
                size="md"
                icon={KeyRound}
                loading={isChangingPass}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Change Password
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                icon={LogOut}
                onClick={() => setShowRevokeModal(true)}
              >
                Revoke All Device Sessions
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Session & Privacy Info */}
      {activeTab === 'tokens' && (
        <div className="profile-panel-card glass-panel animate-fade-in">
          <div className="panel-header-block">
            <h3 className="panel-title">Session Security & Privacy Architecture</h3>
            <p className="panel-desc">
              Your authentication session is protected with isolated secure cookies, keeping your data shielded from client-side vulnerabilities.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div className="security-status-card" style={{ background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)' }}>
              <Shield size={22} className="text-primary" style={{ marginTop: 2, color: '#0F766E' }} />
              <div>
                <h4 className="sec-title" style={{ color: '#0F766E' }}>Protected Access Session</h4>
                <p className="sec-desc" style={{ color: 'var(--text-secondary, #64748B)' }}>
                  Session authentication is verified cryptographically on each request to safeguard all interview responses and recordings.
                </p>
              </div>
            </div>

            <div className="security-status-card" style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)' }}>
              <RefreshCw size={22} className="text-cyan" style={{ marginTop: 2, color: '#0EA5E9' }} />
              <div>
                <h4 className="sec-title" style={{ color: '#0EA5E9' }}>Seamless Session Continuity</h4>
                <p className="sec-desc" style={{ color: 'var(--text-secondary, #64748B)' }}>
                  Continuous background renewal ensures that your live mock interviews and coding submissions are never interrupted by unexpected session timeouts.
                </p>
              </div>
            </div>

            <div className="security-status-card" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <Layers size={22} className="text-success" style={{ marginTop: 2, color: '#10B981' }} />
              <div>
                <h4 className="sec-title" style={{ color: '#047857' }}>Encrypted Internal Infrastructure</h4>
                <p className="sec-desc" style={{ color: 'var(--text-secondary, #64748B)' }}>
                  All background document parsing, question synthesis, and evaluation channels communicate over an encrypted, isolated private network.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleRevokeAllSessions}
        title="Revoke All Device Sessions?"
        message="This will increment your database token version and immediately log you out of all active browsers, laptops, and mobile devices."
        confirmLabel="Yes, Revoke All Sessions"
        cancelLabel="Cancel"
        variant="danger"
        icon={LogOut}
        isLoading={revoking}
      />
    </PageWrapper>
  );
}
