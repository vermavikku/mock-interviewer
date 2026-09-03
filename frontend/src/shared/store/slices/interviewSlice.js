import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../utils/apiClient';

const initialDefaultConfig = {
  type: 'Technical',
  role: 'Full Stack Engineer',
  level: 'Senior',
  difficulty: 'Medium',
  duration: 30,
};

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
          score: Math.round(item.totalScore ?? 0),
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
    interviews: [], // Strictly initialized per user via fetchBackendSessions
    activeConfig: initialDefaultConfig,
    activeResume: null,
    currentSession: null,
    activeStep: 'upload', // 'upload' | 'config' | 'pipeline' | 'ready'
    isLoadingBackend: false,
    error: null,
  },
  reducers: {
    setActiveConfig: (state, action) => {
      state.activeConfig = { ...state.activeConfig, ...action.payload };
    },
    resetActiveConfig: (state) => {
      state.activeConfig = { ...initialDefaultConfig };
    },
    setActiveResume: (state, action) => {
      state.activeResume = action.payload;
    },
    clearActiveResume: (state) => {
      state.activeResume = null;
    },
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },
    resetWizard: (state) => {
      state.activeStep = 'upload';
      state.activeResume = null;
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
        score: typeof sessionResults.score === 'number' ? sessionResults.score : (sessionResults.overallScore ?? 0),
        status: 'Completed',
        difficulty: sessionResults.config?.difficulty || 'Medium',
        resumeUsed: sessionResults.resume?.name || 'Resume.pdf',
        subScores: sessionResults.subScores || {
          technical: typeof sessionResults.score === 'number' ? sessionResults.score : 0,
          communication: typeof sessionResults.score === 'number' ? Math.round(sessionResults.score * 0.95) : 0,
          problemSolving: typeof sessionResults.score === 'number' ? sessionResults.score : 0,
          confidence: typeof sessionResults.score === 'number' ? Math.round(sessionResults.score * 0.98) : 0,
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
    },
    resetInterviewState: (state) => {
      state.interviews = [];
      state.activeConfig = { ...initialDefaultConfig };
      state.activeResume = null;
      state.currentSession = null;
      state.activeStep = 'upload';
      state.isLoadingBackend = false;
      state.error = null;
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
        state.interviews = action.payload || [];
      })
      .addCase(fetchBackendSessions.rejected, (state, action) => {
        state.isLoadingBackend = false;
        state.error = action.payload;
      });

    // deleteInterviewSession
    builder.addCase(deleteInterviewSession.fulfilled, (state, action) => {
      state.interviews = state.interviews.filter((i) => i.id !== action.payload);
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
  resetInterviewState,
} = interviewSlice.actions;

export default interviewSlice.reducer;
