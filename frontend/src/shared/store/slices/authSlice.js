import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../utils/apiClient';

const STORAGE_USER_KEY = 'interview_ai_user_cache';

const getInitialUser = () => {
  try {
    const cached = localStorage.getItem(STORAGE_USER_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    try {
      // NOTE: no skipAutoRefresh — a 401 here must trigger the fetchWithAuth
      // refresh-token retry so a valid 7-day refresh cookie can restore the
      // session after a page reload (otherwise the profile cache gets wiped
      // and the UI falls back to "Candidate").
      const profile = await api.authGetProfile();
      if (profile) {
        const computedName =
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          profile.name ||
          profile.username ||
          'Candidate';
        const computedRole = profile.targetRole || profile.role || 'Full Stack Engineer';
        const userObj = {
          ...profile,
          name: computedName,
          role: computedRole,
        };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
        return userObj;
      }
      return null;
    } catch (err) {
      // Do NOT delete the persisted profile cache here — a transient 401
      // during the restore check must not wipe the last-known-good user.
      // Real session expiry fires the `auth:expired` event (handled by
      // AuthProvider -> clearAuthUser) instead.
      return rejectWithValue(err.message || 'Session expired');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const res = await api.authLogin(identifier, password);
      const user = res.user;
      const computedName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.name ||
        user.username ||
        'Candidate';
      const computedRole = user.targetRole || user.role || 'Full Stack Engineer';
      const userObj = {
        ...user,
        name: computedName,
        role: computedRole,
      };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.authRegister(userData);
      const user = res.user;
      const computedName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.name ||
        user.username ||
        'Candidate';
      const computedRole = user.targetRole || user.role || 'Full Stack Engineer';
      const userObj = {
        ...user,
        name: computedName,
        role: computedRole,
      };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.authLogout();
  } catch {
    // Ignore network error on logout
  }
  localStorage.removeItem(STORAGE_USER_KEY);
  return null;
});

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const res = await api.authUpdateProfile(updates);
      const currentUser = getState().auth.user || {};
      const returnedUser = res.user || {};
      const computedName =
        updates.name ||
        [returnedUser.firstName, returnedUser.lastName].filter(Boolean).join(' ') ||
        returnedUser.name ||
        returnedUser.username ||
        currentUser.name ||
        'Candidate';
      const computedRole =
        updates.targetRole ||
        updates.role ||
        returnedUser.targetRole ||
        returnedUser.role ||
        currentUser.role ||
        'Full Stack Engineer';

      const userObj = {
        ...currentUser,
        ...returnedUser,
        name: computedName,
        role: computedRole,
      };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      return rejectWithValue(err.message || 'Update profile failed');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      return await api.authChangePassword(currentPassword, newPassword);
    } catch (err) {
      return rejectWithValue(err.message || 'Password change failed');
    }
  }
);

export const refreshUserProfile = createAsyncThunk(
  'auth/refreshUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const profile = await api.authGetProfile();
      if (profile) {
        const currentUser = getState().auth.user || {};
        const computedName =
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          profile.name ||
          profile.username ||
          'Candidate';
        const userObj = {
          ...currentUser,
          ...profile,
          name: computedName,
          role: profile.targetRole || profile.role || 'Full Stack Engineer',
        };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
        return userObj;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    isAuthenticated: !!initialUser,
    initializing: true,
    loading: false,
    error: null,
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem(STORAGE_USER_KEY);
    },
  },
  extraReducers: (builder) => {
    // checkAuthSession
    builder
      .addCase(checkAuthSession.pending, (state) => {
        state.initializing = true;
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.initializing = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuthSession.rejected, (state) => {
        state.initializing = false;
        // Preserve the last-known-good cached user (if any) so a transient
        // 401 during the restore check does not blank out the Header/Sidebar
        // username and the /profile pre-fill. True session expiry is handled
        // by the `auth:expired` event -> clearAuthUser.
      });

    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // registerUser
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    });

    // updateUserProfile
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // refreshUserProfile
    builder.addCase(refreshUserProfile.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
      }
    });
  },
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
