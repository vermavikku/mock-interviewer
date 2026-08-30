import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../utils/apiClient';

const STORAGE_KEY = 'interview_ai_history';
const ACTIVE_CONFIG_KEY = 'interview_ai_active_config';
const ACTIVE_RESUME_KEY = 'interview_ai_active_resume';

const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const initialInterviews = getStored(STORAGE_KEY, []);
const initialConfig = getStored(ACTIVE_CONFIG_KEY, {
  type: 'Technical',
  role: 'Full Stack Engineer',
  level: 'Senior',
  difficulty: 'Medium',
  duration: 30,
});
const initialResume = getStored(ACTIVE_RESUME_KEY, null);

export const fetchBackendSessions = createAsyncThunk(
  'interview/fetchBackendSessions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.listAllSessions();
      const rawList = Array.isArray(res) ? res : res && Array.isArray(res.data) ? res.data : null;
      if (rawList) {
        return rawList.map((item) => ({
          id: item.id,
          title: item.title || `${item.seniorityLevel} ${item.interviewType} Interview`,
          type: item.interviewType || 'Technical',
          role: item.targetRole || 'Software Engineer',
          date: item.createdAt,
          duration: `${item.targetDurationMin || 30} min`,
          score: Math.round(item.totalScore || 85),
          status: item.status === 'COMPLETED' ? 'Completed' : item.status === 'READY' ? 'Ready' : item.status,
          difficulty: item.difficulty || 'Medium',
          resumeUsed: item.originalFileName || 'Resume.pdf',
          rawExtractedText: item.rawExtractedText,
          sessionJsonPath: item.sessionJsonPath,
        }));
      }
      return [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch sessions');
    }
  }
);

export const deleteInterviewSession = createAsyncThunk(
  'interview/deleteInterviewSession',
  async (id) => {
    try {
      await api.deleteSession(id);
    } catch {
      // ignore if offline
    }
    return id;
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    interviews: initialInterviews,
    activeConfig: initialConfig,
    activeResume: initialResume,
    currentSession: null,
    activeStep: 'upload', // 'upload' | 'config' | 'pipeline' | 'ready'
    isLoadingBackend: false,
    error: null,
  },
  reducers: {
    setActiveConfig: (state, action) => {
      state.activeConfig = { ...state.activeConfig, ...action.payload };
      localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(state.activeConfig));
    },
    resetActiveConfig: (state) => {
      state.activeConfig = {
        type: 'Technical',
        role: 'Full Stack Engineer',
        level: 'Senior',
        difficulty: 'Medium',
        duration: 30,
      };
      localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(state.activeConfig));
    },
    setActiveResume: (state, action) => {
      state.activeResume = action.payload;
      if (action.payload) {
        localStorage.setItem(ACTIVE_RESUME_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(ACTIVE_RESUME_KEY);
      }
    },
    clearActiveResume: (state) => {
      state.activeResume = null;
      localStorage.removeItem(ACTIVE_RESUME_KEY);
    },
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },
    resetWizard: (state) => {
      state.activeStep = 'upload';
      state.activeResume = null;
      localStorage.removeItem(ACTIVE_RESUME_KEY);
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    initializeInterviewSession: (state) => {
      if (state.currentSession && state.currentSession.questions?.length > 0) {
        return;
      }
      state.currentSession = {
        id: `int_${Date.now()}`,
        config: { ...state.activeConfig },
        resume: { ...state.activeResume },
        questions: [],
        totalDurationSeconds: (state.activeConfig.duration || 30) * 60,
        createdAt: new Date().toISOString(),
      };
    },
    saveCompletedInterview: (state, action) => {
      const sessionResults = action.payload;
      const newInterview = {
        id: sessionResults.id || `int_${Date.now()}`,
        title: `${sessionResults.config?.level || 'Senior'} ${sessionResults.config?.type || 'Technical'} Interview`,
        type: sessionResults.config?.type || 'Technical',
        role: sessionResults.config?.role || 'Software Engineer',
        date: new Date().toISOString(),
        duration: `${Math.ceil((sessionResults.durationSpentSeconds || 600) / 60)} min`,
        score: sessionResults.score || 85,
        status: 'Completed',
        difficulty: sessionResults.config?.difficulty || 'Medium',
        resumeUsed: sessionResults.resume?.name || 'Resume.pdf',
        subScores: sessionResults.subScores || {
          technical: 86,
          communication: 82,
          problemSolving: 85,
          confidence: 83,
        },
        strengths: sessionResults.strengths || [
          'Solid foundational explanations and clear communication',
          'Effective use of technical architectural patterns',
        ],
        improvements: sessionResults.improvements || [
          'Include more quantifiable production metrics in answers',
        ],
        recommendations: sessionResults.recommendations || [
          'System Design & Distributed Scalability',
        ],
        questions: sessionResults.questions || [],
      };

      state.interviews = [newInterview, ...state.interviews.filter((i) => i.id !== newInterview.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.interviews));
    },
  },
  extraReducers: (builder) => {
    // fetchBackendSessions
    builder
      .addCase(fetchBackendSessions.pending, (state) => {
        state.isLoadingBackend = true;
        state.error = null;
      })
      .addCase(fetchBackendSessions.fulfilled, (state, action) => {
        state.isLoadingBackend = false;
        if (action.payload && action.payload.length > 0) {
          state.interviews = action.payload;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.interviews));
        }
      })
      .addCase(fetchBackendSessions.rejected, (state, action) => {
        state.isLoadingBackend = false;
        state.error = action.payload;
      });

    // deleteInterviewSession
    builder.addCase(deleteInterviewSession.fulfilled, (state, action) => {
      state.interviews = state.interviews.filter((i) => i.id !== action.payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.interviews));
    });
  },
});

export const {
  setActiveConfig,
  resetActiveConfig,
  setActiveResume,
  clearActiveResume,
  setActiveStep,
  resetWizard,
  setCurrentSession,
  clearCurrentSession,
  initializeInterviewSession,
  saveCompletedInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;
