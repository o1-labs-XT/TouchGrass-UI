import ChainDetailClient from './ChainDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submission?: string }>;
}

export default async function ChainDetailPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialSubmissionId = resolvedSearchParams.submission;

  return <ChainDetailClient params={params} initialSubmissionId={initialSubmissionId} />;
}
