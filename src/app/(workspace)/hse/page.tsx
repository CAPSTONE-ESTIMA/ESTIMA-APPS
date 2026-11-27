import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectHseRecords } from "@/server/services/hse.service";
import { HseView } from "@/features/hse/hse-view";

export const metadata: Metadata = { title: "HSE" };

export default async function HsePage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const records = activeProject ? await listProjectHseRecords(activeProject.id) : [];

  return (
    <HseView
      activeProject={activeProject}
      records={records}
      currentUserName={session.user.name}
    />
  );
}
