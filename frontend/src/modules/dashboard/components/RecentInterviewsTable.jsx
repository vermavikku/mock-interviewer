import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Clock, Award, PlusCircle, Inbox } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { formatDate } from '../../../shared/utils/formatters';
import { useInterview } from '../../../shared/context/InterviewContext';
import './Dashboard.css';

export function RecentInterviewsTable() {
  const { interviews } = useInterview();
  const navigate = useNavigate();

  const recentList = (interviews || []).slice(0, 4);

  const getTypeVariant = (type) => {
    switch (type) {
      case 'Technical': return 'primary';
      case 'System Design': return 'cyan';
      case 'Behavioral': return 'success';
      case 'HR': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="recent-interviews-card glass-panel">
      <div className="recent-header">
        <div>
          <h3 className="section-card-title">Recent Interviews</h3>
          <p className="section-card-subtitle">Review your latest questions, transcripts, and AI evaluations</p>
        </div>
        {recentList.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/interviews/history')}
            icon={ChevronRight}
            iconPosition="right"
          >
            View All History
          </Button>
        )}
      </div>

      {recentList.length === 0 ? (
        <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <Inbox size={40} style={{ opacity: 0.4, color: 'var(--text-dim)' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No Practice Sessions Yet</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: 13 }}>
              Upload your resume and start a tailored mock interview session.
            </p>
          </div>
          <Button
            variant="gradient"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/interviews/new')}
          >
            Start First Interview
          </Button>
        </div>
      ) : (
        <div className="recent-list">
          {recentList.map((item) => (
            <div
              key={item.id}
              className="recent-item"
              onClick={() => navigate(`/interviews/${item.id}`)}
            >
              <div className="recent-item-main">
                <div className="recent-item-title-row">
                  <h4 className="recent-item-title">{item.title}</h4>
                  <Badge variant={getTypeVariant(item.type)} size="sm">
                    {item.type}
                  </Badge>
                </div>
                <div className="recent-item-meta">
                  <span className="meta-info">
                    <Calendar size={13} /> {formatDate(item.date)}
                  </span>
                  <span className="meta-info">
                    <Clock size={13} /> {item.duration}
                  </span>
                  <span className="meta-info">
                    Difficulty: <strong className="text-secondary">{item.difficulty}</strong>
                  </span>
                </div>
              </div>

              <div className="recent-item-action-wrap">
                <div className="recent-score-box">
                  <Award size={16} style={{ color: item.score >= 80 ? 'var(--color-success)' : 'var(--color-primary)' }} />
                  <span className="recent-score-text">{item.score}%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/interviews/${item.id}`);
                  }}
                >
                  View Results
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
