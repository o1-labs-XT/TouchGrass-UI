'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubmission, getImageUrl, getCachedSubmissionSync } from '../../lib/backendClient';
import type { Submission } from '../../lib/backendClient';
import BackButton from '../../components/BackButton';
import SubmissionCard from '../../components/SubmissionCard';
import SubmissionStatus from '../../components/SubmissionStatus';
import SubmissionProgress from '../../components/SubmissionProgress';
import LikeButton from '../../components/LikeButton';
import styles from './SubmissionDetail.module.css';

interface ShareIconProps {
  onClick: () => void;
  className?: string;
}

function ShareIcon({ onClick, className }: ShareIconProps) {
  return (
    <button 
      onClick={onClick}
      className={`${styles.shareButton} ${className || ''}`}
      title="Share submission"
      aria-label="Share submission"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    </button>
  );
}

interface SubmissionDetailClientProps {
  params: Promise<{ id: string }>;
}

export default function SubmissionDetailClient({ params }: SubmissionDetailClientProps) {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    params.then(p => setSubmissionId(p.id));
  }, [params]);

  useEffect(() => {
    if (!submissionId) return;

    // Check for cached data first
    const cachedSubmission = getCachedSubmissionSync(submissionId);
    if (cachedSubmission) {
      setSubmission(cachedSubmission);
      setLoading(false);
      setError(null);
    }

    async function fetchSubmission() {
      try {
        // Only show loading if we don't have cached data
        if (!cachedSubmission) {
          setLoading(true);
        }
        setError(null);

        const submissionData = await getSubmission(submissionId);
        setSubmission(submissionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId]);

  const handleShare = async () => {
    const url = window.location.href;
    
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TouchGrass - Submission #${submission?.chainPosition}`,
          text: submission?.tagline || 'Check out this TouchGrass submission!',
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled sharing or share failed
        console.log('Web Share cancelled or failed:', err);
      }
    }
    
    // Modern Clipboard API (requires secure context)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
        return;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    // Fallback: Select text for manual copying (no deprecated APIs)
    try {
      const textArea = document.createElement('input');
      textArea.type = 'text';
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.top = '50%';
      textArea.style.left = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.padding = '10px';
      textArea.style.border = '2px solid #667eea';
      textArea.style.borderRadius = '8px';
      textArea.style.fontSize = '16px';
      textArea.style.zIndex = '10000';
      textArea.style.background = 'white';
      textArea.readOnly = true;
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Show instructions
      const instruction = document.createElement('div');
      instruction.textContent = 'Link selected! Press Ctrl/Cmd+C to copy, then click anywhere to close.';
      instruction.style.position = 'fixed';
      instruction.style.top = '45%';
      instruction.style.left = '50%';
      instruction.style.transform = 'translate(-50%, -50%)';
      instruction.style.background = '#333';
      instruction.style.color = 'white';
      instruction.style.padding = '8px 12px';
      instruction.style.borderRadius = '4px';
      instruction.style.fontSize = '14px';
      instruction.style.zIndex = '10001';
      
      document.body.appendChild(instruction);
      
      // Clean up on click anywhere
      const cleanup = () => {
        document.body.removeChild(textArea);
        document.body.removeChild(instruction);
        document.removeEventListener('click', cleanup);
        document.removeEventListener('keydown', handleKeydown);
      };
      
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      
      // Auto-cleanup after 10 seconds
      setTimeout(cleanup, 10000);
      
      document.addEventListener('click', cleanup);
      document.addEventListener('keydown', handleKeydown);
      
    } catch (err) {
      console.error('All share methods failed:', err);
      // Final fallback - show URL in alert
      alert(`Please copy this link manually: ${url}`);
    }
  };

  if (loading) {
    return <div className={styles.loading}><p>Loading submission...</p></div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className={styles.error}>
        <p>Submission not found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <BackButton onClick={() => router.push(`/chain/${submission.chainId}`)} />
          <h1 className={styles.pageTitle}>
            Submission #{submission.chainPosition}
          </h1>
          <ShareIcon onClick={handleShare} />
        </div>

        {copyFeedback && (
          <div className={styles.copyFeedback}>
            Link copied to clipboard!
          </div>
        )}

        <SubmissionStatus status={submission.status} />

        <SubmissionCard centered>
          <div className={styles.submissionContent}>
            <div className={styles.imageContainer}>
              <img
                src={getImageUrl(submission.id)}
                alt={submission.tagline || `Submission ${submission.chainPosition}`}
                className={styles.image}
                crossOrigin="anonymous"
                loading="eager"
                decoding="sync"
              />
            </div>
            
            {submission.tagline && (
              <div className={styles.tagline}>
                <h2>{submission.tagline}</h2>
              </div>
            )}

            <div className={styles.likeSection}>
              <LikeButton submissionId={submission.id} size="large" />
            </div>

            <div className={styles.metadata}>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Position in Chain:</span>
                <span className={styles.value}>#{submission.chainPosition}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Created:</span>
                <span className={styles.value}>
                  {new Date(submission.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </SubmissionCard>
        
        <SubmissionProgress 
          status={submission.status} 
          transactionId={submission.transactionId} 
        />
      </div>
    </div>
  );
}