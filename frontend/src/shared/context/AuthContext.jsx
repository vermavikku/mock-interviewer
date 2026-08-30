import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthSession, clearAuthUser } from '../store/slices/authSlice';
import { useAuth as useReduxAuth } from '../store/hooks';

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthSession());

    const handleAuthExpired = () => {
      dispatch(clearAuthUser());
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth() {
  return useReduxAuth();
}

