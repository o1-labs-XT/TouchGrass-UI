import { NextResponse } from 'next/server';
import { mockChain } from '../../../../lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  if (id === '1') {
    return NextResponse.json(mockChain);
  }

  return NextResponse.json(
    { error: { message: 'Chain not found' } },
    { status: 404 }
  );
}