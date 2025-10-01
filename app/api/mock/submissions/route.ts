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
 *   - userWalletAddress: Filter by user
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

  // Filter by userWalletAddress if provided
  if (userWalletAddress) {
    filtered = filtered.filter(sub => sub.userWalletAddress === userWalletAddress);
  }

  // Sort by chainPosition ascending (to show chain in order)
  filtered.sort((a, b) => a.chainPosition - b.chainPosition);

  return NextResponse.json(filtered);
}