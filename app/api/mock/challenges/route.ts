import { NextResponse } from 'next/server';
import { mockChallenges, simulateApiDelay } from '../../../lib/mockData';

/**
 * GET /api/mock/challenges
 *
 * Get all challenges (both active and completed)
 *
 * Returns: Challenge[]
 */
export async function GET() {
  await simulateApiDelay();

  // Return all challenges sorted by creation date (newest first)
  const sortedChallenges = [...mockChallenges].sort((a, b) => 
    new Date(b.createdAt || b.startTime).getTime() - new Date(a.createdAt || a.startTime).getTime()
  );

  return NextResponse.json(sortedChallenges);
}