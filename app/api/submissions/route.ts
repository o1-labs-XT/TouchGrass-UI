import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const publicKey = formData.get('publicKey') as string;
    const signature = formData.get('signature') as string;
    
    if (!image || !publicKey || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: 'Mock endpoint' });
  } catch (error) {
    console.error('Mock submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}