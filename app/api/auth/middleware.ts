import { NextRequest } from 'next/server';
import { findSession, getUserById, User } from './store';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const sessionId = request.cookies.get('sessionId')?.value;
  
  if (!sessionId) {
    return null;
  }

  const session = findSession(sessionId);
  if (!session) {
    return null;
  }

  const user = getUserById(session.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(request, user);
  };
}

export function requireAdmin(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(request, user);
  };
}