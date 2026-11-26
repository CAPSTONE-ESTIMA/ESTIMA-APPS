import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createInsulationRecord,
  deleteInsulationRecord,
  listInsulationByProject,
  updateInsulationRecord,
  updateInsulationStatusRecord,
} from "@/server/repositories/insulation.repository";
import {
  INSULATION_STATUS_META,
  insulationInputSchema,
  type InsulationInput,
  type InsulationStatus,
  type InsulationWorkItem,
} from "@/features/insulation/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectInsulationWorks(projectId: string): Promise<InsulationWorkItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listInsulationByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createInsulationWork(projectId: string, rawInput: InsulationInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = insulationInputSchema.parse(rawInput);
  return createInsulationRecord(projectId, session.user.id, parsed);
}

export async function updateInsulationWork(
  projectId: string,
  workId: string,
  rawInput: InsulationInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = insulationInputSchema.parse(rawInput);
  return updateInsulationRecord(projectId, workId, session.user.id, parsed);
}

export async function updateInsulationStatus(
  projectId: string,
  workId: string,
  status: InsulationStatus,
  progressPercent?: number
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const resolvedProgress = progressPercent ?? INSULATION_STATUS_META[status].defaultProgress;
  return updateInsulationStatusRecord(projectId, workId, session.user.id, status, resolvedProgress);
}

export async function deleteInsulationWork(projectId: string, workId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteInsulationRecord(projectId, workId, session.user.id);
}
