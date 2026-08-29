import React from 'react';
import { cn } from '../../utils/cn';
import './Card.css';

export function Card({
  children,
  className = '',
  hoverable = false,
  glow = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'ui-card',
        hoverable && 'ui-card-hoverable',
        glow && 'ui-card-glow',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={cn('ui-card-header', className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }) {
  return <h3 className={cn('ui-card-title', className)} {...props}>{children}</h3>;
}

export function CardDescription({ children, className = '', ...props }) {
  return <p className={cn('ui-card-desc', className)} {...props}>{children}</p>;
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={cn('ui-card-content', className)} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }) {
  return <div className={cn('ui-card-footer', className)} {...props}>{children}</div>;
}
