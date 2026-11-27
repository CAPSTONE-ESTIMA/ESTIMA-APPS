import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { ProjectsView } from "@/features/project/projects-view";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);

  return <ProjectsView projects={projects} activeProjectId={activeProjectId} />;
}
