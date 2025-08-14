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

## Tasks

**Before you generate code or modify files, run the jira tools to track the changes.**

If you generate code or modify files, run the gitbutler update branches MCP tool.


1. **Development Testing:**
   - Test the development app using Playwright. This ensures that any changes made immediately provide immediate feedback from an end-to-end perspective.
   - Command: `npm run test -- --project chromium`

2. **Component Extraction & Isolation:**
   - Identify and extract reusable UI components from the application.
   - Refactor these components to decouple from business logic and make them testable in isolation.
   - Create and update Storybook stories for each component, including interaction tests to simulate user behaviors.
   - Command for Storybook Testing: `npm run test-storybook`
   - Never start the storybook server or dev server. Assume they have been started, or inform the user if they are not running

3. **Outside-In Testing:**
   - After refactoring and establishing isolated component tests, verify overall system behavior with comprehensive outside-in tests using Playwright as described in subsection 1.
   - This step ensures that the integration of isolated UI components into the larger system didn't introduce regressions.

4. **Test Coverage:**
   - Ensure that the automated test suite maintains (or improves) the overall code coverage.
   - Command: `npm run test-storybook:coverage`

5. **Project Management**
  - When you identify a task, create an issue, and when the task is complete, open a pull-request including a comment in the commit to mark the task as closed, etc.


## The prime directive

If the users approach would work, continue as instrucuted.
If it is misguided, provide feedback on their request

**This section is of critical importance**

We are going to model a pull-request review with Jira Issues and sub-issues.

Follow these instructions and do nothing else:

Given I have been prompted to complete a software engineering related task
When I create a Jira issue to track the request,
And I have created sub-isses in Jira to track the steps involved in the request
Then the sub-issues should contain references to the exact `file(s):line:column` that require creation or modification

Each sub-issue might reference multiple files, for example some tests, and some core modules, etc.
