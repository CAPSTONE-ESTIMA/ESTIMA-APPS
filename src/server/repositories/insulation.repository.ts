import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, insulationWorks } from "@/server/db/schema";
import type { InsulationInput, InsulationStatus } from "@/features/insulation/schema";

export async function listInsulationByProject(projectId: string) {
  return getDb()
    .select()
    .from(insulationWorks)
    .where(eq(insulationWorks.projectId, projectId))
    .orderBy(desc(insulationWorks.updatedAt), desc(insulationWorks.createdAt));
}

export async function createInsulationRecord(
  projectId: string,
  actorId: string,
  input: InsulationInput
) {
  const normalizedCode = input.workCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(insulationWorks)
      .values({
        projectId,
        workCode: normalizedCode,
        area: input.area.trim(),
        workPackage: input.workPackage.trim(),
        equipmentOrLine: input.equipmentOrLine.trim(),
        insulationType: input.insulationType,
        material: input.material.trim(),
        thicknessMm: input.thicknessMm,
        claddingType: input.claddingType.trim(),
        dimension: input.dimension?.trim() || null,
        quantity: input.quantity,
        unit: input.unit,
        status: input.status,
        progressPercent: input.progressPercent,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "insulation.created",
      entityType: "insulation_work",
      entityId: created.id,
      metadata: {
        workCode: created.workCode,
        status: created.status,
        progressPercent: created.progressPercent,
      },
    });

    return created;
  });
}

export async function updateInsulationRecord(
  projectId: string,
  workId: string,
  actorId: string,
  input: InsulationInput
) {
  const normalizedCode = input.workCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(insulationWorks)
      .set({
        workCode: normalizedCode,
        area: input.area.trim(),
        workPackage: input.workPackage.trim(),
        equipmentOrLine: input.equipmentOrLine.trim(),
        insulationType: input.insulationType,
        material: input.material.trim(),
        thicknessMm: input.thicknessMm,
        claddingType: input.claddingType.trim(),
        dimension: input.dimension?.trim() || null,
        quantity: input.quantity,
        unit: input.unit,
        status: input.status,
        progressPercent: input.progressPercent,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(insulationWorks.id, workId), eq(insulationWorks.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Item insulasi tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "insulation.updated",
      entityType: "insulation_work",
      entityId: updated.id,
      metadata: {
        workCode: updated.workCode,
        status: updated.status,
        progressPercent: updated.progressPercent,
      },
    });

    return updated;
  });
}

export async function updateInsulationStatusRecord(
  projectId: string,
  workId: string,
  actorId: string,
  status: InsulationStatus,
  progressPercent: number
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(insulationWorks)
      .set({
        status,
        progressPercent,
        updatedAt: new Date(),
      })
      .where(and(eq(insulationWorks.id, workId), eq(insulationWorks.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Item insulasi tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "insulation.status_changed",
      entityType: "insulation_work",
      entityId: updated.id,
      metadata: {
        workCode: updated.workCode,
        status,
        progressPercent,
      },
    });

    return updated;
  });
}

export async function deleteInsulationRecord(projectId: string, workId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(insulationWorks)
      .where(and(eq(insulationWorks.id, workId), eq(insulationWorks.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Item insulasi tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "insulation.deleted",
      entityType: "insulation_work",
      entityId: deleted.id,
      metadata: {
        workCode: deleted.workCode,
      },
    });

    return deleted;
  });
}
