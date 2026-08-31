import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { InterviewConfigStep } from '../components/InterviewConfigStep';
import { ResumeUploadStep } from '../components/ResumeUploadStep';
import { ResumeProcessingLoader } from '../components/ResumeProcessingLoader';
import { ReadyModal } from '../components/ReadyModal';
import { Button } from '../../../shared/components/ui/Button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useInterview } from '../../../shared/context/InterviewContext';
import { useToast } from '../../../shared/context/ToastContext';
import * as api from '../../../shared/utils/apiClient';
import '../components/NewInterview.css';

export function NewInterviewPage() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1); // Start at Step 1 (Configuration)
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeConfig, activeResume, updateResume, setCurrentSession } = useInterview();
  const toast = useToast();

  // If entering /interviews/new with a selected resume from vault, pre-attach it; otherwise start clean
  useEffect(() => {
    if (location.state?.selectedResume) {
      updateResume(location.state.selectedResume);
    } else if (!location.state?.keepResume) {
      updateResume(null);
    }
  }, [location.state]);

  const handleNextToUpload = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToConfig = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartAnalysis = async () => {
    if (!activeResume) {
      toast.error('Please attach or select a resume document before generating the interview.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(3); // Show Processing Loader

    try {
      if (activeResume.isExistingResume && activeResume.existingSessionId) {
        // Reuse previously uploaded resume
        const res = await api.createSessionWithExistingResume(activeResume.existingSessionId, activeConfig);
        const sid = res.session?.id || res.data?.session?.id || res.id;
        setActiveSessionId(sid);
      } else if (activeResume.rawFile) {
        // Real file upload to NestJS Backend Gateway
        const res = await api.uploadResumeAndCreateSession(activeResume.rawFile, activeConfig);
        const sid = res.session?.id || res.data?.session?.id || res.id;
        setActiveSessionId(sid);
      }
    } catch (err) {
      toast.error(`Session creation failed: ${err.message}`);
      setActiveSessionId(null);
      setCurrentStep(2); // Return to upload step so candidate can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessingComplete = async (sessionId) => {
    if (sessionId) {
      try {
        const detailsRes = await api.getSessionDetails(sessionId);
        const sessionPayload = detailsRes.data || detailsRes;
        const jsonDoc = sessionPayload.sessionData;

        // Populate session into context for interview room
        const formattedSession = {
          id: sessionId,
          config: {
            role: sessionPayload.targetRole,
            level: sessionPayload.seniorityLevel,
            difficulty: sessionPayload.difficulty,
            type: sessionPayload.interviewType,
            duration: sessionPayload.targetDurationMin,
          },
          resume: {
            name: sessionPayload.originalFileName,
            fullExtractedText: jsonDoc?.resume?.fullExtractedText || sessionPayload.rawExtractedText,
          },
          questions: (jsonDoc?.generatedQuestions || []).map((q, idx) => ({
            id: q.id || `q_${idx + 1}`,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            expectedKeyPoints: q.expectedKeyPoints,
            idealAnswer: q.idealAnswer,
            isCoding: Boolean(q.isCoding || q.section === 'CODING'),
            section: q.section || (q.isCoding ? 'CODING' : 'THEORY'),
            codingDetails: q.codingDetails,
            source: q.source,
            model: q.model,
          })),
          totalDurationSeconds: (sessionPayload.targetDurationMin || 30) * 60,
          createdAt: sessionPayload.createdAt,
        };

        if (formattedSession.questions && formattedSession.questions.length > 0) {
          setCurrentSession(formattedSession);
        } else {
          const fallback = initializeInterviewSession();
          fallback.id = sessionId;
          setCurrentSession(fallback);
        }
      } catch (err) {
        console.warn('Could not fetch session details from backend:', err);
        const fallback = initializeInterviewSession();
        fallback.id = sessionId;
        setCurrentSession(fallback);
      }
    } else {
      const fallback = initializeInterviewSession();
      setCurrentSession(fallback);
    }

    setShowReadyModal(true);
  };

  return (
    <PageWrapper className="new-interview-page" maxWidth="1000px">
      {/* Step Header */}
      {currentStep !== 3 && (
        <div className="new-interview-header animate-fade-in">
          <div className="new-interview-badge">
            <Sparkles size={14} className="text-cyan" />
            <span>SESSION BUILDER</span>
          </div>
          <h2 className="new-interview-title">Start a New Interview</h2>
          <p className="new-interview-subtitle">
            Configure your interview scope, attach your resume, and let Google Gemini AI build a personalized practice session.
          </p>

          {/* Stepper Tabs */}
          <div className="stepper-nav">
            <div
              className={`stepper-tab ${currentStep === 1 ? 'active' : 'completed'}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="stepper-tab-num">1</span>
              <span className="stepper-tab-label">Interview Configuration</span>
            </div>
            <div className="stepper-divider" />
            <div
              className={`stepper-tab ${currentStep === 2 ? 'active' : ''}`}
              onClick={() => currentStep > 1 && setCurrentStep(2)}
            >
              <span className="stepper-tab-num">2</span>
              <span className="stepper-tab-label">Resume Upload & Tuning</span>
            </div>
          </div>
        </div>
      )}

      {/* Step Views */}
      {currentStep === 1 && (
        <div className="step-container">
          <InterviewConfigStep onNext={handleNextToUpload} />
          <div className="step-actions-footer">
            <div />
            <Button
              variant="gradient"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNextToUpload}
            >
              Proceed to Resume Upload
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="step-container">
          <ResumeUploadStep />
          <div className="step-actions-footer">
            <Button
              variant="secondary"
              size="lg"
              icon={ArrowLeft}
              onClick={handleBackToConfig}
            >
              Back to Configuration
            </Button>
            <Button
              variant="gradient"
              size="lg"
              icon={Sparkles}
              iconPosition="right"
              disabled={!activeResume || isSubmitting}
              onClick={handleStartAnalysis}
            >
              {isSubmitting ? 'Starting Pipeline...' : 'Generate AI Interview Session'}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <ResumeProcessingLoader
          sessionId={activeSessionId}
          isUploading={isSubmitting}
          onComplete={handleProcessingComplete}
          onError={(err) => toast.error(err)}
        />
      )}

      {/* Ready For Interview Modal */}
      <ReadyModal
        isOpen={showReadyModal}
        onClose={() => setShowReadyModal(false)}
        onReviewSettings={() => {
          setShowReadyModal(false);
          setCurrentStep(1);
        }}
      />
    </PageWrapper>
  );
}
