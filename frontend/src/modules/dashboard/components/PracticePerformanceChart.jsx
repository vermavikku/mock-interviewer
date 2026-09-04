import React, { useState } from 'react';
import { Sparkles, BarChart2 } from 'lucide-react';
import { useInterview } from '../../../shared/context/InterviewContext';
import './Dashboard.css';

export function PracticePerformanceChart() {
  const { interviews } = useInterview();
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Derive dynamic chart points from real interview history (ordered chronologically)
  const chartData = [...(interviews || [])]
    .filter((item) => typeof item.score === 'number' && item.score > 0)
    .reverse()
    .slice(-7)
    .map((item, idx) => {
      const sub = item.subScores || {};
      const score = item.score || 80;
      return {
        session: `Sess ${idx + 1}`,
        title: item.title,
        technical: sub.technical || Math.min(100, score + 2),
        communication: sub.communication || Math.max(60, score - 2),
        problemSolving: sub.problemSolving || score,
        avg: score,
      };
    });

  const hasData = chartData.length > 0;
  const data = hasData
    ? chartData
    : [
        { session: 'Start', technical: 0, communication: 0, problemSolving: 0, avg: 0 },
      ];

  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (idx) =>
    data.length === 1
      ? width / 2
      : paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);

  const getY = (val) => height - paddingY - (Math.max(0, val - 40) / 60) * (height - paddingY * 2);

  const createPath = (key) => {
    if (data.length <= 1) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`)
      .join(' ');
  };

  const latest = data[data.length - 1];

  const categories = [
    { key: 'all', label: 'All Dimensions', color: 'var(--color-primary)' },
    { key: 'technical', label: `Technical (${hasData ? latest.technical + '%' : 'N/A'})`, color: '#0F766E' },
    { key: 'communication', label: `Communication (${hasData ? latest.communication + '%' : 'N/A'})`, color: '#0EA5E9' },
    { key: 'problemSolving', label: `Problem Solving (${hasData ? latest.problemSolving + '%' : 'N/A'})`, color: '#10B981' },
  ];

  return (
    <div className="performance-chart-card glass-panel">
      <div className="chart-header">
        <div>
          <div className="chart-badge-title">
            <Sparkles size={16} className="text-cyan" style={{ color: '#0F766E' }} />
            <h3 className="chart-title">Interview Performance Progression</h3>
          </div>
          <p className="chart-subtitle">
            {hasData
              ? `Adaptive evaluation across your last ${data.length} practice session(s)`
              : 'Complete your first practice session to unlock real-time performance tracking'}
          </p>
        </div>

        {hasData && (
          <div className="category-toggles">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`cat-toggle-btn ${activeCategory === cat.key ? 'active' : ''}`}
              >
                <span className="cat-dot" style={{ background: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-dim)' }}>
          <BarChart2 size={36} style={{ opacity: 0.5 }} />
          <span>No completed interviews yet. Start your first session to see your progress curve!</span>
        </div>
      ) : (
        <div className="svg-chart-container">
          <svg viewBox={`0 0 ${width} ${height}`} className="performance-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F766E" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[50, 60, 70, 80, 90, 100].map((score) => {
              const y = getY(score);
              return (
                <g key={score}>
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <text x={paddingX - 10} y={y + 4} fill="var(--text-secondary)" fontSize="10" textAnchor="end">
                    {score}%
                  </text>
                </g>
              );
            })}

            {/* Lines */}
            {(activeCategory === 'all' || activeCategory === 'technical') && createPath('technical') && (
              <path d={createPath('technical')} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {(activeCategory === 'all' || activeCategory === 'communication') && createPath('communication') && (
              <path d={createPath('communication')} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {(activeCategory === 'all' || activeCategory === 'problemSolving') && createPath('problemSolving') && (
              <path d={createPath('problemSolving')} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Interactive Data points */}
            {data.map((d, i) => {
              const x = getX(i);
              return (
                <g key={i} className="chart-datapoint-group" onMouseEnter={() => setHoveredPoint(d)} onMouseLeave={() => setHoveredPoint(null)}>
                  <text x={x} y={height - 6} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                    {d.session}
                  </text>
                  <circle cx={x} cy={getY(d.technical)} r="4" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx={x} cy={getY(d.communication)} r="4" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx={x} cy={getY(d.problemSolving)} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              );
            })}
          </svg>

          {hoveredPoint && (
            <div className="chart-tooltip animate-pop-in">
              <span className="tooltip-title">{hoveredPoint.title || hoveredPoint.session}</span>
              <div className="tooltip-row"><span style={{ color: '#0F766E' }}>● Technical:</span> {hoveredPoint.technical}%</div>
              <div className="tooltip-row"><span style={{ color: '#0EA5E9' }}>● Communication:</span> {hoveredPoint.communication}%</div>
              <div className="tooltip-row"><span style={{ color: '#10B981' }}>● Problem Solving:</span> {hoveredPoint.problemSolving}%</div>
              <div className="tooltip-avg">Overall Score: {hoveredPoint.avg}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
