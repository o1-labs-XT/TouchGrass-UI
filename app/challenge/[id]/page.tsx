'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentChallenge, getChain } from '../../lib/backendClient';
import type { Challenge, Chain } from '../../lib/backendClient';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatBox from '../../components/StatBox';
import styles from './Challenge.module.css';

export default function ChallengePage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const challengeData = await getCurrentChallenge();
        setChallenge(challengeData);

        // Try to get default chain, don't fail if it doesn't exist
        try {
          const chainData = await getChain('1');
          setChain(chainData);
        } catch {
          console.log('Chain not found - will be created on first submission');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
    <main>
      {challenge && (
        <div>
          <h1>{challenge.title}</h1>
          <p>{challenge.description}</p>
        </div>
      )}
      {chain && (
        <div>
          <h2>Chain: {chain.name}</h2>
          <p>Length: {chain.length}</p>
        </div>
      )}
    </main>
  );
}