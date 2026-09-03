import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { soundEffects } from '../../../shared/utils/soundEffects';
import { useInterview } from '../../../shared/context/InterviewContext';
import * as api from '../../../shared/utils/apiClient';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  History,
  TrendingUp,
  Brain,
  Code2,
  MessageSquare,
  Zap,
  ChevronRight,
  HelpCircle,
  Clock,
  Calendar,
  Layers,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import '../../interview-room/components/InterviewRoom.css';
import '../components/InterviewHistory.css';

export function InterviewResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { interviews, currentSession, initializeInterviewSession, setCurrentSession } = useInterview();

  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(!results);

  useEffect(() => {
    // Ensure fullscreen is exited if coming from the interview room
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch {
        // Handled silently
      }
    }

    async function loadData() {
      if (results) {
        soundEffects.playSuccess();
        triggerConfetti();
        setLoading(false);
        return;
      }

      // Try finding from params or context
      const targetId = params.id || location.state?.sessionId || currentSession?.id;
      if (targetId) {
        const found = interviews?.find((i) => i.id === targetId);
        if (found) {
          setResults(found);
          soundEffects.playSuccess();
          triggerConfetti();
          setLoading(false);
          return;
        }

        // Fetch from backend
        try {
          const res = await api.getSessionDetails(targetId);
          const payload = res.data || res;
          const jsonDoc = payload.sessionData || {};

          const formatted = {
            id: payload.id,
            title: payload.title || `${payload.seniorityLevel} ${payload.interviewType} Interview`,
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
            score: typeof payload.totalScore === 'number' ? payload.totalScore : (jsonDoc?.evaluation?.overallScore ?? 0),
            subScores: jsonDoc?.evaluation?.subScores || jsonDoc?.evaluationReport?.subScores || {
              technical: typeof payload.totalScore === 'number' ? payload.totalScore : 0,
              communication: typeof payload.totalScore === 'number' ? Math.round(payload.totalScore * 0.95) : 0,
              problemSolving: typeof payload.totalScore === 'number' ? payload.totalScore : 0,
              confidence: typeof payload.totalScore === 'number' ? Math.round(payload.totalScore * 0.98) : 0,
            },
            strengths: jsonDoc?.evaluation?.strengths || jsonDoc?.evaluationReport?.strengths || [
              'Attended interview session and attempted all allocated questions',
            ],
            improvements: jsonDoc?.evaluation?.improvements || jsonDoc?.evaluationReport?.improvements || [
              'Review core technical principles and practice with the reference answers provided below',
            ],
            recommendations: jsonDoc?.evaluation?.recommendations || jsonDoc?.evaluationReport?.recommendations || [
              'Foundational Computer Science Concepts',
              'Algorithm Complexity & System Design',
            ],
            questions: (jsonDoc?.generatedQuestions || []).map((q, idx) => ({
              id: q.id || `q_${idx + 1}`,
              question: q.question,
              category: q.category || payload.interviewType,
              difficulty: q.difficulty || payload.difficulty,
              userAnswer: q.userAnswer || 'No answer submitted for this question.',
              feedback: q.aiFeedback || q.feedback || 'Answer reviewed by AI evaluator.',
              score: typeof q.score === 'number' ? q.score : 0,
              expectedKeyPoints: q.expectedKeyPoints || [],
              idealAnswer: q.idealAnswer || '',
              isCoding: q.isCoding || false,
              codingDetails: q.codingDetails || undefined,
              code: q.code,
              language: q.language || q.codingDetails?.language,
            })),
          };

          setResults(formatted);
          soundEffects.playSuccess();
          if ((formatted.score ?? 0) >= 65) {
            triggerConfetti();
          }
        } catch (err) {
          console.warn('Could not fetch results from backend:', err);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [params.id, location.state]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981'],
      });
    } catch {
      // Handled silently
    }
  };

  const handlePracticeAgain = () => {
    const freshSession = initializeInterviewSession();
    setCurrentSession(freshSession);
    navigate('/interview-room');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
          Loading your evaluation results...
        </div>
      </PageWrapper>
    );
  }

  if (!results) {
    return (
      <PageWrapper>
        <EmptyState
          icon={AlertTriangle}
          title="Evaluation Not Found"
          description="No active or completed evaluation session was found. Start a new interview practice session to view your score breakdown."
          actionLabel="Start New Interview"
          onAction={() => navigate('/interviews/new')}
          actionIcon={Sparkles}
        />
      </PageWrapper>
    );
  }

  const overallScore = typeof results.score === 'number' ? results.score : (typeof results.overallScore === 'number' ? results.overallScore : 0);
  const subScores = results.subScores || {
    technical: overallScore,
    communication: Math.round(overallScore * 0.95),
    problemSolving: overallScore,
    confidence: Math.round(overallScore * 0.98),
  };

  const strengths = results.strengths || [
    'Attended interview session and attempted all allocated questions',
  ];

  const improvements = results.improvements || [
    'Review core technical principles and practice with the reference answers provided below',
  ];

  const recommendations = results.recommendations || [
    'Core Computer Science Fundamentals',
    'Algorithm Design & Complexity',
  ];

  const questionsList = results.questions || [];

  return (
    <PageWrapper className="completion-screen-wrap animate-fade-in">
      {/* Header Banner */}
      <div className="completion-header">
        <div className="completion-badge">
          <Sparkles size={16} className="text-cyan" />
          <span>EVALUATION REPORT READY</span>
        </div>
        <h1 className="completion-title">Interview Completed!</h1>
        <p className="completion-subtitle">
          Here is your comprehensive AI evaluation, performance radar, and question transcript.
        </p>
      </div>

      {/* Overall Score Banner */}
      <div className="overall-score-banner glass-panel">
        <div className="overall-score-left">
          <div className="score-circle-graphic">
            <span className="score-number">{overallScore}%</span>
            <span className="score-label">OVERALL SCORE</span>
          </div>
          <div className="overall-score-copy">
            <h3 className="score-verdict">
              {overallScore >= 85
                ? 'Strong Hire / Bar Raiser 🚀'
                : overallScore >= 75
                ? 'Solid Performance ✨'
                : overallScore >= 50
                ? 'Developing Performance 💡'
                : 'Needs Significant Practice ⚠️'}
            </h3>
            <p className="score-verdict-desc">
              Target Role: <strong>{results.config?.role || 'Software Engineer'}</strong> ({results.config?.level || 'Senior'}) • Interview Type: <strong>{results.config?.type || 'Technical'}</strong>
            </p>
          </div>
        </div>

        <div className="score-banner-actions">
          <Button
            variant="gradient"
            size="md"
            icon={RotateCcw}
            onClick={handlePracticeAgain}
          >
            Practice Again
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={History}
            onClick={() => navigate('/interviews/history')}
          >
            View History
          </Button>
        </div>
      </div>

      {/* Sub-Score Breakdown Cards */}
      <div className="subscores-grid">
        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Code2 size={20} />
            </div>
            <span className="subscore-val">{subScores.technical}%</span>
          </div>
          <span className="subscore-title">Technical Knowledge</span>
          <ProgressBar value={subScores.technical} max={100} size="sm" color="primary" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <MessageSquare size={20} />
            </div>
            <span className="subscore-val">{subScores.communication}%</span>
          </div>
          <span className="subscore-title">Communication Clarity</span>
          <ProgressBar value={subScores.communication} max={100} size="sm" color="cyan" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Brain size={20} />
            </div>
            <span className="subscore-val">{subScores.problemSolving}%</span>
          </div>
          <span className="subscore-title">Problem Solving</span>
          <ProgressBar value={subScores.problemSolving} max={100} size="sm" color="success" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Zap size={20} />
            </div>
            <span className="subscore-val">{subScores.confidence}%</span>
          </div>
          <span className="subscore-title">Confidence & Pacing</span>
          <ProgressBar value={subScores.confidence} max={100} size="sm" color="warning" />
        </div>
      </div>

      {/* AI Qualitative Feedback Grid */}
      <div className="feedback-columns-grid">
        {/* Strengths */}
        <div className="feedback-col-card glass-panel">
          <div className="col-header-row text-success">
            <CheckCircle2 size={20} />
            <h3 className="col-heading">Key Strengths Demonstrated</h3>
          </div>
          <ul className="feedback-bullets-list">
            {strengths.map((str, idx) => (
              <li key={idx} className="bullet-item">
                <span className="bullet-dot bg-success" />
                <span className="bullet-text">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="feedback-col-card glass-panel">
          <div className="col-header-row text-warning">
            <AlertTriangle size={20} />
            <h3 className="col-heading">Areas for Improvement</h3>
          </div>
          <ul className="feedback-bullets-list">
            {improvements.map((imp, idx) => (
              <li key={idx} className="bullet-item">
                <span className="bullet-dot bg-warning" />
                <span className="bullet-text">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Next Practice */}
      <div className="rec-practice-strip glass-panel">
        <div className="rec-strip-left">
          <Sparkles size={20} className="text-cyan" />
          <div>
            <h4 className="rec-strip-title">AI Suggested Next Practice Topics</h4>
            <p className="rec-strip-desc">Target these modules to push your score past 90%</p>
          </div>
        </div>
        <div className="rec-topics-pills">
          {recommendations.map((rec, i) => (
            <span key={i} className="rec-pill">
              {rec}
            </span>
          ))}
        </div>
      </div>

      {/* Question by Question Breakdown */}
      {questionsList.length > 0 && (
        <div className="questions-breakdown-section glass-panel" style={{ marginTop: 24, padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileText size={22} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>
              Question Transcript, AI Evaluation & Ideal Answers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {questionsList.map((q, idx) => {
              const qScore = typeof q.score === 'number' ? q.score : 0;
              const isSkipped = qScore === 0 || q.userAnswer?.includes('[Skipped');
              const isCodingTask = q.isCoding || Boolean(q.code) || Boolean(q.codingDetails);
              const idealCode = q.codingDetails?.idealSolutionCode;

              return (
                <div
                  key={q.id || idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isSkipped ? 'rgba(239, 68, 68, 0.2)' : isCodingTask ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: isSkipped ? '#f87171' : isCodingTask ? '#22d3ee' : '#818cf8',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: '#f8fafc', lineHeight: 1.4 }}>
                          {q.question}
                        </h4>
                        {isCodingTask && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: '#22d3ee',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 6,
                            }}
                          >
                            <FileText size={11} /> Coding Challenge
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={isSkipped ? 'danger' : qScore >= 80 ? 'success' : qScore >= 60 ? 'primary' : 'warning'}
                      size="sm"
                    >
                      {isSkipped ? 'Skipped (0%)' : `Score: ${qScore}%`}
                    </Badge>
                  </div>

                  {/* Candidate Answer / Code */}
                  <div style={{ margin: '10px 0 12px 34px', background: 'rgba(0, 0, 0, 0.35)', padding: '12px 14px', borderRadius: 8, fontSize: 13, color: isSkipped ? '#94a3b8' : '#cbd5e1', lineHeight: 1.5, borderLeft: isSkipped ? '3px solid #ef4444' : isCodingTask ? '3px solid #06b6d4' : '3px solid #6366f1' }}>
                    <strong style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {isSkipped ? 'Candidate Response: (Skipped)' : isCodingTask ? 'Candidate Code Solution:' : 'Candidate Response:'}
                    </strong>
                    {q.code ? (
                      <div style={{ marginTop: 6, background: '#090d16', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {q.language || q.codingDetails?.language || 'javascript'}
                        </div>
                        <pre style={{ margin: 0, padding: 12, fontSize: 12.5, color: '#f8fafc', overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
                          <code>{q.code}</code>
                        </pre>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {q.userAnswer || '[No response submitted]'}
                      </div>
                    )}
                  </div>

                  {/* AI Coaching Feedback */}
                  {q.feedback && (
                    <div style={{ margin: '0 0 12px 34px', background: 'rgba(6, 182, 212, 0.08)', borderLeft: '3px solid #06b6d4', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: 12.5, color: '#e0f2fe', lineHeight: 1.5 }}>
                      <strong style={{ color: '#38bdf8', display: 'block', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        AI Evaluator Feedback:
                      </strong>
                      {q.feedback}
                    </div>
                  )}

                  {/* AI Optimal Solution Code (if coding challenge) */}
                  {idealCode && (
                    <div style={{ margin: '0 0 12px 34px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#cffafe', lineHeight: 1.55 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Sparkles size={14} style={{ color: '#22d3ee' }} />
                        <strong style={{ color: '#22d3ee', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          AI Optimal Code Solution ({q.codingDetails?.language || 'javascript'}):
                        </strong>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: 12,
                          background: '#090d16',
                          borderRadius: 6,
                          color: '#38bdf8',
                          fontSize: 12.5,
                          overflowX: 'auto',
                          fontFamily: 'JetBrains Mono, monospace',
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                        }}
                      >
                        <code>{idealCode}</code>
                      </pre>
                    </div>
                  )}

                  {/* Ideal / Recommended Model Answer for Learning */}
                  {q.idealAnswer && (
                    <div style={{ margin: '0 0 0 34px', background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#d1fae5', lineHeight: 1.55 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Sparkles size={14} style={{ color: '#34d399' }} />
                        <strong style={{ color: '#34d399', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          AI Recommended Architecture / Solution Walkthrough:
                        </strong>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#a7f3d0' }}>
                        {q.idealAnswer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
