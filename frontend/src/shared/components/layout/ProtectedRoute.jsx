import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Minimal inline CSS for the auth-check spinner.
 * Uses a gentle fade-in so even if it shows briefly, there's no jarring flash.
 */
const overlayStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  background: 'var(--bg-app, #F6F8F7)',
  color: 'var(--text-secondary, #64748B)',
  animation: 'authFadeIn 0.3s ease-out',
};

// Injected once via a <style> tag so we don't need a separate CSS file.
const FADE_KEYFRAMES_ID = '__auth_route_fade';
function ensureFadeKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FADE_KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = FADE_KEYFRAMES_ID;
  style.textContent = `
    @keyframes authFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function AuthCheckSpinner({ message = 'Verifying session…' }) {
  ensureFadeKeyframes();
  return (
    <div style={overlayStyle}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={44} className="stage-spinner" style={{ color: '#0F766E' }} />
        <ShieldCheck size={20} style={{ position: 'absolute', color: '#14B8A6' }} />
      </div>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary, #0F172A)', fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // Only show the spinner during the initial one-time session check on first load.
  // Login/register button clicks do NOT trigger this because they use `loading`, not `initializing`.
  if (initializing) {
    return <AuthCheckSpinner message="Verifying security session…" />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated candidate to login page, preserving requested path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  // During initial check, optimistically render the public page content.
  // If the user has a cached session in localStorage we already know they're logged in
  // and can redirect instantly. Otherwise show the page immediately (no black screen).
  if (initializing) {
    // If there's a cached user in localStorage, they're likely authenticated —
    // redirect eagerly to avoid a flash of the login page.
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    // No cached user → show the public page immediately (login/register form).
    // The auth check will complete in background; if it turns out the user IS
    // logged in (cookie exists but no localStorage), the state update will redirect.
    return children ? children : <Outlet />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
