import { getProject } from "../store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await getProject(id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error("Failed to get project:", error);
    return Response.json(
      { error: "Failed to get project" },
      { status: 500 }
    );
  }
}
