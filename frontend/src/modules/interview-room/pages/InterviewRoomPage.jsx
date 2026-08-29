import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InterviewHeader } from '../components/InterviewHeader';
import { AIAvatarPanel } from '../components/AIAvatarPanel';
import { ChatTranscript } from '../components/ChatTranscript';
import { ChatInputBar } from '../components/ChatInputBar';
import { CodeEditorWorkspace } from '../components/CodeEditorWorkspace';
import { EndInterviewDialog } from '../components/EndInterviewDialog';
import { InterviewCompletionScreen } from '../components/InterviewCompletionScreen';
import { useInterview } from '../../../shared/context/InterviewContext';
import { evaluateAnswer } from '../../../shared/utils/mockData';
import { soundEffects } from '../../../shared/utils/soundEffects';
import { Button } from '../../../shared/components/ui/Button';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import * as api from '../../../shared/utils/apiClient';
import { Code2, MessageSquare, Columns, AlertTriangle, ArrowLeft, Loader2, Play, SkipForward } from 'lucide-react';
import '../components/InterviewRoom.css';

export function InterviewRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    activeConfig,
    activeResume,
    currentSession,
    initializeInterviewSession,
    saveCompletedInterview,
  } = useInterview();

  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [aiStatus, setAiStatus] = useState('Asking'); // 'Asking' | 'Listening' | 'Thinking'
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('split'); // 'chat' | 'code' | 'split'

  // Initialize session safely and trigger fullscreen
  useEffect(() => {
    async function setupRoom() {
      try {
        setLoadingSession(true);
        let active = currentSession;

        // If no active session in context, check searchParams or initialize
        const sessionIdParam = searchParams.get('id');
        if (!active && sessionIdParam) {
          try {
            const res = await api.getSessionDetails(sessionIdParam);
            const payload = res.data || res;
            const jsonDoc = payload.sessionData || {};

            active = {
              id: payload.id,
              config: {
                role: payload.targetRole || 'Software Engineer',
                level: payload.seniorityLevel || 'Senior',
                difficulty: payload.difficulty || 'Medium',
                type: payload.interviewType || 'Technical',
                duration: payload.targetDurationMin || 30,
              },
              resume: {
                name: payload.originalFileName || 'Resume.pdf',
              },
              questions: (jsonDoc.generatedQuestions || []).map((q, idx) => ({
                id: q.id || `q_${idx + 1}`,
                question: q.question,
                category: q.category || payload.interviewType,
                difficulty: q.difficulty || payload.difficulty,
                expectedKeyPoints: q.expectedKeyPoints,
              })),
              totalDurationSeconds: (payload.targetDurationMin || 30) * 60,
              createdAt: payload.createdAt,
            };
          } catch (e) {
            console.warn('Could not fetch session by param:', e);
          }
        }

        if (!active) {
          active = initializeInterviewSession();
        }

        setSession(active);

        // Attempt auto fullscreen
        if (!document.fullscreenElement) {
          try {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          } catch {
            // Handled silently
          }
        }

        // Start with empty messages and AI in 'Asking' status
        setMessages([]);
        setAiStatus('Asking');

        const questionsList = active?.questions || [];
        const firstQ = questionsList[0];

        // Step 1: Deliver greeting introduction in real-time
        setTimeout(() => {
          soundEffects.playPop();
          setMessages([
            {
              id: 'msg_ai_init',
              sender: 'ai',
              text: `Hello, and welcome to your ${active?.config?.level || 'Senior'} ${active?.config?.type || 'Technical'} interview session! I'm Alex, your AI interviewer. I'll be evaluating your system knowledge, architecture decisions, and problem-solving depth. Let's begin!`,
              timestamp: new Date().toISOString(),
              category: 'Session Kickoff',
            },
          ]);

          // Step 2: Deliver Question 1 after greeting and then enable user input
          if (firstQ) {
            setTimeout(() => {
              soundEffects.playPop();
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg_ai_q_${firstQ.id || '1'}`,
                  sender: 'ai',
                  text: firstQ.question,
                  timestamp: new Date().toISOString(),
                  category: firstQ.category || 'General',
                },
              ]);
              setAiStatus('Listening'); // Inputs now enabled for the candidate!
            }, 1400);
          } else {
            setAiStatus('Listening');
          }
        }, 600);
      } catch (err) {
        console.error('Failed to setup interview room:', err);
      } finally {
        setLoadingSession(false);
      }
    }

    setupRoom();
  }, []);

  const currentQ = session?.questions?.[currentQuestionIndex];
  const isCodingActive = Boolean(currentQ?.isCoding);
  const isInputDisabled = aiStatus === 'Asking' || aiStatus === 'Thinking';

  // Automatically activate split view for coding questions and revert to chat for non-coding questions
  useEffect(() => {
    if (isCodingActive) {
      setViewMode('split');
    } else {
      setViewMode('chat');
    }
  }, [currentQuestionIndex, isCodingActive]);

  const handleSendMessage = ({ text, note }) => {
    if (!session || !session.questions?.length) return;

    // 1. Add User Message
    const userMsgId = `msg_user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text,
      note,
      timestamp: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAiStatus('Thinking');

    // 2. Evaluate current answer via Google Gemini backend API
    const currentQuestion = session.questions[currentQuestionIndex];
    let evalResult = evaluateAnswer(currentQuestion?.question || '', text);

    // Call backend API in parallel
    if (session.id && !session.id.startsWith('int_')) {
      api.submitQuestionAnswer(session.id, currentQuestion?.id || `q_${currentQuestionIndex + 1}`, text)
        .then((res) => {
          if (res?.evaluatedQuestion) {
            evalResult = {
              score: res.evaluatedQuestion.score || evalResult.score,
              feedback: res.evaluatedQuestion.aiFeedback || evalResult.feedback,
            };
          }
        })
        .catch((e) => console.warn('Answer submit backend sync notice:', e));
    }

    // 3. Record Answer Data
    const updatedAnswered = [
      ...answeredQuestions,
      {
        id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
        question: currentQuestion?.question || '',
        category: currentQuestion?.category || session.config?.type,
        difficulty: currentQuestion?.difficulty || session.config?.difficulty,
        userAnswer: text,
        feedback: evalResult.feedback,
        score: evalResult.score,
      },
    ];
    setAnsweredQuestions(updatedAnswered);

    // 4. AI Follow-up & Next Question Transition
    setTimeout(() => {
      soundEffects.playPop();

      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < session.questions.length) {
        const nextQ = session.questions[nextIdx];
        setCurrentQuestionIndex(nextIdx);

        const aiMsg = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: nextQ.question,
          timestamp: new Date().toISOString(),
          category: nextQ.category,
          feedback: evalResult.feedback,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setAiStatus('Listening');
      } else {
        // Complete the interview
        completeSession(updatedAnswered);
      }
    }, 1400);
  };

  const handleSubmitCode = ({ code, language, feedback, score }) => {
    if (!session || !session.questions?.length) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    const userMsg = {
      id: `msg_user_code_${Date.now()}`,
      sender: 'user',
      text: `\`\`\`${language}\n${code}\n\`\`\``,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAiStatus('Thinking');

    const updatedAnswered = [
      ...answeredQuestions,
      {
        id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
        question: currentQuestion?.question || '',
        category: currentQuestion?.category || session.config?.type,
        difficulty: currentQuestion?.difficulty || session.config?.difficulty,
        userAnswer: code,
        feedback,
        score,
        code,
        language,
      },
    ];
    setAnsweredQuestions(updatedAnswered);

    setTimeout(() => {
      soundEffects.playPop();

      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < session.questions.length) {
        const nextQ = session.questions[nextIdx];
        setCurrentQuestionIndex(nextIdx);

        const aiMsg = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: nextQ.question,
          timestamp: new Date().toISOString(),
          category: nextQ.category,
          feedback: `AI Code Review: ${feedback}`,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setAiStatus('Listening');
      } else {
        completeSession(updatedAnswered);
      }
    }, 1500);
  };

  const handleConfirmSkipQuestion = () => {
    setShowSkipModal(false);
    if (!session || !session.questions?.length) return;

    const currentQuestion = session.questions[currentQuestionIndex];

    // 1. Add candidate skip note in chat transcript
    const userMsg = {
      id: `msg_user_skip_${Date.now()}`,
      sender: 'user',
      text: `[Skipped Question]`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAiStatus('Thinking');

    // 2. Record skipped question data (strict 0% score)
    const updatedAnswered = [
      ...answeredQuestions,
      {
        id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
        question: currentQuestion?.question || '',
        category: currentQuestion?.category || session.config?.type,
        difficulty: currentQuestion?.difficulty || session.config?.difficulty,
        idealAnswer: currentQuestion?.idealAnswer,
        userAnswer: '[Skipped by Candidate]',
        feedback: 'This question was skipped without an answer. Review the recommended ideal answer below to study the best approach.',
        score: 0,
      },
    ];
    setAnsweredQuestions(updatedAnswered);

    // 3. AI polite transition & advance to next question
    setTimeout(() => {
      soundEffects.playPop();

      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < session.questions.length) {
        const nextQ = session.questions[nextIdx];
        setCurrentQuestionIndex(nextIdx);

        const aiMsg = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: nextQ.question,
          timestamp: new Date().toISOString(),
          category: nextQ.category,
          feedback: `No problem at all! Let's proceed to the next question.`,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setAiStatus('Listening');
      } else {
        // Complete the interview if last question was skipped
        completeSession(updatedAnswered);
      }
    }, 900);
  };

  const completeSession = (finishedQuestions) => {
    setAiStatus('Asking');
    const questionsToScore = (finishedQuestions && finishedQuestions.length > 0) ? finishedQuestions : answeredQuestions;
    const avgScore = questionsToScore.length > 0
      ? Math.round(questionsToScore.reduce((sum, q) => sum + (q.score ?? 0), 0) / questionsToScore.length)
      : 0;

    const completedData = {
      id: session?.id || `int_${Date.now()}`,
      title: session?.title || `${session?.config?.level || 'Senior'} ${session?.config?.type || 'Technical'} Interview`,
      config: session?.config || activeConfig,
      resume: session?.resume || activeResume,
      score: avgScore,
      durationSpentSeconds: (currentQuestionIndex + 1) * 240,
      subScores: avgScore === 0
        ? { technical: 0, communication: 0, problemSolving: 0, confidence: 0 }
        : {
            technical: Math.min(100, Math.max(0, avgScore + 3)),
            communication: Math.min(100, Math.max(0, avgScore - 3)),
            problemSolving: avgScore,
            confidence: Math.min(100, Math.max(0, avgScore + 1)),
          },
      questions: questionsToScore.map((q) => {
        const origQ = session?.questions?.find((sq) => sq.id === q.id);
        return {
          ...q,
          idealAnswer: q.idealAnswer || origQ?.idealAnswer,
        };
      }),
    };

    // 1. Exit fullscreen mode immediately
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch {
        // Handled silently
      }
    }

    // 2. Save into context and sync with backend
    saveCompletedInterview(completedData);

    if (session?.id && !session.id.startsWith('int_')) {
      api.completeSession(session.id, {
        totalScore: avgScore,
        answers: questionsToScore.map((q) => ({
          questionId: q.id,
          userAnswer: q.userAnswer,
          score: q.score,
          feedback: q.feedback,
        })),
      }).catch((e) => console.warn('Could not sync completion to backend:', e));
    }

    // 3. Seamlessly redirect to the standard result page with Sidebar and Header
    navigate('/interviews/result', {
      state: { results: completedData, sessionId: completedData.id },
      replace: true,
    });
  };

  const handleEndInterviewEarly = () => {
    setShowEndDialog(false);
    completeSession(answeredQuestions);
  };

  const handlePracticeAgain = () => {
    setIsCompleted(false);
    setMessages([]);
    setCurrentQuestionIndex(0);
    const newSession = initializeInterviewSession();
    setSession(newSession);

    const questionsList = newSession?.questions || [];
    const firstQ = questionsList[0];

    const initialMsgs = [
      {
        id: `msg_ai_init_${Date.now()}`,
        sender: 'ai',
        text: `Starting a fresh practice session. Focus on structured delivery!`,
        timestamp: new Date().toISOString(),
      },
    ];

    if (firstQ) {
      initialMsgs.push({
        id: `msg_ai_q_${firstQ.id || '1'}`,
        sender: 'ai',
        text: firstQ.question,
        timestamp: new Date().toISOString(),
        category: firstQ.category || 'General',
      });
    }

    setMessages(initialMsgs);
    setAiStatus('Listening');
  };

  if (loadingSession) {
    return (
      <div className="interview-room-fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 size={40} className="stage-spinner" style={{ color: 'var(--color-primary)' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>Connecting to AI Interview Room...</span>
        </div>
      </div>
    );
  }

  // Graceful fallback if no questions were generated or loaded
  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="interview-room-fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-panel" style={{ maxWidth: 500, padding: 32, textAlign: 'center', borderRadius: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-warning)', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--text-main)' }}>No Active Interview Session</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5 }}>
            An active interview session could not be found. Please start a new interview session from the builder or select a resume from your vault.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="gradient" icon={Play} onClick={() => navigate('/interviews/new')}>
              Start New Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room-fullscreen">
      {/* Top Header */}
      <InterviewHeader
        title={`${session.config?.level || 'Senior'} ${session.config?.type || 'Technical'} Interview`}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={session.questions.length}
        totalSeconds={session.totalDurationSeconds || 1800}
        questionSource={currentQ?.source || session.questions?.[0]?.source}
        onEndInterview={() => setShowEndDialog(true)}
      />

      {isCompleted ? (
        <div className="completion-container">
          <InterviewCompletionScreen
            results={results}
            onPracticeAgain={handlePracticeAgain}
          />
        </div>
      ) : (
        <div className="room-body-layout">
          {/* Left AI Avatar & Status Panel */}
          <AIAvatarPanel
            status={aiStatus}
            interviewerName="Alex"
            activeCategory={currentQ?.category}
          />

          {/* Center Area: Full Chat if non-coding, or Split Workspace if coding task is active */}
          {isCodingActive ? (
            <div className="room-center-workspace animate-fade-in">
              {/* View Mode Switcher Header only visible when coding challenge is active */}
              <div className="workspace-mode-strip">
                <div className="mode-tabs-row">
                  <button
                    type="button"
                    onClick={() => setViewMode('chat')}
                    className={`mode-tab-btn ${viewMode === 'chat' ? 'active' : ''}`}
                  >
                    <MessageSquare size={14} />
                    <span>Conversation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`mode-tab-btn ${viewMode === 'split' ? 'active' : ''}`}
                  >
                    <Columns size={14} />
                    <span>Split View (Chat + IDE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('code')}
                    className={`mode-tab-btn ${viewMode === 'code' ? 'active' : ''}`}
                  >
                    <Code2 size={14} />
                    <span>Live Code IDE</span>
                    <span className="coding-q-pill">Coding Task Active</span>
                  </button>
                </div>
              </div>

              {/* Main Interactive Grid */}
              <div className={`workspace-content-grid mode-${viewMode}`}>
                {/* Chat Transcript & Input */}
                {(viewMode === 'chat' || viewMode === 'split') && (
                  <main className="room-chat-pane">
                    <ChatTranscript
                      messages={messages}
                      isAIThinking={isInputDisabled}
                    />

                    <ChatInputBar
                      onSendMessage={handleSendMessage}
                      onSkipQuestion={() => setShowSkipModal(true)}
                      disabled={isInputDisabled}
                    />
                  </main>
                )}

                {/* Live Code Workspace */}
                {(viewMode === 'code' || viewMode === 'split') && (
                  <CodeEditorWorkspace
                    question={currentQ}
                    onSubmitCode={handleSubmitCode}
                    onSkipQuestion={() => setShowSkipModal(true)}
                    disabled={isInputDisabled}
                  />
                )}
              </div>
            </div>
          ) : (
            <main className="room-chat-pane animate-fade-in">
              <ChatTranscript
                messages={messages}
                isAIThinking={isInputDisabled}
              />

              <ChatInputBar
                onSendMessage={handleSendMessage}
                onSkipQuestion={() => setShowSkipModal(true)}
                disabled={isInputDisabled}
              />
            </main>
          )}
        </div>
      )}

      {/* Skip Question Confirmation Modal */}
      <ConfirmModal
        isOpen={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        onConfirm={handleConfirmSkipQuestion}
        title="Skip This Question?"
        message={`Are you sure you want to skip Question ${currentQuestionIndex + 1}? Alex will move directly to the next question.`}
        confirmLabel="Yes, Skip Question"
        cancelLabel="Keep Answering"
        variant="warning"
        icon={SkipForward}
      />

      {/* End Interview Confirmation Modal */}
      <EndInterviewDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={handleEndInterviewEarly}
      />
    </div>
  );
}
