import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Send,
  Terminal,
  FileCode,
  Check,
  Copy
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { soundEffects } from '../../../shared/utils/soundEffects';
import './CodeEditorWorkspace.css';

export function CodeEditorWorkspace({
  question,
  onSubmitCode,
  onSkipQuestion,
  disabled = false,
  onClose,
}) {
  const defaultLanguage = question?.codingDetails?.language || 'javascript';
  const starterCode = question?.codingDetails?.starterCode || `/**
 * Problem: ${question?.question || 'Implement Solution'}
 * 
 * @param {any} input
 * @return {any}
 */
function solution(input) {
  // Write your code here
  
}
`;

  const [language, setLanguage] = useState(defaultLanguage);
  const [code, setCode] = useState(starterCode);
  const [explanation, setExplanation] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (question?.codingDetails?.starterCode) {
      setCode(question.codingDetails.starterCode);
      setTestResults(null);
    }
  }, [question]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setCode(code.substring(0, start) + '  ' + code.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleRunTests = () => {
    soundEffects.playPop();
    setIsRunningTests(true);
    setTestResults(null);

    setTimeout(() => {
      setIsRunningTests(false);
      const testCases = question?.codingDetails?.testCases || [
        { input: 'input = [2, 7, 11, 15], target = 9', expected: '[0, 1]', actual: '[0, 1]', passed: true },
        { input: 'input = [3, 2, 4], target = 6', expected: '[1, 2]', actual: '[1, 2]', passed: true },
        { input: 'input = [3, 3], target = 6', expected: '[0, 1]', actual: '[0, 1]', passed: true },
      ];

      setTestResults({
        passedCount: testCases.filter((t) => t.passed).length,
        totalCount: testCases.length,
        cases: testCases,
        executionTimeMs: 42,
        memoryKb: 148,
      });
      soundEffects.playSuccess();
    }, 900);
  };

  const handleSubmit = () => {
    if (!code.trim() || disabled) return;
    soundEffects.playSend();
    onSubmitCode({
      code: code.trim(),
      language,
      explanation: explanation.trim(),
      testResults,
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetCode = () => {
    setCode(starterCode);
    setTestResults(null);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="code-workspace-pane glass-panel animate-fade-in">
      {/* Top Editor Toolbar */}
      <div className="code-workspace-header">
        <div className="workspace-title-left">
          <div className="code-badge-icon">
            <Code2 size={16} />
          </div>
          <div>
            <span className="workspace-main-label">Live Code Workspace</span>
            <span className="workspace-prob-name">{question?.category || 'Algorithm & Coding Challenge'}</span>
          </div>
        </div>

        <div className="workspace-controls-right">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="code-lang-selector"
          >
            <option value="javascript">JavaScript (Node.js 20)</option>
            <option value="typescript">TypeScript 5.x</option>
            <option value="python">Python 3.12</option>
            <option value="java">Java 21</option>
            <option value="cpp">C++ 20</option>
          </select>

          <button
            type="button"
            className="code-tool-btn"
            onClick={handleCopyCode}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            className="code-tool-btn"
            onClick={handleResetCode}
            title="Reset to starter template"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Problem Requirement Hint */}
      {question?.codingDetails && (
        <div className="problem-specs-strip">
          <div className="specs-row">
            <span className="spec-tag">Complexity Target:</span>
            <strong className="text-primary">{question.codingDetails.timeComplexity || 'O(n) Time, O(1) Space'}</strong>
          </div>
          {question.codingDetails.constraints && (
            <div className="specs-row">
              <span className="spec-tag">Constraints:</span>
              <span>{question.codingDetails.constraints}</span>
            </div>
          )}
        </div>
      )}

      {/* Code Editor Body */}
      <div className="editor-container">
        {/* Line Numbers */}
        <div className="editor-line-numbers">
          {Array.from({ length: Math.max(lineCount, 12) }, (_, i) => (
            <div key={i + 1} className="line-num">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Input Textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="code-editor-textarea"
          placeholder="// Type your solution here..."
          disabled={disabled}
        />
      </div>

      {/* Test Execution Output Console */}
      {testResults && (
        <div className="test-results-drawer animate-pop-in">
          <div className="test-results-header">
            <div className="test-header-left">
              <Terminal size={14} className="text-cyan" />
              <span className="test-heading">Test Runner Results</span>
            </div>
            <div className="test-stats-badges">
              <span className="test-pass-pill">
                <CheckCircle2 size={13} /> {testResults.passedCount} / {testResults.totalCount} Passed
              </span>
              <span className="test-runtime-pill">{testResults.executionTimeMs}ms runtime</span>
            </div>
          </div>

          <div className="test-cases-list">
            {testResults.cases.map((tc, idx) => (
              <div key={idx} className="test-case-card passed">
                <div className="test-case-top">
                  <span className="tc-label">Test Case {idx + 1}</span>
                  <span className="tc-badge passed">✓ Passed</span>
                </div>
                <div className="tc-details">
                  <div><span className="tc-key">Input:</span> <code>{tc.input}</code></div>
                  <div><span className="tc-key">Expected:</span> <code>{tc.expected}</code></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Explanation & Submission Footer */}
      <div className="editor-footer-wrap">
        <div className="explanation-input-row">
          <input
            type="text"
            className="explanation-field"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Optional: Briefly explain your approach, data structure choice, and trade-offs..."
            disabled={disabled}
          />
        </div>

        <div className="editor-actions-row">
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
              title="Skip this coding challenge and move to next"
            >
              Skip Question
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            icon={Play}
            onClick={handleRunTests}
            loading={isRunningTests}
            disabled={disabled}
          >
            Run Test Cases
          </Button>

          <Button
            variant="gradient"
            size="md"
            icon={Send}
            iconPosition="right"
            onClick={handleSubmit}
            disabled={!code.trim() || disabled}
          >
            Submit Code & Explain
          </Button>
        </div>
      </div>
    </div>
  );
}
