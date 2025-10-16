'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChain, getSubmissionsByChain, getImageUrl } from '../../lib/backendClient';
import type { Chain, Submission } from '../../lib/backendClient';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import SubmissionCard from '../../components/SubmissionCard';
import StatBox from '../../components/StatBox';
import styles from './ChainDetail.module.css';

export default function ChainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [chainId, setChainId] = useState<string>('');
  const [chain, setChain] = useState<Chain | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preload images for better navigation performance
  useEffect(() => {
    if (submissions.length > 0) {
      submissions.forEach(submission => {
        const img = new Image();
        img.src = getImageUrl(submission.id);
        // Images are now in browser cache for instant loading
      });
    }
  }, [submissions]);

  useEffect(() => {
    params.then(p => setChainId(p.id));
  }, [params]);

  useEffect(() => {
    if (!chainId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const chainData = await getChain(chainId);
        setChain(chainData);

        const submissionsData = await getSubmissionsByChain(chainId);
        setSubmissions(submissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chain');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [chainId]);

  if (loading) {
    return <div className={styles.loading}><p>Loading chain...</p></div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <BackButton onClick={() => router.push(`/challenge/${chain?.challengeId}`)} />
          <h1 className={styles.pageTitle}>{chain?.name}</h1>
        </div>

      {chain && (
        <SubmissionCard centered>
          <div className={styles.statsGrid}>
            <StatBox value={chain.length} label="Images" />
            <StatBox value={submissions.length} label="Submissions" />
          </div>
          <Button variant="primary" onClick={() => router.push(`/submit?chainId=${chainId}`)}>
            Extend Chain
          </Button>
        </SubmissionCard>
      )}

      <div className={styles.submissions}>
        <h2>Chain Images ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <p>No submissions yet</p>
        ) : (
          <div className={styles.grid}>
            {submissions.map((submission) => (
              <SubmissionCard 
                key={submission.id}
                onClick={() => router.push(`/submission/${submission.id}`)}
                className={styles.submissionCard}
              >
                <div className={styles.position}>#{submission.chainPosition}</div>
                <img
                  src={getImageUrl(submission.id)}
                  alt={submission.tagline || `Position ${submission.chainPosition}`}
                  className={styles.image}
                  crossOrigin="anonymous"
                  loading="lazy"
                  decoding="async"
                />
                {submission.tagline && <p className={styles.tagline}>{submission.tagline}</p>}
              </SubmissionCard>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
