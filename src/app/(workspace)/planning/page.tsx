import type { Metadata } from "next";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectPlanningActivities } from "@/server/services/planning.service";
import { PlanningView } from "@/features/planning/planning-view";

export const metadata: Metadata = {
  title: "Planning & Progress",
};

export default async function PlanningPage() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const activities = activeProject ? await listProjectPlanningActivities(activeProject.id) : [];

  return <PlanningView activeProject={activeProject} activities={activities} />;
}
