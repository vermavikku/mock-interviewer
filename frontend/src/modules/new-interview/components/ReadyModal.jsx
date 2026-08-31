import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Clock, Target, Layers, ArrowRight } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { useInterview } from '../../../shared/context/InterviewContext';
import { useToast } from '../../../shared/context/ToastContext';
import './NewInterview.css';

export function ReadyModal({ isOpen, onClose, onReviewSettings }) {
  const { activeConfig, activeResume, currentSession, initializeInterviewSession } = useInterview();
  const navigate = useNavigate();
  const toast = useToast();

  const handleStartInterview = async () => {
    const session = currentSession || initializeInterviewSession();
    toast.success('Launching AI Interview Session...');

    // Trigger browser fullscreen immediately on user gesture
    if (!document.fullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen could not be automatically entered:', err);
      }
    }

    onClose();
    const interviewUrl = `/interview-room?id=${session.id}`;
    navigate(interviewUrl);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="580px"
      showClose={true}
    >
      <div className="ready-modal-content animate-pop-in">
        <div className="ready-badge-top">
          <Sparkles size={16} className="text-cyan" />
          <span>SESSION PREPARED</span>
        </div>

        <h2 className="ready-title">You're Ready!</h2>
        <p className="ready-subtitle">Your personalized AI interview session has been configured and is ready to launch.</p>

        <div className="ready-summary-box">
          <div className="summary-row">
            <div className="summary-label-col">
              <FileText size={16} className="text-primary" />
              <span>Resume Used</span>
            </div>
            <strong className="summary-value">{activeResume?.name || 'Uploaded_Resume.pdf'}</strong>
          </div>

          <div className="summary-row">
            <div className="summary-label-col">
              <Layers size={16} className="text-cyan" />
              <span>Interview Type</span>
            </div>
            <strong className="summary-value">{activeConfig?.level} {activeConfig?.type} Interview</strong>
          </div>

          <div className="summary-row">
            <div className="summary-label-col">
              <Target size={16} className="text-warning" />
              <span>Difficulty Level</span>
            </div>
            <strong className="summary-value">{activeConfig?.difficulty}</strong>
          </div>

          <div className="summary-row">
            <div className="summary-label-col">
              <Clock size={16} className="text-success" />
              <span>Allocated Duration</span>
            </div>
            <strong className="summary-value">{activeConfig?.duration} minutes (~8–12 questions)</strong>
          </div>
        </div>

        <div className="ready-adaptive-note">
          <div className="pulse-dot-ai" />
          <span>Questions and follow-ups will dynamically adapt based on your answers in real-time.</span>
        </div>

        <div className="ready-modal-actions">
          <Button variant="secondary" onClick={onReviewSettings}>
            Review Settings
          </Button>
          <Button
            variant="gradient"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            onClick={handleStartInterview}
          >
            Start Interview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
