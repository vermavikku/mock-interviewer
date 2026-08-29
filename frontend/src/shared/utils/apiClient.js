/**
 * Frontend API client communicating with the NestJS Backend Gateway
 * Architecture: Frontend (HttpOnly Cookies) -> NestJS Backend (:5000)
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Universal fetch wrapper that includes HttpOnly credentials (cookies)
 * and automatically intercepts 401s to refresh the 1-hour access token via the 7-day refresh token.
 */
async function fetchWithAuth(url, options = {}) {
  const { skipAutoRefresh = false, ...restOptions } = options;
  const defaultOptions = {
    credentials: 'include', // Ensures HttpOnly cookies (access_token & refresh_token) are sent
    headers: {},
    ...restOptions,
  };

  // If body is an object and not FormData, stringify JSON
  if (restOptions.body && !(restOptions.body instanceof FormData) && typeof restOptions.body === 'object') {
    defaultOptions.headers['Content-Type'] = 'application/json';
    defaultOptions.body = JSON.stringify(restOptions.body);
  }

  let response = await fetch(url, defaultOptions);

  // Auto-refresh access token on 401 Unauthorized (except on auth routes or when skipAutoRefresh is requested)
  if (!skipAutoRefresh && response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh-token')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          processQueue(null);
          // Re-try original request with new access_token cookie
          return fetch(url, defaultOptions);
        } else {
          isRefreshing = false;
          processQueue(new Error('Session expired'));
          // Dispatch global logout event if refresh token is also expired/revoked
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      } catch (err) {
        isRefreshing = false;
        processQueue(err);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    } else {
      // Queue requests while token is actively refreshing
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(fetch(url, defaultOptions)),
          reject: (err) => reject(err),
        });
      });
    }
  }

  return response;
}

// -----------------------------------------------------------------------------
// Authentication API Methods
// -----------------------------------------------------------------------------

export async function authLogin(identifier, password) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }
  return data;
}

export async function authRegister(userData) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed. Please try again.');
  }
  return data;
}

export async function authRefreshToken() {
  const response = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }
  return data;
}

export async function authLogout() {
  try {
    await fetchWithAuth(`${BACKEND_BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
  } catch (e) {
    // Ignore error on logout
  }
}

export async function authGetProfile(skipAutoRefresh = false) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/auth/profile`, {
    skipAutoRefresh,
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}

export async function authUpdateProfile(updates) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    body: updates,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }
  return data;
}

export async function authChangePassword(currentPassword, newPassword) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/auth/change-password`, {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to change password');
  }
  return data;
}

// -----------------------------------------------------------------------------
// Interview & Resume APIs
// -----------------------------------------------------------------------------

export async function uploadResumeAndCreateSession(file, config = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', config.role || config.targetRole || 'Software Engineer');
  formData.append('seniorityLevel', config.level || config.seniorityLevel || 'Senior');
  formData.append('difficulty', config.difficulty || 'Medium');
  formData.append('interviewType', config.type || config.interviewType || 'Technical');
  formData.append('targetDurationMin', String(config.duration || config.targetDurationMin || 30));

  if (config.title) {
    formData.append('title', config.title);
  }

  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message || 'Failed to upload resume to backend');
  }

  return response.json();
}

export async function uploadResumeToVault(file, targetRole = 'Software Engineer') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole);

  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/resumes/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message || 'Failed to upload resume to vault');
  }

  return response.json();
}

export async function createSessionWithExistingResume(sourceSessionId, config = {}) {
  const payload = {
    sourceSessionId,
    targetRole: config.role || config.targetRole || 'Software Engineer',
    seniorityLevel: config.level || config.seniorityLevel || 'Senior',
    difficulty: config.difficulty || 'Medium',
    interviewType: config.type || config.interviewType || 'Technical',
    targetDurationMin: Number(config.duration || config.targetDurationMin || 30),
    title: config.title || `${config.level || 'Senior'} ${config.type || 'Technical'} Interview`,
  };

  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/reuse`, {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to reuse resume' }));
    throw new Error(err.message || 'Failed to initialize session with selected resume');
  }

  return response.json();
}

export async function createSampleSession(config = {}, sampleResume = {}) {
  const payload = {
    targetRole: config.role || config.targetRole || 'Full Stack Engineer',
    seniorityLevel: config.level || config.seniorityLevel || 'Senior',
    difficulty: config.difficulty || 'Medium',
    interviewType: config.type || config.interviewType || 'Technical',
    targetDurationMin: Number(config.duration || config.targetDurationMin || 30),
    title: config.title || `${config.level || 'Senior'} ${config.type || 'Technical'} Interview`,
    sampleResumeName: sampleResume.name || 'Alex_Vance_Resume.pdf',
    sampleResumeText:
      sampleResume.summary ||
      `Senior Full Stack Engineer with expertise in Node.js, React, NestJS, TypeScript, PostgreSQL, Redis, Docker, and distributed microservices architecture.`,
  };

  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/sample`, {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Sample session creation failed' }));
    throw new Error(err.message || 'Failed to create sample session');
  }

  return response.json();
}

export async function listUploadedResumes() {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/resumes`);
  if (!response.ok) {
    throw new Error('Failed to fetch previously uploaded resumes');
  }
  return response.json();
}

export function getResumeFileUrl(sessionId) {
  return `${BACKEND_BASE_URL}/api/interviews/resumes/${sessionId}/file`;
}

export async function getSessionStatus(sessionId) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/${sessionId}/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch session status');
  }
  return response.json();
}

export async function getSessionDetails(sessionId) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch session details');
  }
  return response.json();
}

export async function submitQuestionAnswer(sessionId, questionId, answer) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/${sessionId}/submit-answer`, {
    method: 'POST',
    body: { questionId, answer },
  });

  if (!response.ok) {
    throw new Error('Failed to submit answer');
  }
  return response.json();
}

export async function listAllSessions() {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
}

export async function deleteSession(sessionId) {
  const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
  return response.json();
}

export async function completeSession(sessionId, completionData = {}) {
  try {
    const response = await fetchWithAuth(`${BACKEND_BASE_URL}/api/interviews/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: completionData,
    });
    if (!response.ok) {
      return { success: false };
    }
    return response.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
