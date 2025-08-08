# CodeSandbox SDK Usage

This project integrates with the CodeSandbox SDK to automatically create sandboxes when creating new projects.

## Documentation Reference

For comprehensive documentation on the CodeSandbox SDK, visit: https://codesandbox.io/docs/sdk

## How It Works

When a new project is created via the `/api/projects` endpoint, the system will:

1. Create the project record with the provided name
2. Attempt to create a new sandbox using the `sandbox-template@latest` template
3. Store the sandbox ID with the project for future reference

## Environment Setup

To enable sandbox creation, you need to set up your CodeSandbox API key:

1. Create a CodeSandbox account at https://codesandbox.io
2. Generate an API key at https://codesandbox.io/t/api
3. Set the environment variable: `CSB_API_KEY=your_api_key_here`

### GitHub Token Requirements

If using GitHub integration features, you'll need a GitHub token with the following permissions:
- Repository creation access
- Push access to repositories

Set the environment variable: `GITHUB_TOKEN=your_github_token_here`

## Template Configuration

The system uses `sandbox-template@latest` as the default template for creating new sandboxes. This template is defined in the `sandbox-template/` directory and contains a basic Vite + React setup.

## Error Handling

If sandbox creation fails (due to missing API key, network issues, or other errors), the project will still be created successfully, but without an associated sandbox ID. The error is logged for debugging purposes.

## Data Structure

Projects now include an optional `sandboxId` field:

```typescript
interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId?: string; // CodeSandbox ID when successfully created
}
```

## Implementation Details

- **File**: `app/api/projects/route.ts:16-18` - Sandbox creation logic
- **File**: `app/api/projects/store.ts:5` - Project interface with sandboxId
- **File**: `app/api/projects/store.ts:11` - Updated addProject function

The integration is designed to be non-blocking - if CodeSandbox is unavailable, project creation will still succeed.