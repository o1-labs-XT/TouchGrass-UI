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

  return (
    <main>
      <h1>Challenge Page</h1>
      <p>Challenge ID: {params.id}</p>
    </main>
  );
}