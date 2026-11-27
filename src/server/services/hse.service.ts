import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createHseRecord,
  deleteHseRecord,
  listHseByProject,
  updateHseRecord,
  updateHseStatusRecord,
} from "@/server/repositories/hse.repository";
import {
  hseInputSchema,
  type HseInput,
  type HseRecordItem,
  type HseStatus,
} from "@/features/hse/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectHseRecords(projectId: string): Promise<HseRecordItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listHseByProject(projectId);
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createHseItem(projectId: string, rawInput: HseInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return createHseRecord(projectId, session.user.id, hseInputSchema.parse(rawInput));
}

export async function updateHseItem(projectId: string, recordId: string, rawInput: HseInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateHseRecord(projectId, recordId, session.user.id, hseInputSchema.parse(rawInput));
}

export async function updateHseItemStatus(projectId: string, recordId: string, status: HseStatus) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateHseStatusRecord(projectId, recordId, session.user.id, status);
}

export async function deleteHseItem(projectId: string, recordId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteHseRecord(projectId, recordId, session.user.id);
}
