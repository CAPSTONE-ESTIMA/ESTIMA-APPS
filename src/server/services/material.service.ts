import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createMaterialRecord,
  deleteMaterialRecord,
  listMaterialsByProject,
  updateMaterialLifecycleRecord,
  updateMaterialRecord,
} from "@/server/repositories/material.repository";
import {
  materialInputSchema,
  type MaterialInput,
  type MaterialItem,
  type MaterialLifecycle,
} from "@/features/materials/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor"] as const;

export async function listProjectMaterials(projectId: string): Promise<MaterialItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listMaterialsByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createMaterial(projectId: string, rawInput: MaterialInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = materialInputSchema.parse(rawInput);
  return createMaterialRecord(projectId, session.user.id, parsed);
}

export async function updateMaterial(projectId: string, materialId: string, rawInput: MaterialInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = materialInputSchema.parse(rawInput);
  return updateMaterialRecord(projectId, materialId, session.user.id, parsed);
}

export async function updateMaterialLifecycle(
  projectId: string,
  materialId: string,
  lifecycleStatus: MaterialLifecycle
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateMaterialLifecycleRecord(projectId, materialId, session.user.id, lifecycleStatus);
}

export async function deleteMaterial(projectId: string, materialId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteMaterialRecord(projectId, materialId, session.user.id);
}
