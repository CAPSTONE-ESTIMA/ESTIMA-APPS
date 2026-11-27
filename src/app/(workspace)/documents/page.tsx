import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectDocuments } from "@/server/services/document.service";
import { DocumentsView } from "@/features/documents/documents-view";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const documents = activeProject ? await listProjectDocuments(activeProject.id) : [];

  return (
    <DocumentsView
      activeProject={activeProject}
      documents={documents}
      currentUserName={session.user.name}
    />
  );
}
