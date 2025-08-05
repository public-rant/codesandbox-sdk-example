# CodeSandbox SDK Example App

This is a complete example application demonstrating how to use the [@codesandbox/sdk](https://www.npmjs.com/package/@codesandbox/sdk) to create and manage CodeSandbox instances programmatically. The app showcases both server-side and client-side usage of the SDK to build a project management platform with integrated sandboxes.

## Running the Example

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create a `.env.local` file with your CodeSandbox API key, GitHub access token and your GitHub username:

```bash
export CSB_API_KEY=csb_v1_...
GITHUB_TOKEN=ghp_...
GITHUB_USERNAME=my-username
```

Now `source` the file, which also exports the CSB_API_KEY to the terminal:

```bash
source .env.local
```

### 3. Deploy the Template

**This step is crucial** - you must deploy the sandbox template before running the example:

```bash
npm run template
```

This command (defined in [`package.json:10`](package.json#L10)) builds and uploads the template to CodeSandbox as `sdk-example@latest`.

### 4. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating projects.

## How the CodeSandbox SDK is Used

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

Each template becomes available as `template-name@latest` and can be used in your SDK calls. This allows you to offer different starting points for different types of projects.

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
}
```

## Features Demonstrated

1. **Template-based Sandbox Creation**: Using pre-built templates for consistent project scaffolding
2. **Git Integration**: Automatic repository creation and code pushing
3. **Real-time Development**: Live preview with hot reloading
4. **Task Management**: Starting, stopping, and monitoring development servers
5. **Port Monitoring**: Automatic preview updates based on port status
6. **Session Management**: Resuming existing sandboxes with authentication
7. **Host Tokens**: Secure browser-to-sandbox communication

## Architecture

- **Next.js 15** with App Router for the main application
- **Server-Side Rendering** for project management
- **Real-time Streaming** for project creation progress
- **Browser SDK** for live sandbox interaction
- **TypeScript** throughout for type safety

## Template Structure

The [`sandbox-template/`](sandbox-template/) directory contains a standard Vite + React application:

- **Vite Configuration**: [`sandbox-template/app/vite.config.ts`](sandbox-template/app/vite.config.ts)
- **React + TypeScript**: Modern development setup
- **ESLint Configuration**: Code quality tools
- **Development Server**: Runs on port 5173

## API Endpoints

- `GET /api/projects` - List all projects
- `GET /api/projects/create-stream` - Create project with real-time progress
- `POST /api/projects/[id]/resume` - Resume sandbox session
- `GET /api/projects/[id]` - Get project details

This example provides a complete foundation for building applications that integrate with CodeSandbox for cloud-based development environments.
