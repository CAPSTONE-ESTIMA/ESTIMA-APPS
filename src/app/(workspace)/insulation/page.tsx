import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectInsulationWorks } from "@/server/services/insulation.service";
import { InsulationView } from "@/features/insulation/insulation-view";

export const metadata: Metadata = {
  title: "Insulation",
};

export default async function InsulationPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const items = activeProject ? await listProjectInsulationWorks(activeProject.id) : [];

  return <InsulationView activeProject={activeProject} items={items} />;
}
