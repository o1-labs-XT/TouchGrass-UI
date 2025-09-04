import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File;
  const publicKey = formData.get('publicKey') as string;
  const signature = formData.get('signature') as string;
  
  return NextResponse.json({ message: 'Mock endpoint' });
}