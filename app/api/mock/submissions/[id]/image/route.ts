import { NextResponse } from 'next/server';
import { mockSubmissions } from '../../../../../lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find submission by ID
  const submission = mockSubmissions.find(s => s.id === id);

  if (!submission) {
    return NextResponse.json(
      { error: { message: 'Submission not found', statusCode: 404 } },
      { status: 404 }
    );
  }

  // Map mock submission IDs to Unsplash images
  const imageMap: Record<string, string> = {
    'sub-001': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    'sub-002': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
    'sub-003': 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=400&fit=crop',
    'sub-004': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    'sub-005': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
    'sub-006': 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop',
    'sub-007': 'https://images.unsplash.com/photo-1445112098124-3e76dd67983c?w=400&h=400&fit=crop',
  };

  const imageUrl = imageMap[id];

  if (!imageUrl) {
    return NextResponse.json(
      { error: { message: 'Image not found', statusCode: 404 } },
      { status: 404 }
    );
  }

  // Redirect to the actual image
  return NextResponse.redirect(imageUrl);
}
