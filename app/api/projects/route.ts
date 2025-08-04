import { addProject, getAllProjects } from "./store";
import { CodeSandbox } from "@codesandbox/sdk";
import { Octokit } from "@octokit/rest";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../auth/middleware";
import { getUserById } from "../auth/store";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = getUserById(authUser.id);
    if (!user || !user.githubToken) {
      return Response.json(
        { error: "GitHub token not found for user" },
        { status: 400 }
      );
    }

    if (!process.env.CSB_API_KEY) {
      return Response.json(
        { error: "CodeSandbox API key is required" },
        { status: 500 }
      );
    }

    // Step 1: Create GitHub repository first
    const octokit = new Octokit({
      auth: user.githubToken,
    });

    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: name,
      private: false,
      auto_init: false, // Don't auto-init so we can push from sandbox
      description: `Project repository for ${name}`,
    });

    // Step 2: Create CodeSandbox sandbox
    const sdk = new CodeSandbox(process.env.CSB_API_KEY);
    const sandbox = await sdk.sandboxes.create({
      id: "sandbox-template@latest",
    });

    // Step 3: Connect to sandbox and configure git
    const client = await sandbox.connect({
      id: user.username,
      git: {
        email: user.email,
        username: user.username,
        provider: "github.com",
        accessToken: user.githubToken,
      },
    });

    // Step 4: Initialize git repo in app folder and connect to GitHub
    await client.commands.run([
      "cd app && git init",
      `cd app && git remote add origin https://github.com/${user.username}/${name}.git`,
      "cd app && git add .",
      `cd app && git commit -m "Initial commit"`,
      "cd app && git branch -M main",
      "cd app && git push -u origin main",
    ]);

    // Step 5: Generate host token
    const hostToken = await sdk.hosts.createToken(sandbox.id, {
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years expiration
    });

    const project = await addProject(name, sandbox.id, hostToken, repo.data.html_url);
    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Project creation failed:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    return Response.json(
      { error: "Failed to create project, sandbox, and repository" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(await getAllProjects());
}
