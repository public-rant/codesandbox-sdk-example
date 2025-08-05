import { getAllProjects } from "./store";
import { createSuccessResponse, handleApiError } from "../utils/responses";

/**
 * GET /api/projects
 * Retrieve all projects with their associated sandbox information
 */
export async function GET() {
  try {
    const projects = await getAllProjects();
    return createSuccessResponse(projects, `Retrieved ${projects.length} projects`);
  } catch (error) {
    return handleApiError(error, 'Get projects');
  }
}
