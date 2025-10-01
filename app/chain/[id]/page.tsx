'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChain, getSubmissionsByChain } from '../../lib/backendClient';
import type { Chain, Submission } from '../../lib/backendClient';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatBox from '../../components/StatBox';
import styles from './ChainDetail.module.css';

export default function ChainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [chainId, setChainId] = useState<string>('');
  const [chain, setChain] = useState<Chain | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className={styles.pageTitle}>{chain?.name}</h1>
        </div>

      {chain && (
        <Card centered>
          <div className={styles.statsGrid}>
            <StatBox value={chain.length} label="Images" />
            <StatBox value={submissions.length} label="Submissions" />
          </div>
          <Button variant="primary" onClick={() => router.push('/submit')}>
            Extend This Chain
          </Button>
        </Card>
      )}

      <div className={styles.submissions}>
        <h2>Chain Images ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <p>No submissions yet</p>
        ) : (
          <div className={styles.grid}>
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <div className={styles.position}>#{submission.chainPosition}</div>
                <img
                  src={submission.imageUrl}
                  alt={submission.tagline || `Position ${submission.chainPosition}`}
                  className={styles.image}
                  crossOrigin="anonymous"
                />
                {submission.tagline && <p>{submission.tagline}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
