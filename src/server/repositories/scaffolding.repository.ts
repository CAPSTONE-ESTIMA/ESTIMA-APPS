import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { scaffolds } from "@/server/db/schema";
import { writeAuditEvent } from "@/server/services/audit.service";
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

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: "scaffold.created",
      entityType: "scaffold",
      entityId: created.id,
      summary: `Membuat scaffold [${created.scaffoldCode}] di ${created.area} (${created.status})`,
      after: {
        scaffoldCode: created.scaffoldCode,
        area: created.area,
        location: created.location,
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
    const [existing] = await tx
      .select()
      .from(scaffolds)
      .where(and(eq(scaffolds.id, scaffoldId), eq(scaffolds.projectId, projectId)))
      .limit(1);

    if (!existing) throw new Error("Scaffold tidak ditemukan.");

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

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: "scaffold.updated",
      entityType: "scaffold",
      entityId: updated.id,
      before: {
        scaffoldCode: existing.scaffoldCode,
        area: existing.area,
        location: existing.location,
        status: existing.status,
        tagStatus: existing.tagStatus,
        lengthM: existing.lengthM,
        widthM: existing.widthM,
        heightM: existing.heightM,
      },
      after: {
        scaffoldCode: updated.scaffoldCode,
        area: updated.area,
        location: updated.location,
        status: updated.status,
        tagStatus: updated.tagStatus,
        lengthM: updated.lengthM,
        widthM: updated.widthM,
        heightM: updated.heightM,
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
    const [existing] = await tx
      .select({
        scaffoldCode: scaffolds.scaffoldCode,
        status: scaffolds.status,
        tagStatus: scaffolds.tagStatus,
      })
      .from(scaffolds)
      .where(and(eq(scaffolds.id, scaffoldId), eq(scaffolds.projectId, projectId)))
      .limit(1);

    if (!existing) throw new Error("Scaffold tidak ditemukan.");

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

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: "scaffold.status_changed",
      entityType: "scaffold",
      entityId: updated.id,
      summary: `Scaffold [${existing.scaffoldCode}] status: ${existing.status} → ${updated.status}, tag: ${existing.tagStatus} → ${updated.tagStatus}`,
      before: { status: existing.status, tagStatus: existing.tagStatus },
      after: { status: updated.status, tagStatus: updated.tagStatus },
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

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: "scaffold.deleted",
      entityType: "scaffold",
      entityId: deleted.id,
      summary: `Menghapus scaffold [${deleted.scaffoldCode}] dari ${deleted.area}`,
      before: {
        scaffoldCode: deleted.scaffoldCode,
        area: deleted.area,
        status: deleted.status,
        tagStatus: deleted.tagStatus,
      },
      after: null,
    });

    return deleted;
  });
}
