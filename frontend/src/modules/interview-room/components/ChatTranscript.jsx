import React, { useEffect, useRef } from 'react';
import { Bot, User, Sparkles, CheckCheck } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import './InterviewRoom.css';

export function ChatTranscript({ messages = [], isAIThinking = false }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAIThinking]);

  return (
    <div className="chat-transcript-area">
      <div className="chat-welcome-banner">
        <div className="banner-bot-icon">
          <Bot size={20} />
        </div>
        <div>
          <span className="banner-title">AI Interview Session Initialized</span>
          <p className="banner-sub">Answer concisely with concrete technical examples and metrics.</p>
        </div>
      </div>

      <div className="messages-stream">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isAI ? 'msg-ai-row' : 'msg-user-row'} animate-pop-in`}
            >
              {/* Message Bubble */}
              <div className="message-container">
                <div className="message-header-meta">
                  <div className="sender-tag">
                    {isAI ? (
                      <>
                        <div className="sender-ai-avatar">
                          <Bot size={13} />
                        </div>
                        <span className="sender-name">Alex (AI Interviewer)</span>
                        {msg.category && (
                          <span className="category-pill">{msg.category}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <img
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                          alt={user?.name}
                          className="sender-user-avatar"
                        />
                        <span className="sender-name">{user?.name?.split(' ')[0] || 'Candidate'}</span>
                      </>
                    )}
                  </div>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`message-bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
                  <p className="message-text">{msg.text}</p>

                  {/* Submitted Code Block if present */}
                  {msg.code && (
                    <div className="message-code-block animate-fade-in">
                      <div className="code-block-header">
                        <span className="code-lang-tag">{msg.language || 'javascript'}</span>
                        {msg.testResults && (
                          <span className="code-tests-badge">
                            ✓ {msg.testResults.passedCount}/{msg.testResults.totalCount} Test Cases Passed
                          </span>
                        )}
                      </div>
                      <pre className="code-block-pre">
                        <code>{msg.code}</code>
                      </pre>
                      {msg.explanation && (
                        <div className="code-explanation-note">
                          <strong>Approach & Trade-offs:</strong> {msg.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Note or Live feedback hint */}
                  {msg.note && (
                    <div className="message-note-attachment">
                      <span className="note-label">Attached Note:</span>
                      <p className="note-text">{msg.note}</p>
                    </div>
                  )}

                  {msg.feedback && (
                    <div className="bubble-live-feedback animate-fade-in">
                      <div className="feedback-label">
                        <Sparkles size={12} className="text-cyan" />
                        <span>AI Real-Time Coaching Note:</span>
                      </div>
                      <p className="feedback-content">{msg.feedback}</p>
                    </div>
                  )}
                </div>

                {!isAI && (
                  <div className="user-message-footer">
                    <span className="word-count-tag">{msg.wordCount || msg.text.split(/\s+/).length} words</span>
                    <CheckCheck size={14} className="text-primary" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAIThinking && (
          <div className="chat-message-row msg-ai-row animate-fade-in">
            <div className="message-container">
              <div className="sender-tag">
                <div className="sender-ai-avatar">
                  <Bot size={13} />
                </div>
                <span className="sender-name">Alex is formulating follow-up...</span>
              </div>
              <div className="message-bubble ai-bubble typing-bubble">
                <div className="typing-dots">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: '10px' }} />
      </div>
    </div>
  );
}
