import { AppShell } from "@/components/layout/app-shell";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const systemRole = (session.user as { systemRole?: string }).systemRole ?? "member";

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userRole={systemRole}
      projects={projects}
      activeProjectId={activeProjectId}
    >
      {children}
    </AppShell>
  );
}
