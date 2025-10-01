'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChain, getSubmissionsByChain } from '../../lib/backendClient';
import type { Chain, Submission } from '../../lib/backendClient';
import Button from '../../components/Button';

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
    return <main><p>Loading chain...</p></main>;
  }

  if (error) {
    return (
      <main>
        <p>Error: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </main>
    );
  }

  return (
    <main>
      <h1>{chain?.name}</h1>
      <Button variant="secondary" onClick={() => router.back()}>
        ← Back
      </Button>
      <p>{submissions.length} submissions</p>
    </main>
  );
}
