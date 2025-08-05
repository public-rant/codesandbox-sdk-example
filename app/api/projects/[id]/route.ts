import { getProject } from "../store";
import { createSuccessResponse, createErrorResponse, handleApiError } from "../../utils/responses";

/**
 * GET /api/projects/[id]
 * Retrieve a specific project by ID with sandbox information
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return createErrorResponse("Project ID is required", undefined, 400, "MISSING_ID");
    }

    const project = await getProject(id);

    if (!project) {
      return createErrorResponse("Project not found", `No project found with ID: ${id}`, 404, "PROJECT_NOT_FOUND");
    }

    return createSuccessResponse(project, `Retrieved project ${project.name}`);
  } catch (error) {
    return handleApiError(error, 'Get project');
  }
}
