import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createPunchRecord,
  deletePunchRecord,
  listPunchByProject,
  updatePunchRecord,
  updatePunchStatusRecord,
} from "@/server/repositories/punchlist.repository";
import {
  punchInputSchema,
  type PunchInput,
  type PunchItemRecord,
  type PunchStatus,
} from "@/features/punchlist/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectPunchItems(projectId: string): Promise<PunchItemRecord[]> {
  await requireProjectAccess(projectId);
  const rows = await listPunchByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createPunchItem(projectId: string, rawInput: PunchInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = punchInputSchema.parse(rawInput);
  return createPunchRecord(projectId, session.user.id, parsed);
}

export async function updatePunchItem(projectId: string, punchId: string, rawInput: PunchInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = punchInputSchema.parse(rawInput);
  return updatePunchRecord(projectId, punchId, session.user.id, parsed);
}

export async function updatePunchItemStatus(
  projectId: string,
  punchId: string,
  status: PunchStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updatePunchStatusRecord(projectId, punchId, session.user.id, status);
}

export async function deletePunchItem(projectId: string, punchId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deletePunchRecord(projectId, punchId, session.user.id);
}
