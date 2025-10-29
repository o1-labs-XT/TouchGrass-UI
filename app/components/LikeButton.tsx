'use client';

import { useState, useEffect } from 'react';
import { likeSubmission, unlikeSubmission, getLikeCount } from '../lib/backendClient';
import { useWallet } from '../contexts/WalletContext';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  submissionId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'small' | 'large';
}

export default function LikeButton({
  submissionId,
  initialLiked = false,
  initialCount = 0,
  size = 'small',
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

  const handleToggleLike = async () => {
    if (!address || loading) return;

    // Optimistic update
    const previousLiked = liked;
    const previousCount = count;

    setLiked(!liked);
    setCount(!liked ? count + 1 : count - 1);
    setLoading(true);
    setError(null);

    try {
      if (!liked) {
        await likeSubmission(submissionId, address!);
        // Show floating heart animation on successful like
        setShowFloatingHeart(true);
      } else {
        await unlikeSubmission(submissionId, address!);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';

      // Special handling for 409: user already liked (lazy load discovery)
      if (errorMessage.includes('409') || errorMessage.includes('already')) {
        // Keep liked=true (user discovered they already liked this)
        // But rollback count increment (no new like was created)
        setLiked(true);
        setCount(previousCount);
        // Show floating heart since they liked it
        setShowFloatingHeart(true);
        // Don't show error - this is expected in lazy load approach
      } else {
        // Rollback on other errors
        setLiked(previousLiked);
        setCount(previousCount);

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
    <div className={styles.container}>
      <button
        onClick={handleToggleLike}
        disabled={loading || !address}
        className={`${styles.likeButton} ${size === 'large' ? styles.large : ''} ${loading ? styles.loading : ''}`}
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
