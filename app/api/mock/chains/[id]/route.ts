import { NextResponse } from 'next/server';
import { mockChain } from '../../../../lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  if (params.id === '1') {
    return NextResponse.json(mockChain);
  }

  return NextResponse.json(
    { error: { message: 'Chain not found' } },
    { status: 404 }
  );
}