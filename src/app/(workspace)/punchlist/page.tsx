import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectPunchItems } from "@/server/services/punchlist.service";
import { PunchlistView } from "@/features/punchlist/punchlist-view";

export const metadata: Metadata = {
  title: "Punch List",
};

export default async function PunchlistPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const items = activeProject ? await listProjectPunchItems(activeProject.id) : [];

  return <PunchlistView activeProject={activeProject} items={items} />;
}
