import React, { useState, useEffect } from 'react';
import { Check, Loader2, BrainCircuit, AlertTriangle } from 'lucide-react';
import * as api from '../../../shared/utils/apiClient';
import './NewInterview.css';

export function ResumeProcessingLoader({ sessionId, onComplete, onError }) {
  // Step indices:
  // 0: Upload complete / PENDING in BullMQ queue
  // 1: CONVERTING_DOC
  // 2: EXTRACTING_OCR
  // 3: GENERATING_QUESTIONS
  // 4: READY (all complete)
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const stages = [
    { title: 'Resume uploaded & verified by NestJS Gateway', key: 'UPLOADED' },
    { title: 'Converting document to high-res page images (MuPDF + Sharp)', key: 'CONVERTING' },
    { title: 'Extracting raw text per page (Tesseract.js OCR workers)', key: 'OCR' },
    { title: 'Synthesizing career history & generating questions (Google Gemini AI)', key: 'GEMINI' },
    { title: 'Personalized AI interview session ready in BullMQ', key: 'READY' },
  ];

  useEffect(() => {
    // If we don't have a sessionId yet, we are in the initial file upload phase
    if (!sessionId) {
      setCurrentStep(0);
      return;
    }

    let isSubscribed = true;
    let pollInterval = null;

    const pollStatus = async () => {
      try {
        const res = await api.getSessionStatus(sessionId);
        const data = res.data || res;
        const status = data.status;

        if (!isSubscribed) return;

        if (status === 'PENDING') {
          setCurrentStep(0);
        } else if (status === 'CONVERTING_DOC') {
          setCurrentStep(1);
        } else if (status === 'EXTRACTING_OCR') {
          setCurrentStep(2);
        } else if (status === 'GENERATING_QUESTIONS') {
          setCurrentStep(3);
        } else if (status === 'READY') {
          setCurrentStep(4);
          setIsCompleted(true);
          if (pollInterval) clearInterval(pollInterval);

          setTimeout(() => {
            if (isSubscribed && onComplete) {
              onComplete(sessionId);
            }
          }, 600);
        } else if (status === 'FAILED') {
          if (pollInterval) clearInterval(pollInterval);
          setErrorMessage(data.errorMessage || 'Session processing failed in background worker.');
          if (onError) onError(data.errorMessage || 'Session processing failed');
        }
      } catch (err) {
        console.warn('Polling status warning:', err.message);
      }
    };

    // Immediate initial check, then poll every 1000ms
    pollStatus();
    pollInterval = setInterval(pollStatus, 1000);

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId]);

  return (
    <div className="processing-loader-wrap animate-fade-in">
      {/* Animated AI Brain/Orb */}
      <div className="processing-ai-orb">
        <div className="processing-ring ring-outer" />
        <div className="processing-ring ring-inner" />
        <div className="processing-core">
          <BrainCircuit size={44} className="processing-icon" />
        </div>
      </div>

      <div className="processing-headings">
        <h3 className="processing-title">Analyzing Your Resume with Gemini...</h3>
        <p className="processing-subtitle">
          NestJS Gateway, BullMQ, and Google AI Studio are synthesizing your profile into a realistic mock interview
        </p>
      </div>

      {errorMessage && (
        <div className="error-alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: 12, marginBottom: 16, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stages List */}
      <div className="stages-list">
        {stages.map((stage, idx) => {
          const isDone = isCompleted || idx < currentStep;
          const isCurrent = !isCompleted && idx === currentStep;
          const isPending = !isCompleted && idx > currentStep;

          return (
            <div
              key={idx}
              className={`stage-item ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}
            >
              <div className="stage-icon-wrap">
                {isDone && <Check size={14} className="text-white" />}
                {isCurrent && <Loader2 size={14} className="stage-spinner" />}
                {isPending && <span className="stage-circle" />}
              </div>
              <span className="stage-text">{stage.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
