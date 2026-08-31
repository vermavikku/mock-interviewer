import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  changeUserPassword,
  refreshUserProfile,
} from './slices/authSlice';
import {
  setActiveConfig,
  setActiveResume,
  setCurrentSession as setSessionAction,
  initializeInterviewSession as initSessionAction,
  saveCompletedInterview as saveInterviewAction,
  deleteInterviewSession,
  fetchBackendSessions as fetchSessionsThunk,
  resetInterviewState,
} from './slices/interviewSlice';
import { addToast, removeToast } from './slices/toastSlice';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

/**
 * Redux-backed useAuth hook
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, initializing, error } = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (identifier, password) => {
      const resultAction = await dispatch(loginUser({ identifier, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        return { success: true, user: resultAction.payload };
      }
      throw new Error(resultAction.payload || 'Login failed');
    },
    [dispatch]
  );

  const register = useCallback(
    async (userData) => {
      const resultAction = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(resultAction)) {
        return { success: true, user: resultAction.payload };
      }
      throw new Error(resultAction.payload || 'Registration failed');
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const updateProfile = useCallback(
    async (updates) => {
      const resultAction = await dispatch(updateUserProfile(updates));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        return { success: true, user: resultAction.payload };
      }
      throw new Error(resultAction.payload || 'Failed to update profile');
    },
    [dispatch]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const resultAction = await dispatch(changeUserPassword({ currentPassword, newPassword }));
      if (changeUserPassword.fulfilled.match(resultAction)) {
        return resultAction.payload;
      }
      throw new Error(resultAction.payload || 'Password change failed');
    },
    [dispatch]
  );

  const refreshProfile = useCallback(async () => {
    await dispatch(refreshUserProfile());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    initializing,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
  };
}

/**
 * Redux-backed useInterview hook
 */
export function useInterview() {
  const dispatch = useAppDispatch();
  const { interviews, activeConfig, activeResume, currentSession, isLoadingBackend } = useAppSelector(
    (state) => state.interview
  );

  const updateConfig = useCallback(
    (updates) => {
      dispatch(setActiveConfig(updates));
    },
    [dispatch]
  );

  const updateResume = useCallback(
    (resumeData) => {
      dispatch(setActiveResume(resumeData));
    },
    [dispatch]
  );

  const setCurrentSession = useCallback(
    (session) => {
      dispatch(setSessionAction(session));
    },
    [dispatch]
  );

  const initializeInterviewSession = useCallback(() => {
    if (currentSession && currentSession.questions?.length > 0) {
      return currentSession;
    }
    const session = {
      id: `int_${Date.now()}`,
      config: { ...activeConfig },
      resume: { ...activeResume },
      questions: [],
      totalDurationSeconds: (activeConfig?.duration || 30) * 60,
      createdAt: new Date().toISOString(),
    };
    dispatch(setSessionAction(session));
    return session;
  }, [currentSession, activeConfig, activeResume, dispatch]);

  const saveCompletedInterview = useCallback(
    (sessionResults) => {
      dispatch(saveInterviewAction(sessionResults));
    },
    [dispatch]
  );

  const getInterviewById = useCallback(
    (id) => {
      return interviews.find((item) => item.id === id) || null;
    },
    [interviews]
  );

  const deleteInterview = useCallback(
    async (id) => {
      await dispatch(deleteInterviewSession(id));
    },
    [dispatch]
  );

  const fetchBackendSessions = useCallback(async () => {
    await dispatch(fetchSessionsThunk());
  }, [dispatch]);

  const resetState = useCallback(() => {
    dispatch(resetInterviewState());
  }, [dispatch]);

  return {
    interviews,
    activeConfig,
    updateConfig,
    activeResume,
    updateResume,
    currentSession,
    setCurrentSession,
    initializeInterviewSession,
    saveCompletedInterview,
    getInterviewById,
    deleteInterview,
    fetchBackendSessions,
    resetState,
    isLoadingBackend,
  };
}

/**
 * Redux-backed useToast hook
 */
export function useToast() {
  const dispatch = useAppDispatch();

  const add = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      dispatch(addToast({ id, message, type, duration }));

      if (duration > 0) {
        setTimeout(() => {
          dispatch(removeToast(id));
        }, duration);
      }
      return id;
    },
    [dispatch]
  );

  return {
    success: (msg, dur) => add(msg, 'success', dur),
    error: (msg, dur) => add(msg, 'error', dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
    info: (msg, dur) => add(msg, 'info', dur),
  };
}
