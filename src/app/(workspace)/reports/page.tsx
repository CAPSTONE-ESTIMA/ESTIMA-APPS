import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectScaffolds } from "@/server/services/scaffolding.service";
import { listProjectInsulationWorks } from "@/server/services/insulation.service";
import { listProjectPlanningActivities } from "@/server/services/planning.service";
import { listProjectDailyReports } from "@/server/services/daily-report.service";
import { listProjectManpower } from "@/server/services/manpower.service";
import { listProjectMaterials } from "@/server/services/material.service";
import { listProjectQaInspections } from "@/server/services/quality.service";
import { listProjectPunchItems } from "@/server/services/punchlist.service";
import { ReportsView } from "@/features/reports/reports-view";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const [
    scaffolds,
    insulation,
    planning,
    dailyReports,
    manpower,
    materials,
    qaInspections,
    punchItems,
  ] = activeProject
    ? await Promise.all([
        listProjectScaffolds(activeProject.id),
        listProjectInsulationWorks(activeProject.id),
        listProjectPlanningActivities(activeProject.id),
        listProjectDailyReports(activeProject.id),
        listProjectManpower(activeProject.id),
        listProjectMaterials(activeProject.id),
        listProjectQaInspections(activeProject.id),
        listProjectPunchItems(activeProject.id),
      ])
    : [[], [], [], [], [], [], [], []];

  return (
    <ReportsView
      activeProject={activeProject}
      scaffolds={scaffolds}
      insulation={insulation}
      planning={planning}
      dailyReports={dailyReports}
      manpower={manpower}
      materials={materials}
      qaInspections={qaInspections}
      punchItems={punchItems}
    />
  );
}
