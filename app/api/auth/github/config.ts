// CSE-8 GitHub OAuth configuration
export const githubOAuthConfig = {
  // CSE-8 Load client ID from environment variable
  clientId: process.env.GITHUB_CLIENT_ID || '',

  // CSE-8 Load client secret from environment variable
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',

  // CSE-8 Configure callback URL for OAuth flow
  callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',

  // CSE-8 Define required OAuth scopes
  scopes: ['read:user', 'user:email', 'read:org'],

  // CSE-8 Configure authorized organizations (comma-separated in env)
  authorizedOrgs: process.env.GITHUB_AUTHORIZED_ORGS?.split(',') || [],

  // CSE-8 GitHub OAuth endpoints
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',

  // CSE-8 GitHub API base URL
  apiUrl: 'https://api.github.com',
};

// CSE-8 Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  // CSE-8 Check required environment variables are set
  return !!(githubOAuthConfig.clientId && githubOAuthConfig.clientSecret);
}
