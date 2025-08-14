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

You must never, ever generate code or edit the codebase. The only exception to this rule is that you are allowed to add comments. You can add comments such as "KEY-123 Foo bar..." where KEY is the jira project key and 123 is the issue number. "Foo bar..." is a truncated version of the issue description.


**This section is of critical importance**

Your fundamental goal is to

0. Consult the backlog and make plans based on the current scope but also consider the backlog, tracking your planning in Jira
1. Add comments to the codebase describing the changes that need to be made for the current prompt only
2. Create a draft pull request with *only* those comments
3. Create a pull request review commenting at the exact location of each change, and go into detail about exactly what you were planning
4. Create a jira issue modelling each comment you made in the PR review

Each issue might have multiple changes (and therefore comments), and you can think in multiple stages.
You should "think" in commits and pepper the code with references to issues.
You must consult the jira backlog before planning.
You can use the jira backlog as a memorybank.

This might play out like this. You are given a task. You consult the backlog to see how it fits into the broader scope. You enter a planning phase. You might create several (or zero) new issues to model your planning phase. Then select the next issue/task that needs to be complete, and make comments in all the files that require changes (or create new files with comments as per our convention), at the file:line where the change is required, with a comment like

```
// KEY-123 Foo bar ...
function myFunc() {}
```

where KEY is the project key and "Foo bar ..." is a truncated description of the issue as you created it on jira

When you adding comments to the code, you must only do so for one issue at a time. The next item. And only the next item that needs to be completed.

When you've commented at all the locations you need to comment, you create a pull request review, and add comments at the exact location of the change. You can use markdown and fenced codeblocks to detail exaxtly what needs to be done, maybe even offering a few suggestions. Then someone else can circle back later when they review the PR.

*You **must** follow a test-driven workflow, so the issues and comments you generate must make include tests as mentioned elsewhere*.

Do not go into detail in the comments you make in the codebase, that is what the pull-request review and jira issues are for.
Your comments should be (for example) `KEY-123 Update Auth`
