import { getAllProjects } from "./store";

export async function GET() {
  return Response.json(await getAllProjects());
}
