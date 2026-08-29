import React, { useState, useRef, useEffect } from 'react';
import { Send, StickyNote, Sparkles, CornerDownLeft, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { soundEffects } from '../../../shared/utils/soundEffects';
import './InterviewRoom.css';

export function ChatInputBar({
  onSendMessage,
  onSkipQuestion,
  disabled = false,
  placeholder = 'Type your answer here...',
}) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const textareaRef = useRef(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    soundEffects.playSend();
    onSendMessage({
      text: text.trim(),
      note: note.trim() || undefined,
    });
    setText('');
    setNote('');
    setShowNoteInput(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertSampleAnswer = () => {
    const samples = [
      'In my previous microservices architecture, we adopted event-driven choreography with Kafka and transactional outbox patterns. This reduced p99 latency to 45ms and prevented dual-write inconsistencies across services.',
      'We designed an active-active Redis caching layer with cache warming on cold boots and distributed locks using Redlock to completely eliminate cache stampedes during flash sales.',
      'I prioritized separating read and write models using CQRS with Elasticsearch for query indexing and Postgres for ACID transactional writes.',
    ];
    const chosen = samples[Math.floor(Math.random() * samples.length)];
    setText(chosen);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="chat-input-bar-wrap">
      {/* Optional Note Card */}
      {showNoteInput && (
        <div className="note-input-drawer animate-pop-in">
          <div className="note-header">
            <div className="flex-center" style={{ gap: '6px' }}>
              <StickyNote size={14} className="text-warning" />
              <span>Attach Optional Technical Note / Context</span>
            </div>
            <button
              className="note-close-btn"
              onClick={() => setShowNoteInput(false)}
            >
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            className="note-input-field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Assuming AWS ECS cluster with 3 AZs and PostgreSQL RDS multi-region replica..."
          />
        </div>
      )}

      {/* Main Input Box */}
      <div className="chat-input-main-card glass-panel">
        <textarea
          ref={textareaRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Alex is thinking and formulating the next question...' : placeholder}
          disabled={disabled}
          className="chat-textarea"
        />

        <div className="chat-input-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className={`toolbar-tool-btn ${showNoteInput ? 'active' : ''}`}
              onClick={() => setShowNoteInput(!showNoteInput)}
              title="Attach context note"
            >
              <StickyNote size={15} />
              <span>{showNoteInput ? 'Hide Note' : 'Add Note'}</span>
            </button>

            <button
              type="button"
              className="toolbar-tool-btn sample-hint-btn"
              onClick={handleInsertSampleAnswer}
              title="Insert sample technical answer"
            >
              <Sparkles size={14} className="text-cyan" />
              <span>Sample Answer</span>
            </button>

            <span className="char-count-text">
              {wordCount} words
            </span>
          </div>

          <div className="toolbar-right">
            {onSkipQuestion && (
              <Button
                variant="ghost"
                size="md"
                onClick={onSkipQuestion}
                disabled={disabled}
                style={{
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
                title="Skip this question and move to next"
              >
                Skip Question
              </Button>
            )}

            <Button
              variant="gradient"
              size="md"
              icon={Send}
              iconPosition="right"
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className="chat-send-btn"
            >
              Send Answer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
