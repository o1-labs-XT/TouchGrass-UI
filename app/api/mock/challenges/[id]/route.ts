import { NextResponse } from 'next/server';
import { mockChallenges, simulateApiDelay } from '../../../../lib/mockData';

/**
 * GET /api/mock/challenges/{id}
 *
 * Get a single challenge by ID
 *
 * Returns: Challenge | 404 error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await simulateApiDelay();

  const challenge = mockChallenges.find(challenge => challenge.id === id);

  if (!challenge) {
    return NextResponse.json(
      { error: { message: 'Challenge not found', statusCode: 404 } },
      { status: 404 }
    );
  }

  return NextResponse.json(challenge);
}