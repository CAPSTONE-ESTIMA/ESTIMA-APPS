import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createQaRecord,
  deleteQaRecord,
  listQaByProject,
  updateQaRecord,
  updateQaResultRecord,
} from "@/server/repositories/quality.repository";
import {
  qaInputSchema,
  type QaClientApproval,
  type QaInput,
  type QaInspectionItem,
  type QaResult,
} from "@/features/quality/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectQaInspections(projectId: string): Promise<QaInspectionItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listQaByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createQaInspection(projectId: string, rawInput: QaInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = qaInputSchema.parse(rawInput);
  return createQaRecord(projectId, session.user.id, parsed);
}

export async function updateQaInspection(
  projectId: string,
  inspectionId: string,
  rawInput: QaInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = qaInputSchema.parse(rawInput);
  return updateQaRecord(projectId, inspectionId, session.user.id, parsed);
}

export async function updateQaInspectionResult(
  projectId: string,
  inspectionId: string,
  result: QaResult,
  clientApproval?: QaClientApproval
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateQaResultRecord(projectId, inspectionId, session.user.id, result, clientApproval);
}

export async function deleteQaInspection(projectId: string, inspectionId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteQaRecord(projectId, inspectionId, session.user.id);
}
