import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createCommercialRecord,
  deleteCommercialRecord,
  listCommercialByProject,
  updateCommercialRecord,
  updateCommercialStatusRecord,
} from "@/server/repositories/commercial.repository";
import {
  commercialInputSchema,
  type CommercialInput,
  type CommercialRecordItem,
  type CommercialStatus,
} from "@/features/commercial/schema";

const WRITE_ROLES = ["manager", "planner"] as const;

export async function listProjectCommercialItems(projectId: string): Promise<CommercialRecordItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listCommercialByProject(projectId);
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createCommercialItem(projectId: string, rawInput: CommercialInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return createCommercialRecord(projectId, session.user.id, commercialInputSchema.parse(rawInput));
}

export async function updateCommercialItem(
  projectId: string,
  itemId: string,
  rawInput: CommercialInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateCommercialRecord(
    projectId,
    itemId,
    session.user.id,
    commercialInputSchema.parse(rawInput)
  );
}

export async function updateCommercialItemStatus(
  projectId: string,
  itemId: string,
  status: CommercialStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateCommercialStatusRecord(projectId, itemId, session.user.id, status);
}

export async function deleteCommercialItem(projectId: string, itemId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteCommercialRecord(projectId, itemId, session.user.id);
}
