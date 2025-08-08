import { NextResponse } from 'next/server';
import { users, createSession } from '../store';

export async function POST() {
  try {
    // Get the default user (first user in the array)
    const defaultUser = users[0];
    
    if (!defaultUser) {
      return NextResponse.json(
        { error: 'No default user available' },
        { status: 500 }
      );
    }

    // Create a session for the default user
    const session = createSession(defaultUser.id);

    const response = NextResponse.json({
      user: {
        id: defaultUser.id,
        username: defaultUser.username,
        role: defaultUser.role
      }
    });

    // Set the session cookie
    response.cookies.set('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { error: 'Auto-login failed' },
      { status: 500 }
    );
  }
}