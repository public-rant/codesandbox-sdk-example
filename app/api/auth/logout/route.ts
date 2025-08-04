import { NextRequest, NextResponse } from 'next/server';
import { removeSession } from '../store';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId')?.value;

  if (sessionId) {
    removeSession(sessionId);
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  response.cookies.set('sessionId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  });

  return response;
}