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
    
    console.log('Mock submission received:', {
      imageName: image.name,
      imageSize: image.size,
      publicKey,
      signature: signature.substring(0, 20) + '...'
    });
    
    // Return mock Submission object
    const submission = {
      id: Math.random().toString(36).substring(2, 15),
      tokenOwnerAddress: publicKey,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Mock submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}