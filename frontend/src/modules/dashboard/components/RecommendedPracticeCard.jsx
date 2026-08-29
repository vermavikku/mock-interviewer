import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, Zap, Target, Sparkles } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useInterview } from '../../../shared/context/InterviewContext';
import './Dashboard.css';

export function RecommendedPracticeCard() {
  const navigate = useNavigate();
  const { interviews, activeConfig, updateConfig } = useInterview();

  // Dynamic recommendation based on current configuration or interview history
  const role = activeConfig.role || 'Full Stack Engineer';
  const lastInterview = (interviews || [])[0];

  let topic = 'System Architecture & High-Throughput Microservices';
  let suggestedType = 'System Design';
  let description = `Practice distributed caching (Redis Cluster), event-driven queues, and database sharding patterns for ${role}.`;

  if (lastInterview?.type === 'System Design') {
    topic = 'Data Structures, Graph Algorithms & Dynamic Programming';
    suggestedType = 'Technical';
    description = 'Sharpen your algorithmic problem solving, time/space complexity analysis, and edge case handling.';
  } else if (lastInterview?.type === 'Technical') {
    topic = 'Leadership, Conflict Resolution & Engineering Pragmatism';
    suggestedType = 'Behavioral';
    description = 'Structure compelling STAR-format stories on high-impact technical initiatives and mentoring teammates.';
  }

  const handlePracticeNow = () => {
    updateConfig({
      type: suggestedType,
      difficulty: 'Medium',
      duration: 30,
    });
    navigate('/interviews/new');
  };

  return (
    <div className="recommended-card glass-panel">
      <div className="rec-top-badge">
        <Sparkles size={14} className="text-cyan" />
        <span>AI COACH INSIGHT</span>
      </div>

      <div className="rec-icon-title-wrap">
        <div className="rec-ai-icon">
          <Brain size={24} />
        </div>
        <div>
          <h3 className="rec-title">AI recommends practicing {topic}</h3>
          <span className="rec-tagline">
            {interviews?.length > 0
              ? `Personalized based on your last ${interviews.length} practice session(s)`
              : `Optimized for ${role} preparation`}
          </span>
        </div>
      </div>

      <p className="rec-desc">{description}</p>

      <div className="rec-meta-grid">
        <div className="rec-meta-item">
          <Target size={14} className="text-primary" />
          <span>Type: <strong>{suggestedType}</strong></span>
        </div>
        <div className="rec-meta-item">
          <Zap size={14} className="text-warning" />
          <span>Impact: <strong className="text-success">+15% Mastery</strong></span>
        </div>
      </div>

      <Button
        variant="gradient"
        fullWidth
        icon={ArrowRight}
        iconPosition="right"
        onClick={handlePracticeNow}
        className="rec-action-btn"
      >
        Practice Now (30 min)
      </Button>
    </div>
  );
}
