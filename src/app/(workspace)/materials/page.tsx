import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectMaterials } from "@/server/services/material.service";
import { MaterialsView } from "@/features/materials/materials-view";

export const metadata: Metadata = {
  title: "Materials",
};

export default async function MaterialsPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const items = activeProject ? await listProjectMaterials(activeProject.id) : [];

  return <MaterialsView activeProject={activeProject} items={items} />;
}
