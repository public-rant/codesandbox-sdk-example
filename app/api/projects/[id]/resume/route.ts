import { getProject, updateProject } from "../../store";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "../../../auth/middleware";
import { getUserById } from "../../../auth/store";
import { getCodeSandboxService } from "../../../services/codesandbox";
import { createSuccessResponse, createErrorResponse, handleApiError, validateEnvironment } from "../../../utils/responses";

/**
 * POST /api/projects/[id]/resume
 * Resume a hibernated sandbox and create a new browser session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return createErrorResponse("Project ID is required", undefined, 400, "MISSING_ID");
    }

    // Validate environment
    validateEnvironment(['CSB_API_KEY']);

    const project = await getProject(id);
    if (!project) {
      return createErrorResponse("Project not found", `No project found with ID: ${id}`, 404, "PROJECT_NOT_FOUND");
    }

    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse("Authentication required", undefined, 401, "UNAUTHORIZED");
    }

    const user = getUserById(authUser.id);
    if (!user || !user.githubToken) {
      return createErrorResponse(
        "GitHub token not found for user",
        "User must have a valid GitHub token to resume sandboxes",
        400,
        "MISSING_GITHUB_TOKEN"
      );
    }

    // Resume the sandbox using the centralized service
    const csbService = getCodeSandboxService();
    const sandbox = await csbService.resumeSandbox(project.sandboxId);

    // Update project with current isUpToDate status
    await updateProject(id, { isUpToDate: sandbox.isUpToDate });

    // Create new browser session
    const sandboxSession = await csbService.createSandboxSession(
      sandbox,
      {
        id: user.username,
        email: user.email,
        username: user.username,
        githubToken: user.githubToken,
      },
      project.hostToken
    );

    return createSuccessResponse(
      {
        sandboxSession,
        isUpToDate: sandbox.isUpToDate,
        projectName: project.name,
        sandboxId: project.sandboxId
      },
      `Successfully resumed sandbox for ${project.name}`
    );
  } catch (error) {
    return handleApiError(error, 'Resume sandbox');
  }
}