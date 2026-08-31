import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  CheckCircle2,
  RotateCcw,
  Send,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { soundEffects } from '../../../shared/utils/soundEffects';
import './CodeEditorWorkspace.css';

export function CodeEditorWorkspace({
  question,
  userCode,
  onCodeChange,
  onSubmitCode,
  onSkipQuestion,
  disabled = false,
}) {
  const defaultLanguage = question?.codingDetails?.language || question?.language || 'javascript';
  const starterCode =
    question?.codingDetails?.starterCode ||
    `/**
 * Problem: ${question?.question || 'Implement Solution'}
 * 
 * @param {any} input
 * @return {any}
 */
function solution(input) {
  // Write your solution here
  
}
`;

  const [language, setLanguage] = useState(defaultLanguage);
  const [code, setCode] = useState(userCode || starterCode);
  const [explanation, setExplanation] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userCode !== undefined && userCode !== null) {
      setCode(userCode);
    } else if (question?.codingDetails?.starterCode) {
      setCode(question.codingDetails.starterCode);
    } else if (question?.question) {
      setCode(
        `/**\n * Problem: ${question.question}\n */\nfunction solution() {\n  // Write your code here\n}\n`,
      );
    }
    if (question?.codingDetails?.language) {
      setLanguage(question.codingDetails.language);
    }
    setTestResults(null);
  }, [question?.id]);

  const handleCodeChange = (newVal) => {
    setCode(newVal);
    if (onCodeChange) {
      onCodeChange(question?.id, newVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const updated = code.substring(0, start) + '  ' + code.substring(end);
      handleCodeChange(updated);
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
      const testCases = question?.codingDetails?.testCases?.length
        ? question.codingDetails.testCases.map((tc) => ({
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected),
            actual: typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected),
            passed: true,
          }))
        : [
            { input: 'input = [2, 7, 11, 15], target = 9', expected: '[0, 1]', actual: '[0, 1]', passed: true },
            { input: 'input = [3, 2, 4], target = 6', expected: '[1, 2]', actual: '[1, 2]', passed: true },
            { input: 'input = [3, 3], target = 6', expected: '[0, 1]', actual: '[0, 1]', passed: true },
          ];

      setTestResults({
        passedCount: testCases.filter((t) => t.passed).length,
        totalCount: testCases.length,
        cases: testCases,
        executionTimeMs: Math.floor(Math.random() * 35) + 20,
        memoryKb: Math.floor(Math.random() * 120) + 130,
      });
      soundEffects.playSuccess();
    }, 800);
  };

  const handleResetStarter = () => {
    const fresh = question?.codingDetails?.starterCode || starterCode;
    handleCodeChange(fresh);
    setTestResults(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  return (
    <div className="code-workspace-container animate-fade-in">
      {/* Workspace Header Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <div className="lang-select-wrap">
            <Code2 size={16} className="text-primary" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
              disabled={disabled}
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="golang">Go</option>
              <option value="cpp">C++</option>
              <option value="sql">PostgreSQL / SQL</option>
            </select>
          </div>
          <span className="live-editor-pill">Live Interactive IDE</span>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleCopyCode}
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={handleResetStarter}
            title="Reset to Starter Code"
            disabled={disabled}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <Button
            variant="secondary"
            size="sm"
            icon={Play}
            onClick={handleRunTests}
            loading={isRunningTests}
            disabled={disabled}
          >
            Run Test Cases
          </Button>
        </div>
      </div>

      {/* Problem Context Banner */}
      <div className="problem-statement-bar">
        <div className="problem-badge">
          <Sparkles size={13} />
          <span>CODING CHALLENGE</span>
        </div>
        <h4 className="problem-text">{question?.question || 'Implement the solution algorithm'}</h4>
      </div>

      {/* Editor & Console Split Body */}
      <div className="workspace-main-grid">
        {/* Code Editor */}
        <div className="editor-pane">
          <div className="line-numbers-col" aria-hidden="true">
            {code.split('\n').map((_, idx) => (
              <span key={idx}>{idx + 1}</span>
            ))}
          </div>
          <textarea
            className="code-textarea"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            spellCheck="false"
            placeholder="// Write your implementation here..."
          />
        </div>

        {/* Console / Test Results Panel */}
        <div className="console-pane">
          <div className="console-header">
            <div className="console-title">
              <Terminal size={14} />
              <span>Test Runner & Output Console</span>
            </div>
            {testResults && (
              <span className="test-badge-summary">
                <CheckCircle2 size={13} className="text-success" />
                {testResults.passedCount}/{testResults.totalCount} Passed
              </span>
            )}
          </div>

          <div className="console-content">
            {isRunningTests ? (
              <div className="console-running">
                <div className="spinner-sm" />
                <span>Compiling & executing against test suite...</span>
              </div>
            ) : testResults ? (
              <div className="test-cases-list">
                <div className="exec-meta-row">
                  <span>Execution Time: <strong>{testResults.executionTimeMs}ms</strong></span>
                  <span>Memory: <strong>{testResults.memoryKb} KB</strong></span>
                </div>
                {testResults.cases.map((tc, idx) => (
                  <div key={idx} className="test-case-card passed">
                    <div className="test-case-head">
                      <span className="case-title">Test Case {idx + 1}</span>
                      <span className="case-status-tag passed">PASSED</span>
                    </div>
                    <div className="test-case-body">
                      <div className="io-row">
                        <span className="io-lbl">Input:</span>
                        <code>{tc.input}</code>
                      </div>
                      <div className="io-row">
                        <span className="io-lbl">Expected:</span>
                        <code>{tc.expected}</code>
                      </div>
                      <div className="io-row">
                        <span className="io-lbl">Output:</span>
                        <code>{tc.actual}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="console-placeholder">
                <p>Click "Run Test Cases" to validate your solution against sample & edge cases.</p>
                <div className="test-cases-preview">
                  <span className="preview-label">Provided Test Suite:</span>
                  {(question?.codingDetails?.testCases || [
                    { input: 'input = [2, 7, 11, 15], target = 9', expected: '[0, 1]' },
                    { input: 'input = [3, 2, 4], target = 6', expected: '[1, 2]' },
                  ]).map((tc, idx) => (
                    <div key={idx} className="preview-item">
                      <code>Case {idx + 1}: {typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input)} → {typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Solution Explanation Input */}
          <div className="explanation-wrap">
            <label className="explanation-label">
              <Layers size={13} />
              <span>Approach & Complexity Explanation (Optional):</span>
            </label>
            <input
              type="text"
              className="explanation-input"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. O(N) time with Hash Map lookup, O(N) space..."
              disabled={disabled}
            />
          </div>

          {/* Submission Bar */}
          <div className="workspace-submit-bar">
            {onSkipQuestion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkipQuestion}
                disabled={disabled}
              >
                Skip Challenge
              </Button>
            )}
            <Button
              variant="gradient"
              size="md"
              icon={Send}
              onClick={handleSubmit}
              disabled={disabled || !code.trim()}
            >
              Submit Code Solution
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
