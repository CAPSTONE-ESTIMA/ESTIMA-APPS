import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectDailyReports } from "@/server/services/daily-report.service";
import { DailyReportsView } from "@/features/daily-reports/daily-reports-view";

export const metadata: Metadata = {
  title: "Daily Reports",
};

export default async function DailyReportsPage() {
  const session = await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const reports = activeProject ? await listProjectDailyReports(activeProject.id) : [];

  return (
    <DailyReportsView
      activeProject={activeProject}
      reports={reports}
      currentUserName={session.user.name}
    />
  );
}
