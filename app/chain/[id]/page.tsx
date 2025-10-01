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
    return <div><p>Loading chain...</p></div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1>{chain?.name}</h1>
      </div>

      {chain && (
        <div>
          <p>{chain.length} images in chain</p>
          <Button variant="primary" onClick={() => router.push('/submit')}>
            Extend This Chain
          </Button>
        </div>
      )}

      <div>
        <h2>Chain Images ({submissions.length})</h2>
        {submissions.length === 0 ? (
          <p>No submissions yet</p>
        ) : (
          <div>
            {submissions.map((submission) => (
              <div key={submission.id}>
                <p>#{submission.chainPosition}</p>
                <p>{submission.tagline || 'No caption'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
