import React from 'react';
import { Code2, MessageSquare, Brain, Zap } from 'lucide-react';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import './InterviewHistory.css';

export function PerformanceScorecard({ subScores = {} }) {
  const metrics = [
    {
      label: 'Technical Depth',
      score: subScores.technical || 85,
      icon: Code2,
      color: 'primary',
      desc: 'System architecture, API design, trade-offs, and technology mastery',
    },
    {
      label: 'Communication Clarity',
      score: subScores.communication || 80,
      icon: MessageSquare,
      color: 'cyan',
      desc: 'Conciseness, structured thinking, and STAR methodology alignment',
    },
    {
      label: 'Problem Solving',
      score: subScores.problemSolving || 86,
      icon: Brain,
      color: 'success',
      desc: 'Systematic debugging, edge case anticipation, and scalability',
    },
    {
      label: 'Confidence & Delivery',
      score: subScores.confidence || 82,
      icon: Zap,
      color: 'warning',
      desc: 'Response pacing, composure, and definitive justification',
    },
  ];

  return (
    <div className="scorecard-grid">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div key={idx} className="scorecard-item glass-panel">
            <div className="scorecard-top">
              <div className="scorecard-icon" style={{ background: `var(--color-${m.color}-light)`, color: `var(--color-${m.color})` }}>
                <Icon size={18} />
              </div>
              <span className="scorecard-num">{m.score}%</span>
            </div>
            <h4 className="scorecard-title">{m.label}</h4>
            <p className="scorecard-desc">{m.desc}</p>
            <ProgressBar value={m.score} max={100} size="sm" color={m.color} />
          </div>
        );
      })}
    </div>
  );
}
