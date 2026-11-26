import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createPlanningRecord,
  deletePlanningRecord,
  listPlanningByProject,
  updatePlanningRecord,
  updatePlanningStatusRecord,
} from "@/server/repositories/planning.repository";
import {
  planningInputSchema,
  type PlanningActivityItem,
  type PlanningInput,
  type PlanningStatus,
} from "@/features/planning/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor"] as const;

export async function listProjectPlanningActivities(projectId: string): Promise<PlanningActivityItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listPlanningByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createPlanningActivity(projectId: string, rawInput: PlanningInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = planningInputSchema.parse(rawInput);
  return createPlanningRecord(projectId, session.user.id, parsed);
}

export async function updatePlanningActivity(
  projectId: string,
  activityId: string,
  rawInput: PlanningInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = planningInputSchema.parse(rawInput);
  return updatePlanningRecord(projectId, activityId, session.user.id, parsed);
}

export async function updatePlanningActivityStatus(
  projectId: string,
  activityId: string,
  status: PlanningStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updatePlanningStatusRecord(projectId, activityId, session.user.id, status);
}

export async function deletePlanningActivity(projectId: string, activityId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deletePlanningRecord(projectId, activityId, session.user.id);
}
