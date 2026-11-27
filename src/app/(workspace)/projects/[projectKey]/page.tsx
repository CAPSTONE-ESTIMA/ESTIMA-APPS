import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/server/auth/session";
import {
  getActiveProjectId,
  getProjectDetailByKey,
  listMyProjects,
} from "@/server/services/project.service";
import { listProjectAuditHistory } from "@/server/services/audit.service";
import { ProjectDetailView } from "@/features/project/project-detail-view";

export const metadata: Metadata = {
  title: "Project Detail",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectKey: string }>;
}) {
  await requirePageSession();
  const { projectKey } = await params;

  const project = await getProjectDetailByKey(projectKey);
  if (!project) notFound();

  const [myProjects, auditHistory] = await Promise.all([
    listMyProjects(),
    listProjectAuditHistory(project.id, 12),
  ]);
  const activeProjectId = await getActiveProjectId(myProjects);

  return (
    <ProjectDetailView
      project={project}
      isActiveWorkspace={project.id === activeProjectId}
      auditHistory={auditHistory}
    />
  );
}
