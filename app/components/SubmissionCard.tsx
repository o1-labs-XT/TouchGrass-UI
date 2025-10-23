'use client';
import React from 'react';
import styles from './SubmissionCard.module.css';

interface SubmissionCardProps {
  children: React.ReactNode;
  centered?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function SubmissionCard({
  children,
  centered = false,
  className = '',
  onClick
}: SubmissionCardProps) {
  return (
    <div 
      className={`${styles.card} ${centered ? styles.centered : ''} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}