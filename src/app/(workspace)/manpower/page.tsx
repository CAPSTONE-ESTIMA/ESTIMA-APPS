import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectManpower } from "@/server/services/manpower.service";
import { ManpowerView } from "@/features/manpower/manpower-view";

export const metadata: Metadata = {
  title: "Manpower",
};

export default async function ManpowerPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const records = activeProject ? await listProjectManpower(activeProject.id) : [];

  return <ManpowerView activeProject={activeProject} records={records} />;
}
