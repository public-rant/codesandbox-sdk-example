import { getProject, updateProject } from "../../store";
import { CodeSandbox } from "@codesandbox/sdk";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../../../auth/middleware";
import { getUserById } from "../../../auth/store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await getProject(id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
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

    // Resume the sandbox
    const sdk = new CodeSandbox(process.env.CSB_API_KEY);
    const sandbox = await sdk.sandboxes.resume(project.sandboxId);

    // Update project with current isUpToDate status
    await updateProject(id, { isUpToDate: sandbox.isUpToDate });

    // Create new browser session
    const sandboxSession = await sandbox.createSession({
      id: user.username,
      git: {
        email: user.email,
        username: user.username,
        provider: "github.com",
        accessToken: user.githubToken,
      },
      hostToken: project.hostToken,
    });

    return Response.json({
      sandboxSession,
      isUpToDate: sandbox.isUpToDate,
    });
  } catch (error) {
    console.error("Failed to resume sandbox:", error);
    return Response.json(
      { error: "Failed to resume sandbox" },
      { status: 500 }
    );
  }
}