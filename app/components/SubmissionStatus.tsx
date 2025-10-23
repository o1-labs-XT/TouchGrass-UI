'use client';
import React from 'react';
import styles from './SubmissionStatus.module.css';

interface SubmissionStatusProps {
  status: "awaiting_review" | "rejected" | "processing" | "complete";
}

export default function SubmissionStatus({ status }: SubmissionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          icon: (
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          ),
          title: 'Submission Completed',
          subtitle: 'Your submission has been successfully verified and added to the blockchain',
          className: styles.completed
        };
      case 'rejected':
        return {
          icon: (
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ),
          title: 'Submission Abandoned',
          subtitle: 'This submission did not meet verification requirements',
          className: styles.abandoned
        };
      case 'awaiting_review':
      case 'processing':
      default:
        return {
          icon: (
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          ),
          title: 'Submission In Progress',
          subtitle: 'Your submission is being processed and verified',
          className: styles.inProgress
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${styles.container} ${config.className}`}>
      <div className={styles.iconContainer}>
        {config.icon}
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{config.title}</h1>
        <p className={styles.subtitle}>{config.subtitle}</p>
      </div>
    </div>
  );
}