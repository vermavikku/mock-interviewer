import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../utils/apiClient';

const InterviewContext = createContext(null);

const STORAGE_KEY = 'interview_ai_history';
const ACTIVE_CONFIG_KEY = 'interview_ai_active_config';
const ACTIVE_RESUME_KEY = 'interview_ai_active_resume';

export function InterviewProvider({ children }) {
  const [interviews, setInterviews] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeConfig, setActiveConfig] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_CONFIG_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          type: 'Technical',
          role: 'Full Stack Engineer',
          level: 'Senior',
          difficulty: 'Medium',
          duration: 30, // in minutes
        };
  });

  const [activeResume, setActiveResume] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_RESUME_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [currentSession, setCurrentSession] = useState(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    fetchBackendSessions();
  }, []);

  const fetchBackendSessions = async () => {
    try {
      setIsLoadingBackend(true);
      const res = await api.listAllSessions();
      if (res && res.data && Array.isArray(res.data)) {
        // Transform backend DB sessions into UI interview format
        const formatted = res.data.map((item) => ({
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
        setInterviews(formatted);
      }
    } catch (err) {
      console.warn('Could not sync with backend sessions:', err.message);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  }, [interviews]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(activeConfig));
  }, [activeConfig]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_RESUME_KEY, JSON.stringify(activeResume));
  }, [activeResume]);

  const updateConfig = (updates) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateResume = (resumeData) => {
    setActiveResume(resumeData);
  };

  const initializeInterviewSession = () => {
    if (currentSession && currentSession.questions?.length > 0) {
      return currentSession;
    }
    const session = {
      id: `int_${Date.now()}`,
      config: { ...activeConfig },
      resume: { ...activeResume },
      questions: [],
      totalDurationSeconds: (activeConfig.duration || 30) * 60,
      createdAt: new Date().toISOString(),
    };
    setCurrentSession(session);
    return session;
  };

  const saveCompletedInterview = (sessionResults) => {
    const newInterview = {
      id: sessionResults.id || `int_${Date.now()}`,
      title: `${sessionResults.config.level || 'Senior'} ${sessionResults.config.type || 'Technical'} Interview`,
      type: sessionResults.config.type || 'Technical',
      role: sessionResults.config.role || 'Software Engineer',
      date: new Date().toISOString(),
      duration: `${Math.ceil((sessionResults.durationSpentSeconds || 600) / 60)} min`,
      score: sessionResults.score || 85,
      status: 'Completed',
      difficulty: sessionResults.config.difficulty || 'Medium',
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

    setInterviews((prev) => [newInterview, ...prev.filter((i) => i.id !== newInterview.id)]);
    return newInterview;
  };

  const getInterviewById = (id) => {
    return interviews.find((item) => item.id === id) || null;
  };

  const deleteInterview = async (id) => {
    try {
      await api.deleteSession(id);
    } catch (e) {
      // ignore if offline
    }
    setInterviews((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <InterviewContext.Provider
      value={{
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
        isLoadingBackend,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
