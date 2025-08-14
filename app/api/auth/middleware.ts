import { NextRequest } from "next/server";
import { findSession, getUserById, User } from "./store";

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: "user";
}

export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  // CSE-3: Enhance token validation middleware - Add Bearer token support here
  const authHeader = request.headers.get("Authorization");
  let sessionId = request.cookies.get("sessionId")?.value;

  // If no session cookie, attempt to extract token from bearer token Authorization header
  if (!sessionId && authHeader?.startsWith("Bearer ")) {
    sessionId = authHeader.substring(7);
  }

  if (!sessionId) {
    // CSE-3: If no session cookie, check for Bearer token in Authorization header
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
    role: user.role,
  };
}

export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>,
) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return handler(request, user);
  };
}
