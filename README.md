# CodeSandbox Clone

A full-featured CodeSandbox clone built with Next.js and the [@codesandbox/sdk](https://codesandbox.io/docs/sdk). This application provides a complete online code editing experience with automated project creation, sandbox management, and real-time development environments.

## 🖥️ User-Facing Features

### Project Dashboard
- **Project Creation**: Real-time project creation with GitHub integration using `app/components/CreateProjectModal.tsx:160`
- **Project Listing**: Dynamic project grid with sandbox status indicators at `app/page.tsx:108`
- **Authentication**: Session-based login system with GitHub token validation via `app/components/LoginForm.tsx`

### Sandbox Development Environment
- **VS Code Integration**: Browser-based VS Code editor with automatic startup at `app/projects/[id]/page.tsx:154`
- **Live Development Preview**: Real-time preview iframe with automatic reload functionality at `app/projects/[id]/page.tsx:324`
- **Task Management**: Start/stop/restart controls for dev servers and VS Code instances
- **Port Monitoring**: Real-time status monitoring for development ports (5173 for dev server, 8080 for VS Code)
- **Setup Progress**: Visual feedback for sandbox initialization with step-by-step progress

### Real-Time Features
- **Server-Sent Events**: Live project creation updates via streaming API at `app/api/projects/create-stream/route.ts:27`
- **Port Listeners**: Automatic detection of service availability using sandbox port events at `app/hooks/useSandboxManager.ts:88`
- **Auto-Preview**: Automatic preview creation when development server becomes available at `app/hooks/useSandboxManager.ts:129`

### React Hooks Architecture
- **`useSandboxManager`**: Comprehensive hook orchestrating all sandbox operations at `app/hooks/useSandboxManager.ts:37`
- **`useCodeSandbox`**: Core sandbox connection and lifecycle management at `app/hooks/useCodeSandbox.ts`
- **`useSandboxTasks`**: Dev server and VS Code task management at `app/hooks/useSandboxTasks.ts`
- **`useSandboxPreview`**: Preview iframe management with error handling at `app/hooks/useSandboxPreview.ts`
- **`SandboxProvider`**: Context-based state management for performance optimization at `app/contexts/SandboxContext.tsx`

## 🔧 Internal API Features

### CodeSandbox SDK Service Layer
- **Singleton Service**: Centralized SDK wrapper with consistent configuration at `app/api/services/codesandbox.ts:7`
- **Sandbox Lifecycle Management**: 
  - Create sandboxes from templates at `app/api/services/codesandbox.ts:34`
  - Resume hibernated sandboxes at `app/api/services/codesandbox.ts:60`
  - Restart out-of-date sandboxes at `app/api/services/codesandbox.ts:71`
  - Hibernate for resource management at `app/api/services/codesandbox.ts:82`

### Authentication & Session Management
- **Host Token Generation**: Long-lived access tokens (10 years) for sandbox browser sessions at `app/api/services/codesandbox.ts:93`
- **Sandbox Connection**: User authentication with Git provider integration at `app/api/services/codesandbox.ts:105`
- **Session Creation**: Browser session establishment with host token authentication at `app/api/services/codesandbox.ts:129`

### Project Management API
- **`GET /api/projects`**: List all projects with sandbox health status at `app/api/projects/route.ts`
- **`GET /api/projects/create-stream`**: Streaming project creation with 8-step process:
  1. User authentication validation at `app/api/projects/create-stream/route.ts:96`
  2. GitHub repository creation at `app/api/projects/create-stream/route.ts:133`
  3. CodeSandbox sandbox provisioning at `app/api/projects/create-stream/route.ts:154`
  4. Sandbox connection establishment at `app/api/projects/create-stream/route.ts:169`
  5. Git repository initialization at `app/api/projects/create-stream/route.ts:189`
  6. Code push to GitHub at `app/api/projects/create-stream/route.ts:212`
  7. Host token generation at `app/api/projects/create-stream/route.ts:237`
  8. Project persistence at `app/api/projects/create-stream/route.ts:252`

- **`POST /api/projects/[id]/resume`**: Resume hibernated sandbox with session creation at `app/api/projects/[id]/resume/route.ts`

### Monitoring & Health Management
- **Sandbox Monitor Service**: Automated health checking and maintenance at `app/api/sandbox-monitor/service.ts`
- **Automatic Restart**: Out-of-date sandbox detection and restart functionality
- **Resource Optimization**: Automatic hibernation after restart operations
- **Batch Processing**: Efficient handling of multiple sandbox health checks

### Template System
- **Template Management**: Pre-configured project blueprints in `sandbox-template/`
- **Vite + React Setup**: Default template with TypeScript, ESLint, and development server
- **Custom Templates**: Support for multiple project types via `npm run template` deployment

### Error Handling & Responses
- **Standardized API Responses**: Consistent error formatting via `app/api/utils/responses.ts`
- **Environment Validation**: Runtime checks for required API keys and configuration
- **Comprehensive Error Messages**: Detailed error context for debugging and user feedback
- **Graceful Degradation**: Non-blocking failures for optional features

### Data Models
```typescript
// Project with CodeSandbox integration
interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId: string;           // CodeSandbox sandbox ID
  githubRepoUrl?: string;      // GitHub repository URL  
  hostToken: HostToken;        // Long-lived access token
  isUpToDate?: boolean;        // Sandbox health status
}
```

### Key Integration Points
- **`@codesandbox/sdk`**: Core SDK integration for sandbox operations
- **GitHub API**: Repository creation via Octokit at `app/api/projects/create-stream/route.ts:129`
- **Server-Sent Events**: Real-time progress updates using ReadableStream at `app/api/projects/create-stream/route.ts:54`
- **File System Storage**: JSON-based data persistence in `data/` directory
- **Environment Configuration**: CSB_API_KEY and GitHub token validation