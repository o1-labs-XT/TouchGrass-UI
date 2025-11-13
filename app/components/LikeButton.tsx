'use client';

import { useState, useEffect } from 'react';
import { likeSubmission, unlikeSubmission, getLikeCount, invalidateSubmissionCache } from '../lib/backendClient';
import { useWallet } from '../contexts/WalletContext';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  submissionId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'small' | 'large';
  variant?: 'default' | 'floating' | 'inline' | 'carousel';
  onCountChange?: (newCount: number) => void;
}

export default function LikeButton({
  submissionId,
  initialLiked = false,
  initialCount = 0,
  size = 'small',
  variant = 'default',
  onCountChange,
}: LikeButtonProps) {
  const { address } = useWallet();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);

  // Fetch initial like count (lazy load - don't check if user liked)
  useEffect(() => {
    if (!address) return;

    async function fetchLikeCount() {
      try {
        // Only fetch count if not provided via initialCount prop
        if (initialCount === undefined) {
          const likeCountData = await getLikeCount(submissionId);
          setCount(likeCountData.count);
        }
        // Note: We don't check if user liked - hearts show gray initially
        // User discovers they already liked when clicking (409 response)
      } catch (err) {
        console.error('Failed to fetch like count:', err);
      }
    }

    fetchLikeCount();
  }, [submissionId, address, initialCount]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to parent elements

    if (!address || loading) return;

    console.log('[LikeButton] handleToggleLike called:', {
      submissionId,
      walletAddress: address,
      currentLikedState: liked,
      currentCount: count,
    });

    // Optimistic update
    const previousLiked = liked;
    const previousCount = count;
    const newCount = !liked ? count + 1 : Math.max(0, count - 1);

    setLiked(!liked);
    setCount(newCount);
    onCountChange?.(newCount); // Notify parent of optimistic update
    setLoading(true);
    setError(null);

    try {
      if (!liked) {
        console.log('[LikeButton] Calling likeSubmission API...');
        await likeSubmission(submissionId, address!);
        console.log('[LikeButton] Like successful!');
        // Show floating heart animation on successful like
        setShowFloatingHeart(true);
        // Invalidate cache so detail page shows fresh data
        invalidateSubmissionCache(submissionId);
      } else {
        console.log('[LikeButton] Calling unlikeSubmission API...');
        await unlikeSubmission(submissionId, address!);
        console.log('[LikeButton] Unlike successful!');
        // Invalidate cache so detail page shows fresh data
        invalidateSubmissionCache(submissionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';
      console.error('[LikeButton] Error:', {
        error: err,
        errorMessage,
        submissionId,
        walletAddress: address,
      });

      // Special handling for 409: user already liked (lazy load discovery)
      if (errorMessage.includes('409') || errorMessage.includes('already')) {
        // Keep liked=true (user discovered they already liked this)
        // But rollback count increment (no new like was created)
        setLiked(true);
        setCount(previousCount);
        onCountChange?.(previousCount); // Notify parent of rollback
        // Show floating heart since they liked it
        setShowFloatingHeart(true);
        // Don't show error - this is expected in lazy load approach
      } else {
        // Rollback on other errors
        setLiked(previousLiked);
        setCount(previousCount);
        onCountChange?.(previousCount); // Notify parent of rollback

        // User-friendly error messages
        if (errorMessage.includes('403') || errorMessage.includes('approved submission')) {
          setError('You need an approved submission before you can like others');
        } else if (errorMessage.includes('404')) {
          setError('This submission could not be found');
        } else {
          setError('Something went wrong. Please try again');
        }

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <button
        onClick={handleToggleLike}
        disabled={loading || !address}
        className={`${styles.likeButton} ${size === 'large' ? styles.large : ''} ${loading ? styles.loading : ''} ${styles[variant]}`}
        aria-label={liked ? 'Unlike submission' : 'Like submission'}
        title={liked ? 'Unlike' : 'Like'}
      >
        <svg
          width={size === 'large' ? 32 : 24}
          height={size === 'large' ? 32 : 24}
          viewBox="0 0 24 24"
          className={`${styles.heart} ${liked ? styles.heartFilled : styles.heartUnfilled}`}
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={`${styles.count} ${size === 'large' ? styles.countLarge : ''}`}>
          {count}
        </span>
      </button>
      {error && (
        <div className={styles.errorToast}>
          {error}
        </div>
      )}
      {showFloatingHeart && (
        <div
          className={styles.floatingHeart}
          onAnimationEnd={() => setShowFloatingHeart(false)}
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
