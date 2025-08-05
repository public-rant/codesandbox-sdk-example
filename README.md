# CodeSandbox SDK Integration Example

This is a comprehensive example of integrating the [CodeSandbox SDK](https://codesandbox.io/docs/sdk) into a Next.js application using **modern React hooks architecture**. The project demonstrates automatic sandbox creation, project management, and real-time development environment provisioning.

## 🚀 What Makes This Special

- **🎣 React Hooks Architecture**: Clean, reusable hooks for all CodeSandbox operations
- **⚛️ Context-Based State Management**: Advanced pattern for sharing sandbox instances
- **📡 Real-time Updates**: Server-Sent Events for live project creation progress
- **🔗 Full SDK Integration**: Complete implementation of CodeSandbox SDK features
- **📚 Comprehensive Documentation**: Detailed guides for both architectural approaches

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [API Documentation](#api-documentation)
- [CodeSandbox SDK Integration](#codesandbox-sdk-integration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)

## ✨ Features

### Core Functionality
- **Automated Project Creation**: Creates GitHub repositories and CodeSandbox sandboxes in one flow
- **Real-time Progress Updates**: Server-Sent Events for project creation status
- **Sandbox Management**: Resume, restart, and monitor sandbox health
- **User Authentication**: Simple session-based authentication with GitHub integration
- **Automated Monitoring**: Background service to maintain sandbox health

### CodeSandbox SDK Features
- **Sandbox Creation**: Automatic sandbox provisioning from templates
- **Git Integration**: Seamless GitHub repository connection
- **Host Tokens**: Long-lived access tokens for sandbox sessions
- **Resource Management**: Automated hibernation and restart capabilities
- **Real-time Development**: Browser-based development environments

### React Architecture Features
- **🎣 Custom Hooks**: Encapsulated business logic for authentication, projects, and sandbox management
- **⚛️ Context Provider**: Centralized sandbox state management with `SandboxProvider`
- **🔄 Two Approaches**: Choose between composable hooks or context-based architecture
- **🎯 TypeScript Support**: Full type safety across all hooks and components
- **⚡ Performance Optimized**: Efficient event handling and state updates

## 🏗️ Architecture

This project demonstrates **two architectural approaches** for integrating the CodeSandbox SDK with React:

### Client Architecture: React Hooks-Based Design

```
┌─────────────────────────────────────────────────────────────┐
│                 Client-Side Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  🖥️ React Components (UI Layer)                            │
│  ├── HomePage - Project dashboard                          │
│  ├── ProjectPage - Sandbox management interface            │
│  ├── LoginForm - Authentication                           │
│  └── CreateProjectModal - Project creation                 │
├─────────────────────────────────────────────────────────────┤
│  🎣 Custom React Hooks (Business Logic)                    │
│  ├── useAuth - Authentication state management             │
│  ├── useProjects - Project CRUD operations                │
│  ├── useProjectCreation - Streaming project creation      │
│  ├── useCodeSandbox - Sandbox connection & lifecycle      │
│  ├── useSandboxTasks - Dev server & VSCode management     │
│  ├── useSandboxPreview - Preview iframe management        │
│  └── useSandboxManager - Comprehensive orchestration      │
├─────────────────────────────────────────────────────────────┤
│  ⚛️ React Context (Recommended)                            │
│  └── SandboxProvider - Centralized sandbox state          │
│      ├── Sandbox Client Instance Sharing                  │
│      ├── Event Management (Port listeners)                │
│      └── Performance Optimization                         │
├─────────────────────────────────────────────────────────────┤
│  📡 CodeSandbox SDK Integration                            │
│  ├── @codesandbox/sdk/browser - Client-side operations    │
│  └── Server API calls - Sandbox creation & management     │
└─────────────────────────────────────────────────────────────┘
```

### Server API Structure
```
/api/
├── projects/                    # Project management
│   ├── route.ts                # List all projects
│   ├── create-stream/          # Create projects with SSE
│   └── [id]/
│       ├── route.ts            # Get project details
│       └── resume/             # Resume sandbox sessions
├── sandbox-monitor/            # Background monitoring service
├── auth/                       # Authentication system
└── services/                   # Centralized services
    └── codesandbox.ts          # CodeSandbox SDK wrapper
```

### Hook-Based Architecture Benefits

- **🔄 Reusable Logic**: Business logic encapsulated in custom hooks
- **🧪 Easy Testing**: Hooks can be tested independently
- **📦 Separation of Concerns**: UI separated from business logic  
- **⚡ Performance**: Context-based approach eliminates prop drilling
- **🎯 Type Safety**: Full TypeScript support throughout
- **🔧 Maintainable**: Clear separation between client and server logic

### Services Layer
- **CodeSandboxService**: Centralized SDK operations with error handling
- **Custom React Hooks**: Client-side state management and SDK integration
- **API Response Utils**: Standardized error handling and response formatting
- **Authentication Middleware**: Session-based auth with GitHub token support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- CodeSandbox account
- GitHub account with personal access token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codesandbox-sdk-example
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Setup](#environment-setup))

4. **Deploy the template**
   ```bash
   npm run template
   ```
   **This step is crucial** - you must deploy the sandbox template before running the example.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
# CodeSandbox Configuration
CSB_API_KEY=your_codesandbox_api_key_here

# GitHub Integration
GITHUB_USERNAME=your_github_username
GITHUB_TOKEN=your_github_personal_access_token

# Application Settings (optional)
NODE_ENV=development
```

### Getting API Keys

#### CodeSandbox API Key
1. Sign up at [CodeSandbox](https://codesandbox.io)
2. Go to [API Settings](https://codesandbox.io/t/api)
3. Generate a new API key
4. Copy the key to your `.env.local` file

#### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with these scopes:
   - `repo` (full repository access)
   - `user:email` (access to user email)
3. Copy the token to your `.env.local` file

## 📚 API Documentation

### Project Management

#### `GET /api/projects`
List all projects with sandbox information.

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "My Project",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sandboxId": "abc123",
      "githubRepoUrl": "https://github.com/user/repo",
      "isUpToDate": true
    }
  ],
  "message": "Retrieved 1 projects"
}
```

#### `GET /api/projects/create-stream?name=ProjectName`
Create a new project with real-time progress updates via Server-Sent Events.

**Progress Steps:**
1. **auth** - User authentication and validation
2. **github-repo** - GitHub repository creation
3. **sandbox-create** - CodeSandbox sandbox creation
4. **sandbox-connect** - Connect to sandbox
5. **git-setup** - Initialize Git repository
6. **git-push** - Push initial code to GitHub
7. **host-token** - Generate long-lived access token
8. **save-project** - Save project to database

**Event Types:**
- `progress` - Step updates with status
- `success` - Project creation completed
- `error` - Creation failed

#### `GET /api/projects/[id]`
Get detailed project information by ID.

#### `POST /api/projects/[id]/resume`
Resume a hibernated sandbox and create a new browser session.

**Response:**
```json
{
  "data": {
    "sandboxSession": { /* session details */ },
    "isUpToDate": true,
    "projectName": "My Project",
    "sandboxId": "abc123"
  },
  "message": "Successfully resumed sandbox for My Project"
}
```

### Sandbox Monitoring

#### `GET /api/sandbox-monitor`
Get the current status of the monitoring service.

#### `POST /api/sandbox-monitor`
Control the monitoring service.

**Body:**
```json
{
  "action": "start" | "stop" | "check"
}
```

## 🎣 React Hooks Architecture

This project showcases a modern React hooks-based architecture for managing CodeSandbox SDK operations. The implementation provides two approaches:

### Approach 1: Composable Hooks (Current)
Individual hooks that can be composed together for flexible usage:

```typescript
// Individual hook usage
const { user, login, logout } = useAuth();
const { projects, fetchProjects } = useProjects();
const { sandbox, connectToSandboxInstance } = useCodeSandbox();
const { devServerTask, startDevServer } = useSandboxTasks(sandbox, setupFinished);

// Comprehensive hook for complex scenarios
const {
  sandbox, setupState, devServerTask, vscodeTask,
  startDevServer, startVscode, previewContainerRef
} = useSandboxManager();
```

### Approach 2: Context-Based (Recommended)
Centralized state management through React Context for better performance:

```typescript
// Wrap your app with the provider
<SandboxProvider>
  <ProjectPage />
</SandboxProvider>

// Use context-aware hooks (no parameters needed)
const { sandbox, setupState } = useSandboxContext();
const { devServerTask, startDevServer } = useSandboxTasks(); // Uses context
const { previewState, previewContainerRef } = useSandboxPreview(); // Uses context
```

### Key Hooks Overview

| Hook | Responsibility | Context-Aware |
|------|----------------|---------------|
| `useAuth` | Authentication state & operations | ❌ |
| `useProjects` | Project listing & management | ❌ |
| `useProjectCreation` | Streaming project creation | ❌ |
| `useSandboxContext` | Core sandbox instance access | ✅ |
| `useSandboxTasks.v2` | Dev server & VSCode management | ✅ |
| `useSandboxPreview.v2` | Preview iframe management | ✅ |

### Benefits of This Architecture

- **🔄 Reusability**: Hooks can be used across multiple components
- **🧪 Testability**: Business logic is separated and easily testable
- **⚡ Performance**: Context eliminates unnecessary re-renders
- **🎯 Type Safety**: Full TypeScript support with proper interfaces
- **🔧 Maintainability**: Clear separation of concerns

For detailed documentation, see [CODESANDBOX_SDK_GUIDE.md](CODESANDBOX_SDK_GUIDE.md).

## 🔗 CodeSandbox SDK Integration

### Core Service (`app/api/services/codesandbox.ts`)

The `CodeSandboxService` provides a centralized wrapper around the CodeSandbox SDK with these key features:

#### **Singleton Pattern**
```typescript
const csbService = getCodeSandboxService();
```
Ensures consistent configuration and avoids multiple SDK instances.

#### **Key Methods**

##### Sandbox Management
```typescript
// Create sandbox from template
const sandbox = await csbService.createSandbox("template@latest", "private");

// Get sandbox information
const sandbox = await csbService.getSandbox(sandboxId);

// Resume hibernated sandbox
const sandbox = await csbService.resumeSandbox(sandboxId);

// Restart out-of-date sandbox
await csbService.restartSandbox(sandboxId);

// Hibernate to save resources
await csbService.hibernateSandbox(sandboxId);
```

##### Authentication & Sessions
```typescript
// Create host token (long-lived)
const hostToken = await csbService.createHostToken(sandboxId, 10); // 10 years

// Connect to sandbox for development
const client = await csbService.connectToSandbox(sandbox, userConfig);

// Create browser session
const session = await csbService.createSandboxSession(sandbox, userConfig, hostToken);
```

#### **Error Handling**
All methods include comprehensive error handling with descriptive error messages:

```typescript
throw new Error(`Failed to create sandbox: ${error.message}`);
```

### Integration Patterns

#### **Environment Validation**
```typescript
import { validateEnvironment } from "../utils/responses";

validateEnvironment(['CSB_API_KEY']);
```

#### **Standardized Responses**
```typescript
import { createSuccessResponse, handleApiError } from "../utils/responses";

try {
  const result = await csbService.createSandbox();
  return createSuccessResponse(result, "Sandbox created successfully");
} catch (error) {
  return handleApiError(error, 'Create sandbox');
}
```

### Monitoring Service

The `SandboxMonitorService` automatically maintains sandbox health:

- **Automatic Checks**: Runs every 5 minutes
- **Batch Processing**: Handles multiple sandboxes efficiently
- **Resource Management**: Hibernates sandboxes after restart
- **Error Recovery**: Continues processing despite individual failures

### Understanding Templates: Your Starting Point

**Templates are the foundation** of any CodeSandbox SDK integration. Before diving into the SDK usage, it's crucial to understand that templates define what your end users will get when they create a new project.

#### What is a Template?

A template is a pre-configured project structure that serves as the blueprint for new sandboxes. In this example, the [`sandbox-template/`](sandbox-template/) directory contains a Vite + React application that includes:

- **Development Setup**: Vite configuration, TypeScript, ESLint
- **Project Structure**: Organized file structure with components, assets, and configuration
- **Dependencies**: Pre-installed packages your users will need
- **Development Server**: Configured to run on port 5173 for live previews

#### Creating Templates for Different Use Cases

You can create multiple templates for different scenarios:

```bash
# React + TypeScript template
csb build ./templates/react-ts --alias react-starter@latest

# Vue + Vite template
csb build ./templates/vue-app --alias vue-starter@latest

# Node.js API template
csb build ./templates/node-api --alias api-starter@latest
```

Each template becomes available as `template-name@latest` and can be used in your SDK calls.

## 📁 Project Structure

```
.
├── app/
│   ├── api/                     # API routes
│   │   ├── services/           # Centralized services
│   │   │   └── codesandbox.ts  # CodeSandbox SDK wrapper
│   │   ├── utils/              # Shared utilities
│   │   │   └── responses.ts    # Standardized API responses
│   │   ├── projects/           # Project management endpoints
│   │   ├── sandbox-monitor/    # Monitoring service endpoints
│   │   └── auth/               # Authentication system
│   ├── hooks/                  # 🎣 Custom React Hooks
│   │   ├── useAuth.ts          # Authentication management
│   │   ├── useProjects.ts      # Project operations
│   │   ├── useProject.ts       # Single project management
│   │   ├── useProjectCreation.ts # Streaming project creation
│   │   ├── useCodeSandbox.ts   # Core sandbox connection
│   │   ├── useSandboxTasks.ts  # Task management (dev/VSCode)
│   │   ├── useSandboxPreview.ts # Preview iframe management
│   │   ├── useSandboxManager.ts # Comprehensive orchestration
│   │   ├── useSandboxTasks.v2.ts # Context-aware tasks
│   │   └── useSandboxPreview.v2.ts # Context-aware previews
│   ├── contexts/               # ⚛️ React Context Providers
│   │   └── SandboxContext.tsx  # Centralized sandbox state
│   ├── components/             # React components
│   │   ├── CreateProjectModal.tsx # Project creation UI
│   │   └── LoginForm.tsx       # Authentication UI
│   ├── projects/[id]/          # Dynamic project pages
│   │   ├── layout.tsx          # SandboxProvider wrapper
│   │   ├── page.tsx            # Composable hooks version
│   │   └── page.v2.tsx         # Context-based version
│   └── page.tsx                # Homepage with hooks
├── data/                       # JSON file storage
├── sandbox-template/           # Template for new sandboxes
├── CODESANDBOX_SDK_GUIDE.md    # 📚 Comprehensive SDK documentation
└── CLAUDE.md                   # AI assistant instructions
```

### Key Files

#### Server-Side
- **`app/api/services/codesandbox.ts`** - Centralized CodeSandbox SDK service
- **`app/api/utils/responses.ts`** - Standardized error handling and responses
- **`app/api/projects/create-stream/route.ts`** - Complex project creation flow
- **`app/api/sandbox-monitor/service.ts`** - Background monitoring service

#### Client-Side (React Hooks Architecture)
- **`app/hooks/useAuth.ts`** - Authentication state management
- **`app/hooks/useSandboxManager.ts`** - Comprehensive sandbox orchestration
- **`app/contexts/SandboxContext.tsx`** - Centralized sandbox state provider
- **`app/projects/[id]/page.tsx`** - Composable hooks implementation
- **`app/projects/[id]/page.v2.tsx`** - Context-based implementation

#### Documentation & Templates
- **`CODESANDBOX_SDK_GUIDE.md`** - Comprehensive hooks & SDK documentation
- **`sandbox-template/`** - Vite + React template for new projects

### Data Models

#### Project Structure ([`app/api/projects/store.ts`](app/api/projects/store.ts))

Projects are stored with CodeSandbox integration:

```typescript
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId: string; // CodeSandbox sandbox ID
  githubRepoUrl?: string; // Associated GitHub repository
  hostToken: HostToken; // CodeSandbox host token for browser access
  isUpToDate?: boolean; // Sandbox health status
}
```

## 🔧 Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Build and deploy sandbox template
npm run template
```

### Template Management

The `sandbox-template/` directory contains the default template used for new sandboxes. To update the template:

1. Modify files in `sandbox-template/`
2. Run `npm run template` to deploy changes
3. New projects will use the updated template

### Authentication Flow

1. User logs in with username/password
2. System validates GitHub token from environment
3. Session created with 24-hour expiration
4. All API calls include session cookie validation

### Error Handling Philosophy

- **Consistent Format**: All errors follow the same JSON structure
- **Descriptive Messages**: Clear error descriptions with context
- **Proper HTTP Status Codes**: 400 for client errors, 500 for server errors
- **Error Codes**: Machine-readable error identification

## 🚀 Deployment

### Environment Variables for Production

```env
CSB_API_KEY=production_codesandbox_api_key
GITHUB_USERNAME=production_github_username
GITHUB_TOKEN=production_github_token
NODE_ENV=production
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Self-Hosted Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📖 Additional Resources

- [CodeSandbox SDK Documentation](https://codesandbox.io/docs/sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [Server-Sent Events Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.