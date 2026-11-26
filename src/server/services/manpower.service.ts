import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createManpowerRecord,
  deleteManpowerRecord,
  listManpowerByProject,
  updateManpowerRecord,
  updateManpowerStatusRecord,
} from "@/server/repositories/manpower.repository";
import {
  manpowerInputSchema,
  type ManpowerInput,
  type ManpowerItem,
  type ManpowerStatus,
} from "@/features/manpower/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor"] as const;

export async function listProjectManpower(projectId: string): Promise<ManpowerItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listManpowerByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createManpower(projectId: string, rawInput: ManpowerInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = manpowerInputSchema.parse(rawInput);
  return createManpowerRecord(projectId, session.user.id, parsed);
}

export async function updateManpower(projectId: string, recordId: string, rawInput: ManpowerInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = manpowerInputSchema.parse(rawInput);
  return updateManpowerRecord(projectId, recordId, session.user.id, parsed);
}

export async function updateManpowerStatus(
  projectId: string,
  recordId: string,
  status: ManpowerStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateManpowerStatusRecord(projectId, recordId, session.user.id, status);
}

export async function deleteManpower(projectId: string, recordId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteManpowerRecord(projectId, recordId, session.user.id);
}
