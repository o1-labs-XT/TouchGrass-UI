import { NextResponse } from 'next/server';
import { mockSubmissions, simulateApiDelay } from '../../../../lib/mockData';

/**
 * GET /api/mock/submissions/{id}
 *
 * Get a single submission by ID
 *
 * Returns: Submission | 404 error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await simulateApiDelay();

  const submission = mockSubmissions.find(sub => sub.id === params.id);

  if (!submission) {
    return NextResponse.json(
      { error: { message: 'Submission not found', statusCode: 404 } },
      { status: 404 }
    );
  }

  return NextResponse.json(submission);
}
