import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, commercialItems } from "@/server/db/schema";
import type { CommercialInput, CommercialStatus } from "@/features/commercial/schema";

export async function listCommercialByProject(projectId: string) {
  return getDb()
    .select()
    .from(commercialItems)
    .where(eq(commercialItems.projectId, projectId))
    .orderBy(desc(commercialItems.updatedAt), desc(commercialItems.createdAt));
}

export async function createCommercialRecord(
  projectId: string,
  actorId: string,
  input: CommercialInput
) {
  const code = input.itemCode.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(commercialItems)
      .values({
        projectId,
        itemCode: code,
        itemType: input.itemType,
        title: input.title.trim(),
        workPackage: input.workPackage.trim(),
        unit: input.unit.trim(),
        quantity: input.quantity,
        unitRateIdr: input.unitRateIdr,
        billedPercent: input.billedPercent,
        status: input.status,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "commercial.created",
      entityType: "commercial_item",
      entityId: created.id,
      metadata: { itemCode: created.itemCode, itemType: created.itemType },
    });
    return created;
  });
}

export async function updateCommercialRecord(
  projectId: string,
  itemId: string,
  actorId: string,
  input: CommercialInput
) {
  const code = input.itemCode.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(commercialItems)
      .set({
        itemCode: code,
        itemType: input.itemType,
        title: input.title.trim(),
        workPackage: input.workPackage.trim(),
        unit: input.unit.trim(),
        quantity: input.quantity,
        unitRateIdr: input.unitRateIdr,
        billedPercent: input.billedPercent,
        status: input.status,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(commercialItems.id, itemId), eq(commercialItems.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Item commercial tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "commercial.updated",
      entityType: "commercial_item",
      entityId: updated.id,
      metadata: { itemCode: updated.itemCode, status: updated.status },
    });
    return updated;
  });
}

export async function updateCommercialStatusRecord(
  projectId: string,
  itemId: string,
  actorId: string,
  status: CommercialStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(commercialItems)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(commercialItems.id, itemId), eq(commercialItems.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Item commercial tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "commercial.status_changed",
      entityType: "commercial_item",
      entityId: updated.id,
      metadata: { itemCode: updated.itemCode, status },
    });
    return updated;
  });
}

export async function deleteCommercialRecord(projectId: string, itemId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(commercialItems)
      .where(and(eq(commercialItems.id, itemId), eq(commercialItems.projectId, projectId)))
      .returning();
    if (!deleted) throw new Error("Item commercial tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "commercial.deleted",
      entityType: "commercial_item",
      entityId: deleted.id,
      metadata: { itemCode: deleted.itemCode },
    });
    return deleted;
  });
}
