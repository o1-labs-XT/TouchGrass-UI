import { Metadata } from 'next';
import ChainDetailClient from './ChainDetailClient';
import { getSubmission, getImageUrl } from '../../lib/backendClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submission?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  try {
    const resolvedSearchParams = await searchParams;
    const submissionId = resolvedSearchParams.submission;

    // If no submission query param, return default chain metadata
    if (!submissionId) {
      return {
        title: 'TouchGrass - Chain',
        description: 'View photo submissions in this TouchGrass chain.',
      };
    }

    // Fetch submission data for rich preview
    const submission = await getSubmission(submissionId);
    const imageUrl = getImageUrl(submission.id);

    // Construct absolute URLs
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'production'
      ? 'https://touchgrass-ui.vercel.app'
      : 'http://localhost:3000';

    const { id } = await params;
    const pageUrl = `${baseUrl}/chain/${id}?submission=${submissionId}`;
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

    return {
      title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
      description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain. ${submission.tagline || 'A verified photo submission on the Mina blockchain.'}`,
      openGraph: {
        title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
        description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain.`,
        url: pageUrl,
        siteName: 'TouchGrass',
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: submission.tagline || `TouchGrass submission #${submission.chainPosition}`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
        description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain.`,
        images: [absoluteImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'TouchGrass - Chain',
      description: 'View photo submissions in this TouchGrass chain.',
    };
  }
}

export default async function ChainDetailPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialSubmissionId = resolvedSearchParams.submission;

  return <ChainDetailClient params={params} initialSubmissionId={initialSubmissionId} />;
}
