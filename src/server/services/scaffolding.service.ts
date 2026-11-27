import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createScaffoldRecord,
  deleteScaffoldRecord,
  listScaffoldsByProject,
  updateScaffoldRecord,
  updateScaffoldStatusRecord,
} from "@/server/repositories/scaffolding.repository";
import {
  SCAFFOLD_STATUS_META,
  scaffoldInputSchema,
  type ScaffoldInput,
  type ScaffoldItem,
  type ScaffoldStatus,
  type ScaffoldTagStatus,
} from "@/features/scaffolding/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectScaffolds(projectId: string): Promise<ScaffoldItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listScaffoldsByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createScaffold(projectId: string, rawInput: ScaffoldInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = scaffoldInputSchema.parse(rawInput);
  return createScaffoldRecord(projectId, session.user.id, parsed);
}

export async function updateScaffold(projectId: string, scaffoldId: string, rawInput: ScaffoldInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = scaffoldInputSchema.parse(rawInput);
  return updateScaffoldRecord(projectId, scaffoldId, session.user.id, parsed);
}

export async function updateScaffoldStatus(
  projectId: string,
  scaffoldId: string,
  status: ScaffoldStatus,
  tagStatus?: ScaffoldTagStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const resolvedTag = tagStatus ?? SCAFFOLD_STATUS_META[status].defaultTag;
  return updateScaffoldStatusRecord(projectId, scaffoldId, session.user.id, status, resolvedTag);
}

export async function deleteScaffold(projectId: string, scaffoldId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteScaffoldRecord(projectId, scaffoldId, session.user.id);
}
