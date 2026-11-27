import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, scaffolds } from "@/server/db/schema";
import type { ScaffoldInput, ScaffoldStatus, ScaffoldTagStatus } from "@/features/scaffolding/schema";

export async function listScaffoldsByProject(projectId: string) {
  return getDb()
    .select()
    .from(scaffolds)
    .where(eq(scaffolds.projectId, projectId))
    .orderBy(desc(scaffolds.updatedAt), desc(scaffolds.createdAt));
}

export async function createScaffoldRecord(projectId: string, actorId: string, input: ScaffoldInput) {
  const normalizedCode = input.scaffoldCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(scaffolds)
      .values({
        projectId,
        scaffoldCode: normalizedCode,
        area: input.area.trim(),
        location: input.location.trim(),
        requester: input.requester.trim(),
        purpose: input.purpose?.trim() || null,
        scaffoldType: input.scaffoldType.trim(),
        loadClass: input.loadClass.trim(),
        lengthM: input.lengthM,
        widthM: input.widthM,
        heightM: input.heightM,
        tagStatus: input.tagStatus,
        status: input.status,
        requiredDate: input.requiredDate?.trim() || null,
        lastInspectionDate: input.lastInspectionDate?.trim() || null,
        nextInspectionDate: input.nextInspectionDate?.trim() || null,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "scaffold.created",
      entityType: "scaffold",
      entityId: created.id,
      metadata: {
        scaffoldCode: created.scaffoldCode,
        status: created.status,
        tagStatus: created.tagStatus,
      },
    });

    return created;
  });
}

export async function updateScaffoldRecord(
  projectId: string,
  scaffoldId: string,
  actorId: string,
  input: ScaffoldInput
) {
  const normalizedCode = input.scaffoldCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(scaffolds)
      .set({
        scaffoldCode: normalizedCode,
        area: input.area.trim(),
        location: input.location.trim(),
        requester: input.requester.trim(),
        purpose: input.purpose?.trim() || null,
        scaffoldType: input.scaffoldType.trim(),
        loadClass: input.loadClass.trim(),
        lengthM: input.lengthM,
        widthM: input.widthM,
        heightM: input.heightM,
        tagStatus: input.tagStatus,
        status: input.status,
        requiredDate: input.requiredDate?.trim() || null,
        lastInspectionDate: input.lastInspectionDate?.trim() || null,
        nextInspectionDate: input.nextInspectionDate?.trim() || null,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(scaffolds.id, scaffoldId), eq(scaffolds.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Scaffold tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "scaffold.updated",
      entityType: "scaffold",
      entityId: updated.id,
      metadata: {
        scaffoldCode: updated.scaffoldCode,
        status: updated.status,
        tagStatus: updated.tagStatus,
      },
    });

    return updated;
  });
}

export async function updateScaffoldStatusRecord(
  projectId: string,
  scaffoldId: string,
  actorId: string,
  status: ScaffoldStatus,
  tagStatus: ScaffoldTagStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(scaffolds)
      .set({
        status,
        tagStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(scaffolds.id, scaffoldId), eq(scaffolds.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Scaffold tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "scaffold.status_changed",
      entityType: "scaffold",
      entityId: updated.id,
      metadata: {
        scaffoldCode: updated.scaffoldCode,
        status,
        tagStatus,
      },
    });

    return updated;
  });
}

export async function deleteScaffoldRecord(projectId: string, scaffoldId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(scaffolds)
      .where(and(eq(scaffolds.id, scaffoldId), eq(scaffolds.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Scaffold tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "scaffold.deleted",
      entityType: "scaffold",
      entityId: deleted.id,
      metadata: {
        scaffoldCode: deleted.scaffoldCode,
      },
    });

    return deleted;
  });
}
