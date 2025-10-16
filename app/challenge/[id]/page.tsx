'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChallenge, getChainsByChallenge } from '../../lib/backendClient';
import type { Challenge, Chain } from '../../lib/backendClient';
import Button from '../../components/Button';
import SubmissionCard from '../../components/SubmissionCard';
import StatBox from '../../components/StatBox';
import styles from './Challenge.module.css';

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState<string>('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setChallengeId(p.id));
  }, [params]);

  useEffect(() => {
    if (!challengeId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const challengeData = await getChallenge(challengeId);
        setChallenge(challengeData);

        // Try to get chains for this challenge
        try {
          const chains = await getChainsByChallenge(challengeData.id);
          if (chains.length > 0) {
            setChain(chains[0]);
          }
        } catch {
          console.log('No chains found - will be created on first submission');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [challengeId]);

  if (loading) {
    return (
      <main className={styles.loading}>
        <p>Loading challenge...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.error}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        {challenge && (
          <>
            <header className={styles.header}>
              <h1 className={styles.pageTitle}>Challenge Details</h1>
            </header>

            <SubmissionCard centered className={styles.challengeCard}>
              <div className={styles.icon}>🌱</div>
              <h2 className={styles.title}>{challenge.title}</h2>
              <p className={styles.description}>{challenge.description}</p>

              <div className={styles.statsGrid}>
                <StatBox value={challenge.participantCount} label="Participants" />
                <StatBox value={chain?.length || 0} label="Chain Length" />
              </div>

              <div className={styles.challengeStatus}>
                {new Date(challenge.endTime) > new Date() ? (
                  <p className={styles.activeStatus}>
                    🟢 Active until {new Date(challenge.endTime).toLocaleDateString()}
                  </p>
                ) : (
                  <p className={styles.completedStatus}>
                    ✅ Completed on {new Date(challenge.endTime).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className={styles.buttonGroup}>
                {chain && (
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/chain/${chain.id}`)}
                  >
                    View Chain
                  </Button>
                )}

                {new Date(challenge.endTime) > new Date() && (
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/submit?chainId=${chain?.id || '1'}`)}
                  >
                    Join Challenge
                  </Button>
                )}
              </div>
            </SubmissionCard>
          </>
        )}
      </div>
    </main>
  );
}