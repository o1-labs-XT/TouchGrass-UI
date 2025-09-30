import { NextResponse } from 'next/server';
import { mockSubmissions } from '../../../lib/mockData';

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  return NextResponse.json(mockSubmissions);
}