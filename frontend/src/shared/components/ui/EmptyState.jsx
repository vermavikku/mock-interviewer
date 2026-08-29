import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import './EmptyState.css';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
  actionIcon,
}) {
  return (
    <div className="empty-state-wrapper animate-fade-in">
      <div className="empty-state-icon-box">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} icon={actionIcon} className="empty-state-btn">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
