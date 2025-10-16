import { Metadata } from 'next';
import { getSubmission, getImageUrl } from '../../lib/backendClient';
import type { Submission } from '../../lib/backendClient';
import SubmissionDetailClient from './SubmissionDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const submission = await getSubmission(id);
    const imageUrl = getImageUrl(submission.id);
    
    // Construct absolute URLs for metadata
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'production'
      ? 'https://touchgrass-ui.vercel.app' // Update with your production domain
      : 'http://localhost:3000';
    
    const pageUrl = `${baseUrl}/submission/${id}`;
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
      title: 'TouchGrass - Submission',
      description: 'A photo submission from TouchGrass - the social challenge game on Mina blockchain.',
    };
  }
}

export default function SubmissionDetailPage({ params }: PageProps) {
  return <SubmissionDetailClient params={params} />;
}