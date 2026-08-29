import React from 'react';
import { CheckCircle, Award, Clock, Flame, TrendingUp } from 'lucide-react';
import { useInterview } from '../../../shared/context/InterviewContext';
import './Dashboard.css';

export function SummaryMetrics() {
  const { interviews } = useInterview();

  const completedList = (interviews || []).filter(
    (i) => i.status === 'Completed' || typeof i.score === 'number',
  );

  const totalInterviews = completedList.length;
  const avgScore = totalInterviews > 0
    ? Math.round(completedList.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalInterviews)
    : 0;

  // Calculate practice time
  const totalMinutes = (interviews || []).reduce((acc, curr) => {
    const parsedMin = parseInt(curr.duration, 10) || 30;
    return acc + parsedMin;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedPracticeTime = totalMinutes > 0 ? (hours > 0 ? `${hours}h ${mins}m` : `${mins}m`) : '0m';

  const streakDays = totalInterviews > 0 ? Math.min(totalInterviews, 5) : 0;

  const metrics = [
    {
      label: 'Interviews Completed',
      value: totalInterviews,
      icon: CheckCircle,
      trend: totalInterviews > 0 ? `${totalInterviews} sessions tracked` : 'Ready to start',
      color: 'var(--color-primary)',
      bgColor: 'var(--color-primary-light)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    {
      label: 'Average Score',
      value: `${avgScore}%`,
      icon: Award,
      trend: totalInterviews > 0 ? 'Dynamic AI evaluation' : 'No evaluations yet',
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-light)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      label: 'Practice Time',
      value: formattedPracticeTime,
      icon: Clock,
      trend: totalMinutes > 0 ? 'Active preparation' : 'Start your first session',
      color: 'var(--color-cyan)',
      bgColor: 'var(--color-cyan-light)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    {
      label: 'Current Streak',
      value: `${streakDays} ${streakDays === 1 ? 'session' : 'sessions'}`,
      icon: Flame,
      trend: streakDays > 0 ? 'Active momentum 🔥' : 'Start practice streak',
      color: 'var(--color-warning)',
      bgColor: 'var(--color-warning-light)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className="metric-card glass-panel"
            style={{ borderColor: m.borderColor }}
          >
            <div className="metric-header">
              <span className="metric-label">{m.label}</span>
              <div
                className="metric-icon-box"
                style={{ background: m.bgColor, color: m.color }}
              >
                <Icon size={20} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-value">{m.value}</span>
            </div>
            <div className="metric-trend">
              <TrendingUp size={14} className="trend-icon" />
              <span>{m.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
