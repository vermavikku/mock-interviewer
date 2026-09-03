import React, { useState, useEffect, useRef } from 'react';
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
import * as api from '../../../shared/utils/apiClient';
import {
  Code2,
  MessageSquare,
  Columns,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Play,
  SkipForward,
  BookOpen,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
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
  const [codeMap, setCodeMap] = useState({}); // Per-question code cache
  const activeSessionRef = useRef(null);

  // Staged AI intro & typewriter reveal
  useEffect(() => {
    let cancelled = false;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const typeOutMessage = (id, category, fullText) =>
      new Promise((resolve) => {
        if (cancelled) return resolve();

        soundEffects.playPop();
        setMessages((prev) => [
          ...prev,
          { id, sender: 'ai', text: '', timestamp: new Date().toISOString(), category },
        ]);

        const tickCount = 70;
        const step = Math.max(1, Math.ceil(fullText.length / tickCount));
        const speed = Math.max(8, Math.round(1400 / tickCount));
        let i = 0;

        const interval = setInterval(() => {
          if (cancelled) {
            clearInterval(interval);
            return resolve();
          }
          i = Math.min(fullText.length, i + step);
          const partial = fullText.slice(0, i);
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: partial } : m)));

          if (i >= fullText.length) {
            clearInterval(interval);
            resolve();
          }
        }, speed);
      });

    async function setupRoom() {
      try {
        setLoadingSession(true);
        let active = currentSession;

        const sessionIdParam = searchParams.get('id') || searchParams.get('sessionId');
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
                isCoding: Boolean(q.isCoding || q.section === 'CODING'),
                section: q.section || (q.isCoding ? 'CODING' : 'THEORY'),
                codingDetails: q.codingDetails,
                idealAnswer: q.idealAnswer,
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
        activeSessionRef.current = active;

        // Auto fullscreen attempt
        if (!document.fullscreenElement) {
          try {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          } catch {}
        }

        setMessages([]);
        setAiStatus('Asking');

        const questionsList = active?.questions || [];
        const firstQ = questionsList[0];

        const theoryCount = questionsList.filter((q) => !q.isCoding).length;
        const codingCount = questionsList.filter((q) => q.isCoding).length;

        let greetingText = `Hello, and welcome to your ${active?.config?.level || 'Senior'} ${active?.config?.type || 'Technical'} interview session! I'm Alex, your AI interviewer.`;
        if (theoryCount > 0 && codingCount > 0) {
          greetingText += ` Today's session is structured into 2 sections: Section 1 covers ${theoryCount} Resume & Technical Theory questions in chat, followed by Section 2 with ${codingCount} live hands-on coding challenges in our integrated IDE. Let's begin!`;
        } else {
          greetingText += ` I'll be evaluating your system knowledge, architecture decisions, and problem-solving depth. Let's begin!`;
        }

        await wait(600);
        if (cancelled) return;
        await typeOutMessage('msg_ai_init', 'Session Kickoff', greetingText);
        if (cancelled) return;

        setAiStatus('Thinking');
        await wait(900);
        if (cancelled) return;
        setAiStatus('Asking');

        if (firstQ) {
          await typeOutMessage(
            `msg_ai_q_${firstQ.id || 'q1'}_${Date.now()}`,
            firstQ.category || (firstQ.isCoding ? 'Coding Challenge' : 'Technical Theory'),
            firstQ.question,
          );
          if (cancelled) return;
        }

        setAiStatus('Listening');
      } catch (err) {
        console.error('Failed to setup interview room:', err);
        setAiStatus('Listening');
      } finally {
        if (!cancelled) {
          setLoadingSession(false);
        }
      }
    }

    setupRoom();

    return () => {
      cancelled = true;
    };
  }, []);

  const allQuestions = session?.questions || [];
  const currentQ = allQuestions[currentQuestionIndex];
  const isCodingActive = Boolean(currentQ?.isCoding);
  const currentSection = isCodingActive ? 'CODING' : 'THEORY';

  const theoryQuestions = allQuestions.filter((q) => !q.isCoding);
  const codingQuestions = allQuestions.filter((q) => q.isCoding);

  const isInputDisabled = aiStatus === 'Asking' || aiStatus === 'Thinking';

  // Automatically adjust view mode on question change
  useEffect(() => {
    if (isCodingActive) {
      setViewMode('split');
    } else {
      setViewMode('chat');
    }
  }, [currentQuestionIndex, isCodingActive]);

  const handleCodeChange = (qId, newCode) => {
    if (!qId) return;
    setCodeMap((prev) => ({ ...prev, [qId]: newCode }));
  };

  // Deliver next question or complete interview
  const advanceToQuestion = async (nextIndex) => {
    if (nextIndex < allQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      const nextQ = allQuestions[nextIndex];
      const prevQ = allQuestions[currentQuestionIndex];

      // Check if transitioning from Theory section to Coding section
      const isSectionTransition = !prevQ?.isCoding && nextQ?.isCoding;

      setAiStatus('Thinking');
      soundEffects.playPop();

      setTimeout(async () => {
        setAiStatus('Asking');

        if (isSectionTransition) {
          // Send section transition announcement
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_ai_transition_${Date.now()}`,
              sender: 'ai',
              text: `🎯 Excellent job on the technical and architectural concepts! We are now transitioning to Section 2: Live Hands-on Coding Challenges. The IDE workspace is now active for your coding challenges.`,
              timestamp: new Date().toISOString(),
              category: 'Section Transition',
            },
          ]);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg_ai_q_${nextQ.id || nextIndex + 1}_${Date.now()}`,
            sender: 'ai',
            text: nextQ.question,
            timestamp: new Date().toISOString(),
            category: nextQ.category || (nextQ.isCoding ? 'Coding Challenge' : 'Technical Theory'),
          },
        ]);
        setAiStatus('Listening');
      }, 700);
    } else {
      // Completed all questions
      completeSession(answeredQuestions);
    }
  };

  // Candidate sends text/theory answer
  const handleSendMessage = ({ text, note }) => {
    if (!session || !allQuestions.length) return;

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

    const currentQuestion = allQuestions[currentQuestionIndex];
    let evalResult = evaluateAnswer(currentQuestion?.question || '', text);

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

    const updatedAnswered = [
      ...answeredQuestions,
      {
        id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
        question: currentQuestion?.question || '',
        category: currentQuestion?.category || session.config?.type,
        userAnswer: text,
        score: evalResult.score,
        feedback: evalResult.feedback,
        isCoding: false,
        section: 'THEORY',
      },
    ];
    setAnsweredQuestions(updatedAnswered);

    setTimeout(() => {
      advanceToQuestion(currentQuestionIndex + 1);
    }, 1100);
  };

  // Candidate submits code solution from Black IDE
  const handleSubmitCode = ({ code, language, output, exitCode }) => {
    if (!session || !allQuestions.length) return;

    const currentQuestion = allQuestions[currentQuestionIndex];
    const userMsgId = `msg_user_code_${Date.now()}`;

    const submissionText = `\`\`\`${language}\n${code}\n\`\`\`${
      output ? `\n\n**Compiler Output:**\n\`\`\`\n${output}\n\`\`\`` : ''
    }`;

    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: submissionText,
      timestamp: new Date().toISOString(),
      isCode: true,
      code,
      language,
      output,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAiStatus('Thinking');

    let evalResult = {
      score: exitCode === 0 ? 80 : 50,
      feedback: `Code solution submitted in ${language}. Program ${
        exitCode === 0 ? 'compiled and executed successfully with exit status 0.' : 'executed with exit status 1.'
      }`,
    };

    if (session.id && !session.id.startsWith('int_')) {
      api.submitQuestionAnswer(session.id, currentQuestion?.id || `q_${currentQuestionIndex + 1}`, submissionText)
        .then((res) => {
          if (res?.evaluatedQuestion) {
            evalResult = {
              score: res.evaluatedQuestion.score || evalResult.score,
              feedback: res.evaluatedQuestion.aiFeedback || evalResult.feedback,
            };
          }
        })
        .catch((e) => console.warn('Code answer submit backend sync notice:', e));
    }

    const updatedAnswered = [
      ...answeredQuestions,
      {
        id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
        question: currentQuestion?.question || '',
        category: currentQuestion?.category || 'Data Structures & Algorithms',
        userAnswer: submissionText,
        score: evalResult.score,
        feedback: evalResult.feedback,
        isCoding: true,
        section: 'CODING',
        code,
        language,
        output,
      },
    ];
    setAnsweredQuestions(updatedAnswered);

    setTimeout(() => {
      advanceToQuestion(currentQuestionIndex + 1);
    }, 1100);
  };

  const handleConfirmSkipQuestion = () => {
    setShowSkipModal(false);
    const currentQuestion = allQuestions[currentQuestionIndex];
    const skippedAnswer = {
      id: currentQuestion?.id || `q_${currentQuestionIndex + 1}`,
      question: currentQuestion?.question || '',
      category: currentQuestion?.category || session?.config?.type,
      userAnswer: '[Skipped by Candidate]',
      score: 0,
      feedback: 'Question skipped without answer submission. Review the ideal response to practice this topic.',
      isCoding: isCodingActive,
      section: isCodingActive ? 'CODING' : 'THEORY',
    };

    const updatedAnswered = [...answeredQuestions, skippedAnswer];
    setAnsweredQuestions(updatedAnswered);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_skip_${Date.now()}`,
        sender: 'user',
        text: '⏩ *Question skipped by candidate.*',
        timestamp: new Date().toISOString(),
      },
    ]);

    advanceToQuestion(currentQuestionIndex + 1);
  };

  const completeSession = (questionsAnswered) => {
    setIsCompleted(true);
    soundEffects.playSuccess();

    const questionsToScore =
      questionsAnswered.length > 0
        ? questionsAnswered
        : (allQuestions || []).map((q, idx) => ({
            id: q.id || `q_${idx + 1}`,
            question: q.question,
            category: q.category || session?.config?.type,
            userAnswer: '[Session Ended Early]',
            score: 0,
            feedback: 'No answer recorded for this question.',
            isCoding: q.isCoding,
            section: q.section || (q.isCoding ? 'CODING' : 'THEORY'),
          }));

    const validScores = questionsToScore.filter((q) => typeof q.score === 'number');
    const avgScore = validScores.length
      ? Math.round(validScores.reduce((acc, q) => acc + q.score, 0) / validScores.length)
      : 0;

    const completedData = {
      id: session?.id || `int_${Date.now()}`,
      title: `${session?.config?.level || 'Senior'} ${session?.config?.type || 'Technical'} Interview`,
      date: new Date().toISOString(),
      role: session?.config?.role || 'Full Stack Engineer',
      level: session?.config?.level || 'Senior',
      type: session?.config?.type || 'Technical',
      difficulty: session?.config?.difficulty || 'Medium',
      durationMinutes: Math.round(((session?.totalDurationSeconds || 1800) / 60) * 0.75),
      overallScore: avgScore,
      subScores: {
        technical: Math.min(100, Math.max(0, avgScore + 2)),
        communication: Math.min(100, Math.max(0, avgScore - 2)),
        problemSolving: avgScore,
        confidence: Math.min(100, Math.max(0, avgScore + 1)),
      },
      questions: questionsToScore.map((q) => {
        const origQ = allQuestions.find((sq) => sq.id === q.id);
        return {
          ...q,
          isCoding: q.isCoding || origQ?.isCoding,
          codingDetails: q.codingDetails || origQ?.codingDetails,
          code: q.code || origQ?.code,
          language: q.language || origQ?.language || origQ?.codingDetails?.language,
          idealAnswer: q.idealAnswer || origQ?.idealAnswer,
        };
      }),
    };

    if (document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch {}
    }

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

    navigate('/interviews/result', {
      state: { results: completedData, sessionId: completedData.id },
      replace: true,
    });
  };

  const handleEndInterviewEarly = () => {
    setShowEndDialog(false);
    completeSession(answeredQuestions);
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

  if (!session || !allQuestions.length) {
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
      {/* Top Navigation & Status Bar */}
      <InterviewHeader
        title={`${session.config?.level || 'Senior'} ${session.config?.type || 'Technical'} Interview`}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={allQuestions.length}
        totalSeconds={session.totalDurationSeconds || 1800}
        questionSource={currentQ?.source || allQuestions[0]?.source}
        currentSection={currentSection}
        theoryCount={theoryQuestions.length}
        codingCount={codingQuestions.length}
        onEndInterview={() => setShowEndDialog(true)}
      />

      {/* Section Quick Navigation Bar */}
      {theoryQuestions.length > 0 && codingQuestions.length > 0 && (
        <div className="section-navigator-strip">
          <div className="section-tabs-group">
            <div className={`section-pill ${currentSection === 'THEORY' ? 'active-theory' : 'done'}`}>
              <BookOpen size={14} />
              <span>Section 1: Resume & Technical Theory</span>
              <span className="count-tag">{theoryQuestions.length} Qs</span>
            </div>

            <ChevronRight size={16} className="section-arrow" />

            <div className={`section-pill ${currentSection === 'CODING' ? 'active-coding' : 'upcoming'}`}>
              <Code2 size={14} />
              <span>Section 2: Live Hands-on Coding</span>
              <span className="count-tag">{codingQuestions.length} Tasks</span>
            </div>
          </div>

          <div className="question-stepper-row">
            {allQuestions.map((q, idx) => {
              const isDone = idx < currentQuestionIndex;
              const isCurrent = idx === currentQuestionIndex;
              const isCoding = q.isCoding;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`step-btn ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isCoding ? 'is-code-step' : ''}`}
                  title={`Question ${idx + 1}: ${isCoding ? 'Coding Challenge' : 'Theory Question'}`}
                >
                  {isDone ? <CheckCircle2 size={12} /> : idx + 1}
                  {isCoding && <span className="code-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isCompleted ? (
        <div className="completion-container">
          <InterviewCompletionScreen
            results={results}
            onPracticeAgain={() => navigate('/interviews/new')}
          />
        </div>
      ) : (
        <div className="room-body-layout">
          {/* Left AI Avatar & Status Panel */}
          <AIAvatarPanel
            status={aiStatus}
            interviewerName="Alex"
            activeCategory={currentQ?.category || (isCodingActive ? 'Coding Challenge' : 'Technical Theory')}
          />

          {/* Center Area: Full Chat if Theory question, or Interactive Split Workspace if Coding question */}
          {isCodingActive ? (
            <div className="room-center-workspace animate-fade-in">
              {/* Workspace View Mode Switcher */}
              <div className="workspace-mode-strip">
                <div className="mode-tabs-row">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`mode-tab-btn ${viewMode === 'split' ? 'active' : ''}`}
                  >
                    <Columns size={14} />
                    <span>Split Screen (Chat + IDE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('code')}
                    className={`mode-tab-btn ${viewMode === 'code' ? 'active' : ''}`}
                  >
                    <Code2 size={14} />
                    <span>Full Live IDE</span>
                    <span className="coding-q-pill">Coding Task Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('chat')}
                    className={`mode-tab-btn ${viewMode === 'chat' ? 'active' : ''}`}
                  >
                    <MessageSquare size={14} />
                    <span>Chat Transcript</span>
                  </button>
                </div>
              </div>

              {/* Main Interactive Grid */}
              <div className={`workspace-content-grid mode-${viewMode}`}>
                {/* Chat Transcript & Voice/Text Bar */}
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

                {/* Persistent Live Code Workspace */}
                {(viewMode === 'code' || viewMode === 'split') && (
                  <CodeEditorWorkspace
                    question={currentQ}
                    userCode={codeMap[currentQ?.id]}
                    onCodeChange={handleCodeChange}
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

      {/* Skip Question Modal */}
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

      {/* End Interview Early Modal */}
      <EndInterviewDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={handleEndInterviewEarly}
      />
    </div>
  );
}
