import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { SummaryMetrics } from '../components/SummaryMetrics';
import { PracticePerformanceChart } from '../components/PracticePerformanceChart';
import { RecentInterviewsTable } from '../components/RecentInterviewsTable';
import { RecommendedPracticeCard } from '../components/RecommendedPracticeCard';
import { DashboardSkeleton } from '../../../shared/components/feedback/SkeletonLoader';
import '../components/Dashboard.css';

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate lightweight smooth loading transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="dashboard-page animate-fade-in">
      {/* 4 Summary Metric Cards */}
      <SummaryMetrics />

      {/* Main Grid: Chart & Recommendation */}
      <div className="dashboard-main-grid">
        <div className="grid-col-chart">
          <PracticePerformanceChart />
        </div>
        <div className="grid-col-rec">
          <RecommendedPracticeCard />
        </div>
      </div>

      {/* Recent Interviews Table / Cards */}
      <RecentInterviewsTable />
    </PageWrapper>
  );
}
