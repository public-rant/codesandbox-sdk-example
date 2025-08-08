import { NextResponse } from 'next/server';
import { users } from '../store';

export async function GET() {
  const defaultUser = users[0];
  
  return NextResponse.json({
    hasGitHubToken: !!(defaultUser?.githubToken),
    username: defaultUser?.username || 'user'
  });
}