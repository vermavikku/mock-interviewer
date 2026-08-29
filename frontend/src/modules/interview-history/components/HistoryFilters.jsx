import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import './InterviewHistory.css';

export function HistoryFilters({
  activeFilter,
  setActiveFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
}) {
  const filters = ['All', 'Technical', 'System Design', 'Behavioral', 'HR'];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highestScore', label: 'Highest Score' },
    { value: 'lowestScore', label: 'Lowest Score' },
  ];

  return (
    <div className="history-filters-bar glass-panel animate-fade-in">
      <div className="history-search-col">
        <Input
          icon={Search}
          placeholder="Search by role, topic, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="history-filter-pills">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="history-sort-col">
        <Select
          icon={ArrowUpDown}
          options={sortOptions}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        />
      </div>
    </div>
  );
}
