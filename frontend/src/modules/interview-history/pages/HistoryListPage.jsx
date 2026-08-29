import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { HistoryFilters } from '../components/HistoryFilters';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { formatDate } from '../../../shared/utils/formatters';
import { useInterview } from '../../../shared/context/InterviewContext';
import { Calendar, Clock, Award, ChevronRight, PlusCircle, Inbox, Trash2 } from 'lucide-react';
import { useToast } from '../../../shared/context/ToastContext';
import '../components/InterviewHistory.css';

export function HistoryListPage() {
  const { interviews, deleteInterview } = useInterview();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const filteredInterviews = useMemo(() => {
    let list = [...(interviews || [])];

    // Filter by type
    if (activeFilter !== 'All') {
      list = list.filter((item) => item.type?.toLowerCase() === activeFilter.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.role?.toLowerCase().includes(q) ||
          item.type?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'highestScore') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'lowestScore') return (a.score || 0) - (b.score || 0);
      return 0;
    });

    return list;
  }, [interviews, activeFilter, sortBy, searchQuery]);

  const getTypeVariant = (type) => {
    switch (type) {
      case 'Technical': return 'primary';
      case 'System Design': return 'cyan';
      case 'Behavioral': return 'success';
      case 'HR': return 'warning';
      default: return 'secondary';
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    const { id, title } = sessionToDelete;
    await deleteInterview(id);
    toast.info(`Deleted session: "${title}"`);
    setSessionToDelete(null);
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setSessionToDelete(item);
  };

  return (
    <PageWrapper className="history-page">
      <div className="history-page-header animate-fade-in">
        <div>
          <h2 className="history-main-title">Interview Practice History</h2>
          <p className="history-main-subtitle">
            Review past practice transcripts, scores, question breakdowns, and AI feedback.
          </p>
        </div>
        <Button
          variant="gradient"
          icon={PlusCircle}
          onClick={() => navigate('/interviews/new')}
        >
          New Interview
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <HistoryFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={searchQuery ? 'No matching sessions' : 'No interviews yet'}
          description={
            searchQuery
              ? 'Try modifying your search query or filter tags to find matching sessions.'
              : 'Your interview history will appear here after your first practice session.'
          }
          actionLabel="Start Your First Interview"
          onAction={() => navigate('/interviews/new')}
          actionIcon={PlusCircle}
        />
      ) : (
        <div className="history-cards-grid animate-fade-in">
          {filteredInterviews.map((item) => (
            <div
              key={item.id}
              className="history-session-card glass-panel"
              onClick={() => navigate(`/interviews/${item.id}`)}
            >
              <div className="history-card-header">
                <div className="history-card-badges">
                  <Badge variant={getTypeVariant(item.type)} size="sm">
                    {item.type}
                  </Badge>
                  <span className="diff-pill">{item.difficulty || 'Medium'}</span>
                </div>

                <div className="history-score-display">
                  <Award size={18} style={{ color: item.score >= 80 ? 'var(--color-success)' : 'var(--color-primary)' }} />
                  <span className="score-val">{item.score}%</span>
                </div>
              </div>

              <h3 className="history-card-title">{item.title}</h3>
              <p className="history-card-role">{item.role || 'Software Engineer'}</p>

              <div className="history-meta-row">
                <span className="history-meta-item">
                  <Calendar size={13} /> {formatDate(item.date)}
                </span>
                <span className="history-meta-item">
                  <Clock size={13} /> {item.duration}
                </span>
                <span className="history-meta-item">
                  {item.questions?.length || 3} questions
                </span>
              </div>

              <div className="history-card-footer">
                <button
                  type="button"
                  className="delete-history-btn"
                  onClick={(e) => handleDeleteClick(e, item)}
                  title="Delete interview session"
                  aria-label="Delete interview session"
                >
                  <Trash2 size={15} />
                </button>
                <div className="view-details-link">
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Interview Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Interview Session"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? All transcript records, scoring breakdowns, and question evaluations will be removed.`}
        confirmLabel="Delete Session"
        variant="danger"
        icon={Trash2}
      />
    </PageWrapper>
  );
}
