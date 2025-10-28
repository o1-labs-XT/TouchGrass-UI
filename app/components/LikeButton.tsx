'use client';

import { useState, useEffect } from 'react';
import { likeSubmission, unlikeSubmission, getLikeCount, checkUserLiked } from '../lib/backendClient';
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

  // Fetch initial like state and count
  useEffect(() => {
    if (!address) return;

    async function fetchLikeData() {
      try {
        const [likeCountData, userLiked] = await Promise.all([
          getLikeCount(submissionId),
          checkUserLiked(submissionId, address!),
        ]);

        setCount(likeCountData.count);
        setLiked(userLiked);
      } catch (err) {
        console.error('Failed to fetch like data:', err);
      }
    }

    fetchLikeData();
  }, [submissionId, address]);

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
      } else {
        await unlikeSubmission(submissionId, address!);
      }
    } catch (err) {
      // Rollback on error
      setLiked(previousLiked);
      setCount(previousCount);

      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';

      // User-friendly error messages
      if (errorMessage.includes('403') || errorMessage.includes('approved submission')) {
        setError('You need an approved submission before you can like others');
      } else if (errorMessage.includes('404')) {
        setError('This submission could not be found');
      } else if (errorMessage.includes('409') || errorMessage.includes('already')) {
        setError("You've already liked this submission");
      } else {
        setError('Something went wrong. Please try again');
      }

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
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
    </div>
  );
}
