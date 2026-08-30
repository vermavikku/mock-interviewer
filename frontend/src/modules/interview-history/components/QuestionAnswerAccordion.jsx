import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bot, User, Sparkles, CheckCircle2, FileText, Check } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import './InterviewHistory.css';

export function QuestionAnswerAccordion({ questions = [] }) {
  const [openIndexes, setOpenIndexes] = useState([0]); // Open first item by default

  const toggleIndex = (idx) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-questions-notice">
        <span>No question transcripts recorded for this session.</span>
      </div>
    );
  }

  return (
    <div className="qa-accordion-list">
      {questions.map((q, idx) => {
        const isOpen = openIndexes.includes(idx);
        const score = typeof q.score === 'number' ? q.score : 0;
        const answerText = q.userAnswer || q.answer || '';
        const isSkipped = score === 0 || answerText.includes('[Skipped');

        const isCodingTask = q.isCoding || Boolean(q.code) || Boolean(q.codingDetails);
        const idealCode = q.codingDetails?.idealSolutionCode;

        return (
          <div key={q.id || idx} className={`qa-accordion-item glass-panel ${isOpen ? 'open' : ''}`}>
            <div
              className="qa-accordion-header"
              onClick={() => toggleIndex(idx)}
            >
              <div className="qa-header-left">
                <span
                  className="qa-index-pill"
                  style={{
                    background: isSkipped ? 'rgba(239, 68, 68, 0.2)' : isCodingTask ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: isSkipped ? '#f87171' : isCodingTask ? '#22d3ee' : '#818cf8',
                  }}
                >
                  Q{idx + 1}
                </span>
                <span className="qa-question-title">{q.question}</span>
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
                      marginLeft: 6,
                    }}
                  >
                    <FileText size={11} /> Code Challenge
                  </span>
                )}
              </div>

              <div className="qa-header-right">
                <Badge
                  variant={isSkipped ? 'danger' : score >= 80 ? 'success' : score >= 60 ? 'primary' : 'warning'}
                  size="sm"
                >
                  {isSkipped ? 'Skipped (0%)' : `Score: ${score}%`}
                </Badge>
                <span className="qa-chevron-icon">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </div>

            {isOpen && (
              <div className="qa-accordion-body animate-fade-in">
                {/* Candidate Answer / Code */}
                <div className="qa-answer-block" style={{ borderLeft: isSkipped ? '3px solid #ef4444' : isCodingTask ? '3px solid #06b6d4' : '3px solid #6366f1' }}>
                  <div className="qa-author-label user-label">
                    <User size={14} />
                    <span>{isSkipped ? 'Candidate Response: (Skipped)' : isCodingTask ? 'Your Submitted Code Solution:' : 'Your Answer:'}</span>
                  </div>
                  {q.code ? (
                    <div className="qa-code-sub-block" style={{ marginTop: 8, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                      <div className="qa-code-lang" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase' }}>
                        {q.language || q.codingDetails?.language || 'javascript'}
                      </div>
                      <pre className="qa-code-pre" style={{ margin: 0, padding: 14, fontSize: 13, color: '#f1f5f9', overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
                        <code>{q.code}</code>
                      </pre>
                    </div>
                  ) : (
                    <p className="qa-answer-text" style={{ color: isSkipped ? '#94a3b8' : '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                      {answerText || '[No spoken or written answer submitted]'}
                    </p>
                  )}
                </div>

                {/* AI Evaluation & Feedback */}
                {q.feedback && (
                  <div className="qa-feedback-block">
                    <div className="qa-author-label ai-label">
                      <Sparkles size={14} className="text-cyan" />
                      <span>AI Evaluator Feedback:</span>
                    </div>
                    <p className="qa-feedback-text">{q.feedback}</p>
                  </div>
                )}

                {/* AI Optimal Solution Code (if coding challenge) */}
                {idealCode && (
                  <div
                    style={{
                      marginTop: 14,
                      background: 'rgba(6, 182, 212, 0.06)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: '#cffafe',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Sparkles size={15} style={{ color: '#22d3ee' }} />
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

                {/* AI Model / Ideal Answer Explanation */}
                {q.idealAnswer && (
                  <div
                    style={{
                      marginTop: 14,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: '#d1fae5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Sparkles size={15} style={{ color: '#34d399' }} />
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
            )}
          </div>
        );
      })}
    </div>
  );
}
