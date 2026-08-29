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
                    background: isSkipped ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: isSkipped ? '#f87171' : '#818cf8',
                  }}
                >
                  Q{idx + 1}
                </span>
                <span className="qa-question-title">{q.question}</span>
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
                {/* Candidate Answer */}
                <div className="qa-answer-block" style={{ borderLeft: isSkipped ? '3px solid #ef4444' : '3px solid #6366f1' }}>
                  <div className="qa-author-label user-label">
                    <User size={14} />
                    <span>{isSkipped ? 'Candidate Response: (Skipped)' : 'Your Answer:'}</span>
                  </div>
                  {q.code ? (
                    <div className="qa-code-sub-block">
                      <div className="qa-code-lang">{q.language || 'javascript'}</div>
                      <pre className="qa-code-pre">
                        <code>{q.code}</code>
                      </pre>
                    </div>
                  ) : (
                    <p className="qa-answer-text" style={{ color: isSkipped ? '#94a3b8' : '#cbd5e1' }}>
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

                {/* AI Model / Ideal Answer */}
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
                        AI Recommended / Ideal Answer:
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
