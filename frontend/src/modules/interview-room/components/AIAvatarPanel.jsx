import React from 'react';
import { Bot, Sparkles, Mic, BrainCircuit, MessageSquareCode } from 'lucide-react';
import './InterviewRoom.css';

export function AIAvatarPanel({ status = 'Asking', interviewerName = 'Alex', activeCategory }) {
  // status: 'Asking' | 'Listening' | 'Thinking'

  const getStatusBadge = () => {
    switch (status) {
      case 'Thinking':
        return {
          label: 'AI Thinking & Evaluating...',
          color: '#8B5CF6',
          icon: BrainCircuit,
          className: 'status-thinking',
        };
      case 'Listening':
        return {
          label: 'AI Listening to Answer...',
          color: '#06B6D4',
          icon: Mic,
          className: 'status-listening',
        };
      default:
        return {
          label: 'AI Asking Question',
          color: '#10B981',
          icon: MessageSquareCode,
          className: 'status-asking',
        };
    }
  };

  const statusConfig = getStatusBadge();
  const StatusIcon = statusConfig.icon;

  return (
    <aside className="ai-interviewer-sidebar glass-panel animate-fade-in">
      <div className="interviewer-header">
        <span className="interviewer-badge">LEAD AI INTERVIEWER</span>
        <h3 className="interviewer-name">{interviewerName}</h3>
        <p className="interviewer-title">Senior Staff Bar-Raiser</p>
      </div>

      {/* Abstract Animated AI Avatar */}
      <div className={`ai-avatar-core-box ${statusConfig.className}`}>
        <div className="avatar-glow-ring ring-1" />
        <div className="avatar-glow-ring ring-2" />
        <div className="avatar-inner-sphere">
          <Bot size={42} className="avatar-bot-svg" />
        </div>
      </div>

      {/* Dynamic Status Indicator */}
      <div className={`ai-live-status-card ${statusConfig.className}`}>
        <div className="status-indicator-dot" />
        <StatusIcon size={16} />
        <span className="status-text-label">{statusConfig.label}</span>
      </div>

      {/* Audio Waveform Bars */}
      <div className="avatar-waveform-strip">
        {[20, 55, 80, 45, 95, 30, 70, 40, 85, 60, 90, 35, 65, 50, 75].map((h, i) => (
          <div
            key={i}
            className={`wave-indicator-bar ${status === 'Listening' || status === 'Thinking' ? 'active' : ''}`}
            style={{
              height: `${status === 'Thinking' ? (i % 2 === 0 ? 30 : 60) : h}%`,
              animationDelay: `${i * 0.07}s`,
            }}
          />
        ))}
      </div>

      {/* Active Category Meta */}
      {activeCategory && (
        <div className="interviewer-focus-box">
          <span className="focus-label">Current Focus Area:</span>
          <span className="focus-value">{activeCategory}</span>
        </div>
      )}

      <div className="ai-tip-note">
        <Sparkles size={14} className="text-cyan" />
        <span>Speak naturally and provide architectural reasoning with trade-offs.</span>
      </div>
    </aside>
  );
}
