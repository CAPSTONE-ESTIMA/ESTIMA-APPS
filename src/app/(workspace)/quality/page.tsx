import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectQaInspections } from "@/server/services/quality.service";
import { QualityView } from "@/features/quality/quality-view";

export const metadata: Metadata = {
  title: "QA/QC",
};

export default async function QualityPage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const records = activeProject ? await listProjectQaInspections(activeProject.id) : [];

  return (
    <QualityView
      activeProject={activeProject}
      records={records}
      currentUserName={session.user.name}
    />
  );
}
