import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import { soundEffects } from '../../../shared/utils/soundEffects';
import './InterviewRoom.css';

export function InterviewCompletionScreen({ results, onPracticeAgain }) {
  const navigate = useNavigate();

  useEffect(() => {
    soundEffects.playSuccess();
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F766E', '#1D4ED8', '#14B8A6', '#10B981', '#34D399'],
      });
    } catch {
      // Confetti fallback if restricted
    }
  }, []);

  const overallScore = results?.score || 84;
  const subScores = results?.subScores || {
    technical: 88,
    communication: 79,
    problemSolving: 86,
    confidence: 82,
  };

  const strengths = results?.strengths || [
    'Strong architectural fundamentals and database indexing awareness',
    'Clear breakdown of idempotency and caching strategies',
    'Structured response delivery with low filler words',
  ];

  const improvements = results?.improvements || [
    'Elaborate more on quantitative production SLAs (p99 latency, RPS throughput)',
    'Explain failure recovery and fallback circuit-breaker trade-offs more explicitly',
    'Provide more measurable business impact metrics',
  ];

  const recommendations = results?.recommendations || [
    'System Design & Distributed Scalability',
    'Micro-frontend hydration strategies',
    'CAP theorem & consistency models',
  ];

  return (
    <div className="completion-screen-wrap animate-fade-in">
      <div className="completion-header">
        <div className="completion-badge">
          <Sparkles size={16} className="text-cyan" />
          <span>EVALUATION COMPLETE</span>
        </div>
        <h1 className="completion-title">Interview Complete!</h1>
        <p className="completion-subtitle">
          Here is your comprehensive AI evaluation and actionable bar-raiser feedback.
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
              {overallScore >= 85 ? 'Strong Hire / Bar Raiser 🚀' : overallScore >= 75 ? 'Solid Performance ✨' : 'Needs Practice 📈'}
            </h3>
            <p className="score-verdict-desc">
              Your technical depth and response clarity meet standard expectations for {results?.config?.level || 'Senior'} roles.
            </p>
          </div>
        </div>

        <div className="score-banner-actions">
          <Button
            variant="gradient"
            size="md"
            icon={RotateCcw}
            onClick={onPracticeAgain}
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
            <div className="subscore-icon-box" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Code2 size={20} />
            </div>
            <span className="subscore-val">{subScores.technical}%</span>
          </div>
          <span className="subscore-title">Technical Knowledge</span>
          <ProgressBar value={subScores.technical} max={100} size="sm" color="primary" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'var(--color-cyan-light)', color: 'var(--color-cyan)' }}>
              <MessageSquare size={20} />
            </div>
            <span className="subscore-val">{subScores.communication}%</span>
          </div>
          <span className="subscore-title">Communication Clarity</span>
          <ProgressBar value={subScores.communication} max={100} size="sm" color="cyan" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <Brain size={20} />
            </div>
            <span className="subscore-val">{subScores.problemSolving}%</span>
          </div>
          <span className="subscore-title">Problem Solving</span>
          <ProgressBar value={subScores.problemSolving} max={100} size="sm" color="success" />
        </div>

        <div className="subscore-card glass-panel">
          <div className="subscore-header">
            <div className="subscore-icon-box" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
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
    </div>
  );
}
