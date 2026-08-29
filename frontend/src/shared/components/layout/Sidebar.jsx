import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import './Sidebar.css';

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editRole, setEditRole] = useState(user?.role || '');

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interviews/new', label: 'New Interview', icon: PlusCircle },
    { to: '/interviews/history', label: 'Interview History', icon: History },
    { to: '/resumes', label: 'Resumes', icon: FileText },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    navigate('/login');
    logout();
    toast.info('You have been logged out.');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ name: editName, role: editRole });
    toast.success('Profile settings updated successfully!');
    setIsSettingsOpen(false);
  };

  return (
    <>
      <aside
        className={cn(
          'app-sidebar',
          isCollapsed && 'sidebar-collapsed',
          mobileOpen && 'sidebar-mobile-open'
        )}
      >
        {/* Top Branding */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <div className="brand-icon">
              <Sparkles size={20} className="brand-sparkle" />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">Interview<span className="text-gradient">AI</span></span>
                <span className="brand-badge">PRO</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{!isCollapsed && 'PRACTICE'}</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) =>
                  cn('sidebar-nav-link', isActive && 'active')
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="nav-icon" size={20} />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>


        {/* Bottom Utility Menu */}
        <div className="sidebar-footer">
          <button
            className="sidebar-footer-btn"
            onClick={() => setIsSettingsOpen(true)}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings size={18} />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            className="sidebar-footer-btn"
            onClick={() => setIsHelpOpen(true)}
            title={isCollapsed ? 'Help & Resources' : undefined}
          >
            <HelpCircle size={18} />
            {!isCollapsed && <span>Help & Guides</span>}
          </button>

          {/* User Profile Bar */}
          <div className="sidebar-user-card">
            <div className="user-avatar-wrap">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name}
                className="user-avatar"
              />
              <span className="user-online-dot" />
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name || 'Candidate'}</span>
                <span className="user-role">{user?.role || 'Engineer'}</span>
              </div>
            )}
            {!isCollapsed && (
              <button
                className="user-logout-btn"
                onClick={() => setShowLogoutConfirm(true)}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Log Out Confirmation"
        message="Are you sure you want to log out of your session?"
        confirmLabel="Log Out"
        variant="danger"
        icon={LogOut}
      />

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Account & Practice Settings"
        subtitle="Manage your profile information and practice preferences."
      >
        <form onSubmit={handleSaveProfile} className="settings-form">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Your name"
            required
          />
          <Input
            label="Target Engineering Role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            required
          />
          <div className="settings-section">
            <h4 className="settings-section-title">AI Feedback Strictness</h4>
            <div className="settings-options-row">
              <label className="radio-label">
                <input type="radio" name="strictness" defaultChecked /> Standard Evaluation
              </label>
              <label className="radio-label">
                <input type="radio" name="strictness" /> FAANG Strict (Deep Bar Raiser)
              </label>
            </div>
          </div>
          <div className="modal-footer-btns">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Help & Interview Guide"
        subtitle="Learn how to get the most out of your AI interview sessions."
      >
        <div className="help-content">
          <div className="help-item">
            <h4>1. Resume-Driven Personalization</h4>
            <p>Upload your latest PDF/DOCX resume. The AI will extract your tech stack, projects, and career milestones to formulate relevant behavioral and architecture questions.</p>
          </div>
          <div className="help-item">
            <h4>2. Dynamic AI Follow-ups</h4>
            <p>Just like a senior bar-raiser interviewer, the AI listens to your response and challenges your trade-offs with targeted follow-up queries.</p>
          </div>
          <div className="help-item">
            <h4>3. Comprehensive Scorecards</h4>
            <p>After finishing, review granular scorecards for Technical Depth, Communication, Problem Solving, and Actionable AI Feedback tips.</p>
          </div>
          <div className="modal-footer-btns">
            <Button variant="primary" onClick={() => setIsHelpOpen(false)}>
              Got it, let's practice!
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
