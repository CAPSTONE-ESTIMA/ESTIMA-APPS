import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, materials } from "@/server/db/schema";
import type { MaterialInput, MaterialLifecycle } from "@/features/materials/schema";

export async function listMaterialsByProject(projectId: string) {
  return getDb()
    .select()
    .from(materials)
    .where(eq(materials.projectId, projectId))
    .orderBy(desc(materials.updatedAt), desc(materials.createdAt));
}

export async function createMaterialRecord(
  projectId: string,
  actorId: string,
  input: MaterialInput
) {
  const code = input.materialCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(materials)
      .values({
        projectId,
        materialCode: code,
        name: input.name.trim(),
        category: input.category,
        warehouse: input.warehouse.trim(),
        unit: input.unit.trim(),
        stockAvailable: input.stockAvailable,
        stockReserved: input.stockReserved,
        stockIssued: input.stockIssued,
        minStock: input.minStock,
        lifecycleStatus: input.lifecycleStatus,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "material.created",
      entityType: "material",
      entityId: created.id,
      metadata: {
        materialCode: created.materialCode,
        stockAvailable: created.stockAvailable,
      },
    });

    return created;
  });
}

export async function updateMaterialRecord(
  projectId: string,
  materialId: string,
  actorId: string,
  input: MaterialInput
) {
  const code = input.materialCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(materials)
      .set({
        materialCode: code,
        name: input.name.trim(),
        category: input.category,
        warehouse: input.warehouse.trim(),
        unit: input.unit.trim(),
        stockAvailable: input.stockAvailable,
        stockReserved: input.stockReserved,
        stockIssued: input.stockIssued,
        minStock: input.minStock,
        lifecycleStatus: input.lifecycleStatus,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(materials.id, materialId), eq(materials.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Material tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "material.updated",
      entityType: "material",
      entityId: updated.id,
      metadata: {
        materialCode: updated.materialCode,
        stockAvailable: updated.stockAvailable,
        lifecycleStatus: updated.lifecycleStatus,
      },
    });

    return updated;
  });
}

export async function updateMaterialLifecycleRecord(
  projectId: string,
  materialId: string,
  actorId: string,
  lifecycleStatus: MaterialLifecycle
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(materials)
      .set({ lifecycleStatus, updatedAt: new Date() })
      .where(and(eq(materials.id, materialId), eq(materials.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Material tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "material.lifecycle_changed",
      entityType: "material",
      entityId: updated.id,
      metadata: { materialCode: updated.materialCode, lifecycleStatus },
    });

    return updated;
  });
}

export async function deleteMaterialRecord(projectId: string, materialId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(materials)
      .where(and(eq(materials.id, materialId), eq(materials.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Material tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "material.deleted",
      entityType: "material",
      entityId: deleted.id,
      metadata: { materialCode: deleted.materialCode },
    });

    return deleted;
  });
}
