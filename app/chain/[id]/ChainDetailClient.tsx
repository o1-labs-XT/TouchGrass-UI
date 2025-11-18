'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChain, getSubmissionsByChain, getImageUrl } from '../../lib/backendClient';
import type { Chain, Submission } from '../../lib/backendClient';
import GrassyButton from '../../components/GrassyButton';
import BackButton from '../../components/BackButton';
import SubmissionCarousel3D from '../../components/SubmissionCarousel3D';
import styles from './ChainDetail.module.css';

interface ChainDetailClientProps {
  params: Promise<{ id: string }>;
  initialSubmissionId?: string;
}

export default function ChainDetailClient({ params, initialSubmissionId }: ChainDetailClientProps) {
  const router = useRouter();
  const [chainId, setChainId] = useState<string>('');
  const [chain, setChain] = useState<Chain | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scroll on this page
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

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
        <GrassyButton variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </GrassyButton>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <BackButton onClick={() => router.push('/challenges')} />
      </div>

      <SubmissionCarousel3D submissions={submissions} initialSubmissionId={initialSubmissionId} chainId={chainId} />
    </div>
  );
}
