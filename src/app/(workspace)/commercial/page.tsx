import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectCommercialItems } from "@/server/services/commercial.service";
import { CommercialView } from "@/features/commercial/commercial-view";

export const metadata: Metadata = { title: "Commercial" };

export default async function CommercialPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const items = activeProject ? await listProjectCommercialItems(activeProject.id) : [];

  return <CommercialView activeProject={activeProject} items={items} />;
}
