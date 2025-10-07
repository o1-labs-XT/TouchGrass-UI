import { NextResponse } from 'next/server';
import { mockSubmissions, simulateApiDelay } from '../../../lib/mockData';

/**
 * GET /api/mock/submissions
 *
 * Mimics the real backend endpoint that lists submissions with filtering
 *
 * Query params:
 *   - chainId: Filter by chain ID (e.g., ?chainId=1)
 *   - challengeId: Filter by challenge ID
 *   - walletAddress: Filter by user
 *
 * Returns: Submission[]
 */
export async function GET(request: Request) {
  await simulateApiDelay();

  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const challengeId = searchParams.get('challengeId');
  const userWalletAddress = searchParams.get('userWalletAddress');

  let filtered = [...mockSubmissions];

  // Filter by chainId if provided
  if (chainId) {
    filtered = filtered.filter(sub => sub.chainId === chainId);
  }

  // Filter by challengeId if provided
  if (challengeId) {
    filtered = filtered.filter(sub => sub.challengeId === challengeId);
  }

  // Filter by walletAddress if provided
  if (userWalletAddress) {
    filtered = filtered.filter(sub => sub.walletAddress === userWalletAddress);
  }

  // Sort by chainPosition ascending (to show chain in order)
  filtered.sort((a, b) => a.chainPosition - b.chainPosition);

  return NextResponse.json(filtered);
}

/**
 * POST /api/mock/submissions
 *
 * Mimics the real backend endpoint for submitting a new photo
 *
 * Accepts FormData with:
 *   - image: File (the photo)
 *   - walletAddress: string
 *   - signature: string
 *   - tagline?: string (optional)
 *   - chainId?: string (optional, defaults to "1")
 *
 * Returns: Submission
 */
export async function POST(request: Request) {
  await simulateApiDelay();

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const signature = formData.get('signature') as string;
    const tagline = formData.get('tagline') as string | null;
    const chainId = (formData.get('chainId') as string) || '1';

    // Validate required fields
    if (!image || !walletAddress || !signature) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', statusCode: 400 } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const hash = `mock-hash-${Date.now()}`;

    // Create mock submission response
    const newSubmission = {
      id: `sub-${Date.now()}`,
      sha256Hash: hash,
      walletAddress,
      signature,
      challengeId: '1',
      chainId: chainId,
      storageKey: `images/${hash}`,
      tagline: tagline || undefined,
      chainPosition: mockSubmissions.length + 1,
      status: 'awaiting_review' as const,
      transactionId: undefined,
      failureReason: undefined,
      retryCount: 0,
      challengeVerified: false,
      createdAt: now,
      updatedAt: now
    };

    return NextResponse.json(newSubmission);
  } catch (error) {
    console.error('Mock submission error:', error);
    return NextResponse.json(
      { error: { message: 'Submission failed', statusCode: 500 } },
      { status: 500 }
    );
  }
}