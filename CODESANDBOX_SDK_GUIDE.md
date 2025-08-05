# CodeSandbox SDK Integration Guide

This document provides comprehensive information about the CodeSandbox SDK integration in this Next.js application, including the React hooks-based architecture for managing sandbox operations.

## Table of Contents

1. [Overview](#overview)
2. [SDK Installation & Setup](#sdk-installation--setup)
3. [Architecture](#architecture)
4. [Custom React Hooks](#custom-react-hooks)
5. [Server-Side Integration](#server-side-integration)
6. [Client-Side Integration](#client-side-integration)
7. [Usage Examples](#usage-examples)
8. [Environment Configuration](#environment-configuration)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

## Overview

This application integrates with the CodeSandbox SDK to provide seamless sandbox creation and management capabilities. The integration features:

- **Server-side sandbox creation** using the CodeSandbox API
- **Client-side sandbox connection** and real-time interaction
- **React hooks-based architecture** for clean state management
- **Real-time project creation** with streaming progress updates
- **Integrated development environment** with VSCode and live preview

## SDK Installation & Setup

### Package Installation

```bash
npm install @codesandbox/sdk
```

### Package Information

- **Version**: `^2.0.6-rc.1`
- **Components Used**: 
  - Server SDK: `CodeSandbox`, `HostToken`
  - Browser SDK: `connectToSandbox`, `createPreview`

## Architecture

The application provides two architectural approaches for managing CodeSandbox operations:

### Approach 1: Composable Hooks Architecture (Current Implementation)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  Components (UI Layer)                                     │
│  ├── HomePage                                              │
│  ├── ProjectPage                                           │
│  ├── LoginForm                                             │
│  └── CreateProjectModal                                    │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks (Business Logic)                             │
│  ├── useAuth           - Authentication management         │
│  ├── useProjects       - Project CRUD operations          │
│  ├── useProject        - Individual project management     │
│  ├── useProjectCreation - Project creation with streaming  │
│  ├── useCodeSandbox    - Sandbox connection & management   │
│  ├── useSandboxTasks   - Task management (dev server, etc) │
│  ├── useSandboxPreview - Preview iframe management         │
│  └── useSandboxManager - Comprehensive sandbox management  │
├─────────────────────────────────────────────────────────────┤
│  CodeSandbox SDK Integration                               │
│  ├── @codesandbox/sdk/browser (connectToSandbox, etc)      │
│  └── API calls to server endpoints                         │
└─────────────────────────────────────────────────────────────┘
```

### Approach 2: Context-Based Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                Context-Based Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  Components (UI Layer)                                     │
│  ├── HomePage                                              │
│  ├── ProjectPageV2 (Context-aware)                         │
│  ├── LoginForm                                             │
│  └── CreateProjectModal                                    │
├─────────────────────────────────────────────────────────────┤
│  React Context (Shared State)                              │
│  └── SandboxProvider                                       │
│      ├── Sandbox Client Instance                           │
│      ├── Connection State                                  │
│      ├── Setup State                                       │
│      └── Event Management (Port listeners, etc)           │
├─────────────────────────────────────────────────────────────┤
│  Context-Aware Hooks (Business Logic)                      │
│  ├── useSandboxContext - Core sandbox access              │
│  ├── useSandboxTasks.v2 - Task management with context    │
│  ├── useSandboxPreview.v2 - Preview management            │
│  └── Other hooks (useAuth, useProjects, etc)              │
├─────────────────────────────────────────────────────────────┤
│  CodeSandbox SDK Integration                               │
│  ├── @codesandbox/sdk/browser (connectToSandbox, etc)      │
│  └── API calls to server endpoints                         │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Comparison

| Aspect | Composable Hooks | Context-Based |
|--------|------------------|---------------|
| **State Management** | Each hook manages own state | Centralized in context |
| **Event Handling** | Duplicated across hooks | Centralized event management |
| **Performance** | More re-renders | Optimized with context |
| **Testing** | Easy to test individual hooks | Requires provider wrapper |
| **Complexity** | Simple for small apps | Better for large apps |
| **Prop Drilling** | Props passed between hooks | Eliminated |
| **Memory Usage** | Higher (multiple instances) | Lower (shared instances) |

## Custom React Hooks

### 1. `useAuth` - Authentication Management

Manages user authentication state and operations.

```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Usage
const { user, loading, login, logout, error } = useAuth();
```

### 2. `useProjects` - Project Management

Handles project listing and basic operations.

```typescript
interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
}

// Usage
const { projects, loading, fetchProjects, createProject } = useProjects();
```

### 3. `useProjectCreation` - Streaming Project Creation

Manages project creation with real-time progress updates via Server-Sent Events.

```typescript
interface UseProjectCreationReturn {
  isCreating: boolean;
  progress: ProgressStep[];
  error: string | null;
  createProjectWithStream: (name: string) => Promise<string>;
  resetCreation: () => void;
}

// Usage
const { isCreating, progress, createProjectWithStream } = useProjectCreation();
```

### 4. `useCodeSandbox` - Sandbox Connection

Core hook for connecting to and managing CodeSandbox instances.

```typescript
interface UseCodeSandboxReturn {
  sandbox: any;
  sandboxSession: SandboxSession | null;
  loading: boolean;
  error: string | null;
  setupState: SetupState;
  connectToSandboxInstance: (projectId: string, sandboxId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
}

// Usage
const { sandbox, connectToSandboxInstance, setupState } = useCodeSandbox();
```

### 5. `useSandboxTasks` - Task Management

Manages sandbox tasks like development server and VSCode server.

```typescript
interface UseSandboxTasksReturn {
  devServerTask: TaskState;
  vscodeTask: TaskState;
  taskLoading: boolean;
  vscodeTaskLoading: boolean;
  startDevServer: () => Promise<void>;
  restartDevServer: () => Promise<void>;
  stopDevServer: () => Promise<void>;
  startVscode: () => Promise<void>;
  restartVscode: () => Promise<void>;
  stopVscode: () => Promise<void>;
}

// Usage
const { devServerTask, startDevServer, vscodeTask, startVscode } = useSandboxTasks(sandbox, setupFinished);
```

### 6. `useSandboxPreview` - Preview Management

Handles creation and management of preview iframes for development server and VSCode.

```typescript
interface UseSandboxPreviewReturn {
  previewState: PreviewState;
  vscodeState: PreviewState;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  vscodeContainerRef: React.RefObject<HTMLDivElement>;
  createSandboxPreview: () => Promise<void>;
  createVscodePreview: () => Promise<void>;
  destroyPreview: () => void;
  destroyVscodePreview: () => void;
}

// Usage
const { previewState, previewContainerRef, createSandboxPreview } = useSandboxPreview(sandbox);
```

### 7. `useSandboxManager` - Comprehensive Management

High-level hook that combines all sandbox functionality with automatic lifecycle management.

```typescript
// Usage
const {
  sandbox,
  setupState,
  devServerTask,
  vscodeTask,
  previewState,
  vscodeState,
  startDevServer,
  startVscode,
  previewContainerRef,
  vscodeContainerRef,
} = useSandboxManager();
```

## Context-Based Hooks (Recommended Approach)

### 8. `SandboxProvider` - Context Provider

Provides centralized sandbox state management across the component tree.

```typescript
// Setup in layout or page
function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <SandboxProvider>
      {children}
    </SandboxProvider>
  );
}
```

### 9. `useSandboxContext` - Core Sandbox Access

Provides access to the sandbox instance and core functionality through React Context.

```typescript
interface SandboxContextValue {
  sandbox: any;
  sandboxSession: SandboxSession | null;
  loading: boolean;
  error: string | null;
  setupState: SetupState;
  connectToSandboxInstance: (projectId: string, sandboxId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
  onPortOpen: (callback: (portInfo: any) => void) => () => void;
  onPortClose: (callback: (port: number) => void) => () => void;
}

// Usage
const { sandbox, setupState, connectToSandboxInstance } = useSandboxContext();
```

### 10. Context-Based Task Management

Updated hooks that consume the sandbox context for better performance and centralized state.

```typescript
// useSandboxTasks.v2.ts - Context-aware task management
const {
  devServerTask,
  vscodeTask,
  startDevServer,
  startVscode,
} = useSandboxTasks(); // No parameters needed - uses context

// useSandboxPreview.v2.ts - Context-aware preview management
const {
  previewState,
  vscodeState,
  previewContainerRef,
  vscodeContainerRef,
} = useSandboxPreview(); // No parameters needed - uses context
```

## Server-Side Integration

### CodeSandbox Service

The server uses a singleton service pattern for CodeSandbox operations:

```typescript
// app/api/services/codesandbox.ts
export class CodeSandboxService {
  private sdk: CodeSandbox;
  private static instance: CodeSandboxService;

  static getInstance(): CodeSandboxService {
    if (!process.env.CSB_API_KEY) {
      throw new Error('CSB_API_KEY environment variable is required');
    }
    if (!CodeSandboxService.instance) {
      CodeSandboxService.instance = new CodeSandboxService(process.env.CSB_API_KEY);
    }
    return CodeSandboxService.instance;
  }

  async createSandbox(templateId: string = 'sdk-example@latest', privacy: 'public' | 'private' = 'private') {
    return await this.sdk.sandboxes.create({
      id: templateId,
      privacy,
    });
  }

  async resumeSandbox(sandboxId: string) {
    return await this.sdk.sandboxes.resume(sandboxId);
  }

  // ... other methods
}
```

### Key Server Endpoints

1. **POST /api/projects** - Create new project with sandbox
2. **GET /api/projects/create-stream** - Stream project creation progress  
3. **POST /api/projects/[id]/resume** - Resume/connect to sandbox
4. **GET /api/projects/[id]** - Get project details

## Client-Side Integration

### Sandbox Connection Flow

```typescript
// 1. Connect to sandbox using the browser SDK
const connectedSandbox = await connectToSandbox({
  session: initialData.sandboxSession,
  getSession: async (id: string) => {
    const response = await fetch(`/api/projects/${projectId}/resume`, {
      method: 'POST'
    });
    const result = await response.json();
    return result.data.sandboxSession;
  }
});

// 2. Monitor sandbox tasks and ports
const tasks = await sandbox.tasks.getAll();
const devTask = tasks.find((task: any) => task.id === 'dev-server');

// 3. Create previews for active ports
const previewUrl = sandbox.hosts.getUrl(5173);
const preview = createPreview(previewUrl);
```

### Event-Driven Architecture

The client uses event listeners for real-time updates:

```typescript
// Port monitoring
const portOpenListener = sandbox.ports.onDidPortOpen((portInfo: any) => {
  if (portInfo.port === 5173) {
    // Handle dev server port opened
  }
});

const portCloseListener = sandbox.ports.onDidPortClose((port: number) => {
  if (port === 5173) {
    // Handle dev server port closed
  }
});
```

## Usage Examples

### Basic Project Creation

```typescript
function CreateProject() {
  const { createProjectWithStream, isCreating, progress } = useProjectCreation();

  const handleCreate = async (name: string) => {
    try {
      const projectId = await createProjectWithStream(name);
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div>
      {isCreating && (
        <div>
          {progress.map(step => (
            <div key={step.id}>
              {step.status === 'completed' ? '✓' : '⋯'} {step.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Sandbox Management

```typescript
function ProjectDashboard({ projectId }: { projectId: string }) {
  const { project } = useProject(projectId);
  const {
    sandbox,
    setupState,
    devServerTask,
    startDevServer,
    previewState,
    previewContainerRef,
  } = useSandboxManager();

  useEffect(() => {
    if (project?.sandboxId && !sandbox) {
      connectToSandboxInstance(project.id, project.sandboxId);
    }
  }, [project, sandbox]);

  return (
    <div>
      <div>Setup Status: {setupState.status}</div>
      <div>Dev Server: {devServerTask.status}</div>
      
      {!devServerTask.portActive && (
        <button onClick={startDevServer}>Start Dev Server</button>
      )}
      
      <div ref={previewContainerRef} style={{ width: '100%', height: '400px' }}>
        {/* Preview iframe will be automatically inserted here */}
      </div>
    </div>
  );
}
```

## Environment Configuration

### Required Environment Variables

```env
# CodeSandbox API Key - Required for sandbox operations
CSB_API_KEY=your_codesandbox_api_key_here

# GitHub Token - Required for Git operations in sandboxes
GITHUB_TOKEN=your_github_token_here
```

### Getting API Keys

1. **CodeSandbox API Key**:
   - Visit [CodeSandbox API Settings](https://codesandbox.io/t/api)
   - Generate a new API key
   - Set `CSB_API_KEY` environment variable

2. **GitHub Token**:
   - Visit [GitHub Personal Access Tokens](https://github.com/settings/tokens)
   - Generate token with appropriate repository permissions
   - Set `GITHUB_TOKEN` environment variable

## Error Handling

### Server-Side Error Handling

```typescript
export class CodeSandboxService {
  async createSandbox(templateId: string) {
    try {
      return await this.sdk.sandboxes.create({
        id: templateId,
        privacy: 'private',
      });
    } catch (error) {
      throw new Error(`Failed to create sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
```

### Client-Side Error Handling

```typescript
// Hooks handle errors internally and expose them via error state
const { error } = useAuth();
const { error: projectError } = useProjects();
const { error: sandboxError } = useCodeSandbox();

// Components can display errors appropriately
{error && (
  <div className="error-message">
    {error}
  </div>
)}
```

## Best Practices

### 1. Hook Usage Guidelines

- **Single Responsibility**: Each hook handles one specific concern
- **Composition**: Use `useSandboxManager` for complex scenarios that need multiple hooks
- **Error Handling**: Always check error states from hooks
- **Cleanup**: Hooks automatically handle cleanup in `useEffect` return functions

### 2. Performance Optimization

- **Memoization**: Hooks use `useCallback` for stable function references
- **Conditional Effects**: Effects only run when necessary dependencies change
- **Resource Cleanup**: Preview iframes and event listeners are properly cleaned up

### 3. State Management

- **Local State**: Component-specific state stays in components
- **Shared State**: Cross-component state is managed in custom hooks
- **Server State**: API data is managed by data-fetching hooks

### 4. CodeSandbox Best Practices

- **Template Management**: Use versioned templates (`sdk-example@latest`)
- **Resource Cleanup**: Always disconnect from sandboxes when unmounting
- **Port Monitoring**: Use event listeners instead of polling for port status
- **Error Recovery**: Implement retry logic for network failures

### 5. Security Considerations

- **API Key Protection**: Never expose CodeSandbox API keys on the client
- **Session Management**: Use secure session handling for sandbox connections
- **Input Validation**: Validate all user inputs before API calls

## API Reference

### Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create new project with sandbox |
| `/api/projects/create-stream` | GET | Stream project creation progress |
| `/api/projects/[id]` | GET | Get project details |
| `/api/projects/[id]/resume` | POST | Resume/connect to sandbox |

### Hook APIs

Refer to the individual hook sections above for detailed API documentation.

---

This guide provides a comprehensive overview of the CodeSandbox SDK integration. For more specific implementation details, refer to the source code in the `app/hooks/` directory and the API routes in `app/api/`.