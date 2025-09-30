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
  return (
    <main>
      <h1>Challenge Page</h1>
      <p>Challenge ID: {params.id}</p>
    </main>
  );
}