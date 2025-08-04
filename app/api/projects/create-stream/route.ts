import { addProject } from "../store";
import { CodeSandbox } from "@codesandbox/sdk";
import { Octokit } from "@octokit/rest";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../../auth/middleware";
import { getUserById } from "../../auth/store";

interface ProgressStep {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

function createProgressMessage(type: 'progress' | 'success' | 'error', data: any): string {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name || typeof name !== "string") {
    return new Response(createProgressMessage('error', { message: 'Name is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: ProgressStep) => {
        controller.enqueue(encoder.encode(createProgressMessage('progress', { step })));
      };

      const sendSuccess = (projectId: string) => {
        controller.enqueue(encoder.encode(createProgressMessage('success', { projectId })));
        controller.close();
      };

      const sendError = (message: string) => {
        controller.enqueue(encoder.encode(createProgressMessage('error', { message })));
        controller.close();
      };

      try {
        // Step 1: Authentication
        sendProgress({
          id: 'auth',
          message: 'Authenticating user...',
          status: 'in_progress'
        });

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
          sendError('Authentication required');
          return;
        }

        const user = getUserById(authUser.id);
        if (!user || !user.githubToken) {
          sendError('GitHub token not found for user');
          return;
        }

        if (!process.env.CSB_API_KEY) {
          sendError('CodeSandbox API key is required');
          return;
        }

        sendProgress({
          id: 'auth',
          message: 'User authenticated successfully',
          status: 'completed'
        });

        // Step 2: Create GitHub repository
        sendProgress({
          id: 'github-repo',
          message: 'Creating GitHub repository...',
          status: 'in_progress'
        });

        const octokit = new Octokit({
          auth: user.githubToken,
        });

        const repo = await octokit.rest.repos.createForAuthenticatedUser({
          name: name,
          private: false,
          auto_init: false,
          description: `Project repository for ${name}`,
        });

        sendProgress({
          id: 'github-repo',
          message: `GitHub repository created: ${repo.data.html_url}`,
          status: 'completed'
        });

        // Step 3: Create CodeSandbox sandbox
        sendProgress({
          id: 'sandbox-create',
          message: 'Creating CodeSandbox sandbox...',
          status: 'in_progress'
        });

        const sdk = new CodeSandbox(process.env.CSB_API_KEY);
        const sandbox = await sdk.sandboxes.create({
          id: "sandbox-template@latest",
        });

        sendProgress({
          id: 'sandbox-create',
          message: `Sandbox created: ${sandbox.id}`,
          status: 'completed'
        });

        // Step 4: Connect to sandbox
        sendProgress({
          id: 'sandbox-connect',
          message: 'Connecting to sandbox...',
          status: 'in_progress'
        });

        const client = await sandbox.connect({
          id: user.username,
          git: {
            email: user.email,
            username: user.username,
            provider: "github.com",
            accessToken: user.githubToken,
          },
        });

        sendProgress({
          id: 'sandbox-connect',
          message: 'Connected to sandbox successfully',
          status: 'completed'
        });

        // Step 5: Setting up Git repository
        sendProgress({
          id: 'git-setup',
          message: 'Initializing Git repository...',
          status: 'in_progress'
        });

        await client.commands.run([
          "cd app && git init",
          `cd app && git remote add origin https://github.com/${user.username}/${name}.git`,
        ]);

        sendProgress({
          id: 'git-setup',
          message: 'Git repository initialized',
          status: 'completed'
        });

        // Step 6: Committing and pushing code
        sendProgress({
          id: 'git-push',
          message: 'Committing and pushing initial code...',
          status: 'in_progress'
        });

        await client.commands.run([
          "cd app && git add .",
          `cd app && git commit -m "Initial commit"`,
          "cd app && git branch -M main",
          "cd app && git push -u origin main",
        ]);

        sendProgress({
          id: 'git-push',
          message: 'Code pushed to GitHub successfully',
          status: 'completed'
        });

        // Step 7: Generate host token
        sendProgress({
          id: 'host-token',
          message: 'Generating host token...',
          status: 'in_progress'
        });

        const hostToken = await sdk.hosts.createToken(sandbox.id, {
          expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years expiration
        });

        sendProgress({
          id: 'host-token',
          message: 'Host token generated',
          status: 'completed'
        });

        // Step 8: Save project
        sendProgress({
          id: 'save-project',
          message: 'Saving project...',
          status: 'in_progress'
        });

        const project = await addProject(name, sandbox.id, hostToken, repo.data.html_url);

        sendProgress({
          id: 'save-project',
          message: 'Project saved successfully',
          status: 'completed'
        });

        // Success!
        sendSuccess(project.id);

      } catch (error) {
        console.error("Project creation failed:", error);
        let errorMessage = "Failed to create project";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        sendError(errorMessage);
      }
    }
  });

  return new Response(stream, { headers });
}