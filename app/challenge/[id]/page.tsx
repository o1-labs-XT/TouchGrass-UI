'use client';

import { useState, useEffect } from 'react';
import { getCurrentChallenge, getChain } from '../../lib/backendClient';
import type { Challenge, Chain } from '../../lib/backendClient';

interface ChallengePageProps {
  params: {
    id: string;
  };
}

export default function ChallengePage({ params }: ChallengePageProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // MVP: only support "current" challenge
        if (params.id !== 'current') {
          throw new Error('Invalid challenge ID');
        }

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
  }, [params.id]);

  if (loading) {
    return (
      <main>
        <p>Loading challenge...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <p>Error: {error}</p>
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