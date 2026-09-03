import React, { useState, useEffect, useRef } from 'react';
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
  const [targetStep, setTargetStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stageDetails, setStageDetails] = useState('');

  const stages = [
    { title: 'Resume uploaded & verified by NestJS Gateway', key: 'UPLOADED' },
    { title: 'Converting document to high-res page images (MuPDF + Sharp)', key: 'CONVERTING' },
    { title: 'Extracting raw text per page (Tesseract.js OCR workers)', key: 'OCR' },
    { title: 'Synthesizing career history & generating questions (Google Gemini AI)', key: 'GEMINI' },
    { title: 'Personalized AI interview session ready in BullMQ', key: 'READY' },
  ];

  const completedFiredRef = useRef(false);

  // Smooth progressive step ticker: Advance currentStep towards targetStep smoothly
  useEffect(() => {
    if (currentStep < targetStep) {
      const stepTimer = setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, targetStep));
      }, 380);
      return () => clearTimeout(stepTimer);
    }
  }, [currentStep, targetStep]);

  // Completion trigger: Fires once when targetStep and currentStep reach 4
  useEffect(() => {
    if (currentStep === 4 && targetStep === 4 && sessionId && !completedFiredRef.current) {
      completedFiredRef.current = true;
      setIsCompleted(true);
      const finishTimer = setTimeout(() => {
        if (onComplete) {
          onComplete(sessionId);
        }
      }, 600);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, targetStep, sessionId, onComplete]);

  // Status and log polling from NestJS backend
  useEffect(() => {
    if (!sessionId) {
      // In-flight upload phase before sessionId is issued
      setTargetStep(0);
      setStageDetails('Uploading resume file to NestJS gateway...');
      return;
    }

    let isSubscribed = true;
    let pollInterval = null;

    const computeTargetStep = (status, logs = []) => {
      let step = 0;

      // Check status string first
      if (status === 'PENDING') step = Math.max(step, 0);
      if (status === 'CONVERTING_DOC') step = Math.max(step, 1);
      if (status === 'EXTRACTING_OCR') step = Math.max(step, 2);
      if (status === 'GENERATING_QUESTIONS') step = Math.max(step, 3);
      if (status === 'READY') step = 4;

      // In addition, inspect fine-grained microservice pipeline logs
      if (Array.isArray(logs) && logs.length > 0) {
        const logSteps = logs.map((l) => l.step);

        if (logSteps.includes('DOCUMENT_CONVERSION_STARTED')) {
          step = Math.max(step, 1);
        }
        if (logSteps.includes('DOCUMENT_CONVERSION_COMPLETED')) {
          step = Math.max(step, 1);
        }
        if (logSteps.includes('OCR_EXTRACTION_STARTED')) {
          step = Math.max(step, 2);
        }
        if (logSteps.includes('OCR_EXTRACTION_COMPLETED')) {
          step = Math.max(step, 2);
        }
        if (logSteps.includes('AI_QUESTION_GENERATION_STARTED')) {
          step = Math.max(step, 3);
        }
        if (logSteps.includes('PIPELINE_COMPLETED')) {
          step = 4;
        }
      }

      return step;
    };

    const pollStatus = async () => {
      try {
        const res = await api.getSessionStatus(sessionId);
        const data = res.data || res;
        const status = data.status;
        const logs = data.logs || [];

        if (!isSubscribed) return;

        if (status === 'FAILED') {
          if (pollInterval) clearInterval(pollInterval);
          setErrorMessage(data.errorMessage || 'Session processing failed in background worker.');
          if (onError) onError(data.errorMessage || 'Session processing failed');
          return;
        }

        const calculated = computeTargetStep(status, logs);
        setTargetStep((prev) => Math.max(prev, calculated));

        // Set contextual subtitle from latest pipeline log
        if (logs.length > 0) {
          const lastLog = logs[logs.length - 1];
          if (lastLog?.message) {
            setStageDetails(lastLog.message);
          }
        } else if (status === 'CONVERTING_DOC') {
          setStageDetails('Converting PDF pages into high-res images...');
        } else if (status === 'EXTRACTING_OCR') {
          setStageDetails('Extracting candidate profile text via OCR worker pool...');
        } else if (status === 'GENERATING_QUESTIONS') {
          setStageDetails('Google Gemini AI is synthesizing tailored questions and coding problems...');
        }

        if (status === 'READY' && calculated === 4) {
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('Polling status notice:', err.message);
      }
    };

    // Immediate initial check, then poll every 900ms
    pollStatus();
    pollInterval = setInterval(pollStatus, 900);

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId, onError]);

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
          {stageDetails || 'NestJS Gateway, BullMQ, and Google AI Studio are synthesizing your profile into a realistic mock interview'}
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
