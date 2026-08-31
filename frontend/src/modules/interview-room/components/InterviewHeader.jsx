import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, XCircle, Maximize2, Minimize2, BookOpen, Code2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import { formatDuration } from '../../../shared/utils/formatters';
import './InterviewRoom.css';

export function InterviewHeader({
  title,
  currentQuestionIndex,
  totalQuestions,
  totalSeconds,
  questionSource,
  currentSection = 'THEORY',
  theoryCount = 0,
  codingCount = 0,
  onEndInterview,
}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds || 1800);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isGemini = questionSource === 'GOOGLE_GEMINI_AI';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request could not be completed:', err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLowTime = secondsLeft < 300; // Under 5 mins

  return (
    <header className="room-header-wrap">
      <div className="room-header-top">
        <div className="room-brand-left">
          <div className="room-logo-icon">
            <Sparkles size={18} />
          </div>
          <div className="room-brand-info">
            <span className="room-brand-name">Interview<span className="text-gradient">AI</span></span>
            <span className="room-live-pill">LIVE SESSION</span>
          </div>
        </div>

        <div className="room-title-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <h2 className="room-active-title" style={{ margin: 0 }}>{title}</h2>
            {/* Active Section Indicator Badge */}
            {currentSection === 'CODING' ? (
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  letterSpacing: '0.5px',
                }}
              >
                <Code2 size={13} />
                SECTION 2: LIVE CODING ({codingCount} Tasks)
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  letterSpacing: '0.5px',
                }}
              >
                <BookOpen size={13} />
                SECTION 1: RESUME & THEORY ({theoryCount} Questions)
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600,
              background: isGemini ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isGemini ? '#22d3ee' : '#fbbf24',
              border: isGemini ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: 4,
            }}
            title={isGemini ? 'Questions generated live via Google Gemini AI' : 'Questions generated via Local Smart Generator (Fallback)'}
          >
            {isGemini ? '🤖 Google Gemini AI' : '⚡ Smart Local Fallback'}
          </span>
        </div>

        <div className="room-controls-right">
          <div className={`room-timer-badge ${isLowTime ? 'timer-warning' : ''}`}>
            <Clock size={16} />
            <span className="timer-countdown">{formatDuration(secondsLeft)}</span>
          </div>

          <button
            type="button"
            className="room-screen-toggle-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Reduce to normal window' : 'Expand to full screen (Cover entire screen)'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={16} />
                <span className="toggle-btn-label">Reduce Size</span>
              </>
            ) : (
              <>
                <Maximize2 size={16} />
                <span className="toggle-btn-label">Full Screen</span>
              </>
            )}
          </button>

          <Button
            variant="danger"
            size="sm"
            icon={XCircle}
            onClick={onEndInterview}
            className="room-end-btn"
          >
            End Interview
          </Button>
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="room-progress-subbar">
        <div className="room-progress-text">
          <span>
            Question {Math.min(currentQuestionIndex + 1, totalQuestions)} of {totalQuestions}
            {theoryCount > 0 && codingCount > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>
                (Theory: {theoryCount} | Coding: {codingCount})
              </span>
            )}
          </span>
          <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Complete</span>
        </div>
        <ProgressBar
          value={currentQuestionIndex + 1}
          max={totalQuestions}
          size="sm"
          color="gradient"
        />
      </div>
    </header>
  );
}
