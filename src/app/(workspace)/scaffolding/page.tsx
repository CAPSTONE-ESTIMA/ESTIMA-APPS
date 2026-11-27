import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectScaffolds } from "@/server/services/scaffolding.service";
import { ScaffoldingView } from "@/features/scaffolding/scaffolding-view";

export const metadata: Metadata = {
  title: "Scaffolding",
};

export default async function ScaffoldingPage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const scaffolds = activeProject ? await listProjectScaffolds(activeProject.id) : [];

  return (
    <ScaffoldingView
      activeProject={activeProject}
      scaffolds={scaffolds}
      currentUserName={session.user.name}
    />
  );
}
