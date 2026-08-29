import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../utils/apiClient';

const AuthContext = createContext(null);
const STORAGE_USER_KEY = 'interview_ai_user_cache';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem(STORAGE_USER_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem(STORAGE_USER_KEY);
  });
  // This loading flag is ONLY for the initial auth session check on mount.
  // It should NOT be set during login/register/logout — those actions
  // have their own per-button loading states managed in each page component.
  const [initializing, setInitializing] = useState(true);
  // Separate flag for action-level operations (login/register button spinners)
  const [loading, setLoading] = useState(false);

  // Sync profile on mount via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const profile = await api.authGetProfile(true);
        if (isMounted && profile) {
          const userObj = {
            ...profile,
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username,
          };
          setUser(userObj);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
        }
      } catch (err) {
        // Not logged in or expired cookie
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem(STORAGE_USER_KEY);
        }
      } finally {
        if (isMounted) setInitializing(false);
      }
    }

    checkAuthSession();

    // Listen for global auth expired events
    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(STORAGE_USER_KEY);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    try {
      const res = await api.authLogin(identifier, password);
      const userObj = {
        ...res.user,
        name: `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.username,
      };
      setUser(userObj);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      return { success: true, user: userObj };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const res = await api.authRegister(userData);
      const userObj = {
        ...res.user,
        name: `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.username,
      };
      setUser(userObj);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      return { success: true, user: userObj };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.authLogout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_USER_KEY);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await api.authUpdateProfile(updates);
      const updatedUser = {
        ...user,
        ...res.user,
        name: `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.username,
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (err) {
      // If offline/fallback update local state
      setUser((prev) => {
        const next = { ...prev, ...updates };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(next));
        return next;
      });
      throw err;
    }
  }, [user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return api.authChangePassword(currentPassword, newPassword);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.authGetProfile();
      if (profile) {
        const userObj = {
          ...profile,
          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username,
        };
        setUser(userObj);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      }
    } catch (err) {
      console.warn('Could not refresh profile:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        initializing,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
