'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [chainId, setChainId] = useState<string>('');

  useEffect(() => {
    params.then(p => setChainId(p.id));
  }, [params]);

  return (
    <main>
      <h1>Chain {chainId}</h1>
      <button onClick={() => router.back()}>← Back</button>
    </main>
  );
}
