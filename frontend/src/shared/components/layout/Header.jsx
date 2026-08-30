import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut, ChevronDown, User, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import './Header.css';

export function Header({ onMenuClick }) {
  const { user, logout, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editRole, setEditRole] = useState(user?.role || '');

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleConfirmLogout = async () => {
    // Keep the modal open and spin the Log Out button until logout completes
    setLogoutLoading(true);
    try {
      await logout();
    } catch (e) {
      // logout already ignores network errors internally
    }
    setShowLogoutConfirm(false);
    setLogoutLoading(false);
    toast.info('You have been logged out.');
    navigate('/login');
  };

  const handleOpenSettings = () => {
    setEditName(user?.name || '');
    setEditRole(user?.role || '');
    setIsDropdownOpen(false);
    setIsSettingsOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name: editName, role: editRole });
      toast.success('Profile settings updated successfully!');
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile settings');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button
            className="header-mobile-toggle"
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Profile Button with Dropdown */}
        <div className="header-right" ref={dropdownRef}>
          <button
            type="button"
            className={`header-profile-trigger ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            <div className="header-avatar-wrap">
              <img
                src={user?.avatarUrl || user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'alex'}`}
                alt={user?.username || user?.firstName || 'User'}
                className="header-user-avatar"
              />
              <span className="header-online-indicator" />
            </div>
            <span className="header-profile-username">{user?.username || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Candidate'}</span>
            <ChevronDown size={15} className={`header-chevron ${isDropdownOpen ? 'rotate' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="header-dropdown-menu glass-panel animate-pop-in">
              {/* Dropdown User Info Card */}
              <div
                className="dropdown-user-info"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/profile');
                }}
              >
                <div className="dropdown-avatar-wrap">
                  <img
                    src={user?.avatarUrl || user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'alex'}`}
                    alt={user?.username || 'User'}
                    className="dropdown-user-avatar"
                  />
                </div>
                <div className="dropdown-user-details">
                  <span className="dropdown-user-name">
                    {user?.username ? `@${user.username}` : [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Candidate'}
                  </span>
                  <span className="dropdown-user-role">
                    {user?.targetRole || user?.role || 'Full Stack Engineer'}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              {/* Menu Options */}
              <div className="dropdown-actions-list">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings & Security</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-item-btn dropdown-logout-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

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
        isLoading={logoutLoading}
      />

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Profile & Practice Settings"
        subtitle="Manage your profile information and interview preferences."
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
          <div className="modal-footer-btns">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
