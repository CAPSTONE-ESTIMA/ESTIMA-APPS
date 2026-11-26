import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { getAdminOverview } from "@/server/services/admin.service";
import { AdminView } from "@/features/administration/admin-view";

export const metadata: Metadata = {
  title: "Administration",
};

export default async function AdministrationPage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const overview = await getAdminOverview(activeProject?.id ?? null);

  return (
    <AdminView
      currentUserId={session.user.id}
      isSystemAdmin={overview.isSystemAdmin}
      activeProject={activeProject}
      users={overview.users}
      members={overview.members}
      auditLogs={overview.auditLogs}
    />
  );
}
