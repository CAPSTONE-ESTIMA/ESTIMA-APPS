import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, punchItems } from "@/server/db/schema";
import type { PunchInput, PunchStatus } from "@/features/punchlist/schema";

export async function listPunchByProject(projectId: string) {
  return getDb()
    .select()
    .from(punchItems)
    .where(eq(punchItems.projectId, projectId))
    .orderBy(asc(punchItems.dueDate), desc(punchItems.createdAt));
}

export async function createPunchRecord(projectId: string, actorId: string, input: PunchInput) {
  const code = input.punchCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(punchItems)
      .values({
        projectId,
        punchCode: code,
        area: input.area.trim(),
        referenceCode: input.referenceCode.trim(),
        category: input.category,
        priority: input.priority,
        description: input.description.trim(),
        picName: input.picName.trim(),
        dueDate: input.dueDate.trim(),
        correctiveAction: input.correctiveAction?.trim() || null,
        status: input.status,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "punch.created",
      entityType: "punch_item",
      entityId: created.id,
      metadata: {
        punchCode: created.punchCode,
        category: created.category,
        status: created.status,
      },
    });

    return created;
  });
}

export async function updatePunchRecord(
  projectId: string,
  punchId: string,
  actorId: string,
  input: PunchInput
) {
  const code = input.punchCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(punchItems)
      .set({
        punchCode: code,
        area: input.area.trim(),
        referenceCode: input.referenceCode.trim(),
        category: input.category,
        priority: input.priority,
        description: input.description.trim(),
        picName: input.picName.trim(),
        dueDate: input.dueDate.trim(),
        correctiveAction: input.correctiveAction?.trim() || null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(and(eq(punchItems.id, punchId), eq(punchItems.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Punch item tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "punch.updated",
      entityType: "punch_item",
      entityId: updated.id,
      metadata: { punchCode: updated.punchCode, status: updated.status },
    });

    return updated;
  });
}

export async function updatePunchStatusRecord(
  projectId: string,
  punchId: string,
  actorId: string,
  status: PunchStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(punchItems)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(punchItems.id, punchId), eq(punchItems.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Punch item tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "punch.status_changed",
      entityType: "punch_item",
      entityId: updated.id,
      metadata: { punchCode: updated.punchCode, status },
    });

    return updated;
  });
}

export async function deletePunchRecord(projectId: string, punchId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(punchItems)
      .where(and(eq(punchItems.id, punchId), eq(punchItems.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Punch item tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "punch.deleted",
      entityType: "punch_item",
      entityId: deleted.id,
      metadata: { punchCode: deleted.punchCode },
    });

    return deleted;
  });
}
