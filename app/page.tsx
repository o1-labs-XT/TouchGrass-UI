'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/challenge/550e8400-e29b-41d4-a716-446655440000');
  }, [router]);

  return null;
}
