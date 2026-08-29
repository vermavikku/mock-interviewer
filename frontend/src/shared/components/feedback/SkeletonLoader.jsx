import React from 'react';
import { cn } from '../../utils/cn';
import './SkeletonLoader.css';

export function Skeleton({ className = '', width, height, borderRadius, style }) {
  return (
    <div
      className={cn('skeleton-box skeleton-shimmer', className)}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton-wrap animate-fade-in">
      <div className="skeleton-metrics-grid">
        <Skeleton height="110px" borderRadius="var(--radius-lg)" />
        <Skeleton height="110px" borderRadius="var(--radius-lg)" />
        <Skeleton height="110px" borderRadius="var(--radius-lg)" />
        <Skeleton height="110px" borderRadius="var(--radius-lg)" />
      </div>
      <div className="skeleton-body-grid">
        <Skeleton height="320px" borderRadius="var(--radius-lg)" />
        <Skeleton height="320px" borderRadius="var(--radius-lg)" />
      </div>
    </div>
  );
}
