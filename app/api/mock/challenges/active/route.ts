import { NextResponse } from 'next/server';
import { mockCurrentChallenge } from '../../../../lib/mockData';

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return array of active challenges (API v2 returns array)
  return NextResponse.json([mockCurrentChallenge]);
}
