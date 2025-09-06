import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // MVP mock endpoint - receives image, publicKey, signature
    // Full spec expects: image, tagline?, socialLink?, chainId?, isPublic, signedTransaction
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
    
    // Return mock Submission object matching FRONTEND_SPEC.md
    const submission = {
      id: `sub-${Math.random().toString(36).substring(2, 15)}`,
      tokenOwnerAddress: publicKey,
      challengeId: 'challenge-001',
      imageUrl: `/api/mock/image/${Date.now()}`,
      isPublic: false,
      votes: 0,
      status: 'uploading' as const,
      createdAt: new Date().toISOString()
    };
    
    // Simulate status progression (for demo purposes)
    // In real backend, this would be tracked server-side
    console.log('Mock submission will progress through states: uploading -> proving -> publishing -> verified');
    
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Mock submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}