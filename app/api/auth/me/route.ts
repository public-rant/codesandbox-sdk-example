import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../middleware";

// CSE-4: Add user profile information display
// This endpoint retrieves the authenticated user information for display and frontend use
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
