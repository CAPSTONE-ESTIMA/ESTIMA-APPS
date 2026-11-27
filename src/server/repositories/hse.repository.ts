import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, hseRecords } from "@/server/db/schema";
import type { HseInput, HseStatus } from "@/features/hse/schema";

export async function listHseByProject(projectId: string) {
  return getDb()
    .select()
    .from(hseRecords)
    .where(eq(hseRecords.projectId, projectId))
    .orderBy(desc(hseRecords.recordDate), desc(hseRecords.createdAt));
}

export async function createHseRecord(projectId: string, actorId: string, input: HseInput) {
  const code = input.recordCode.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(hseRecords)
      .values({
        projectId,
        recordCode: code,
        recordType: input.recordType,
        recordDate: input.recordDate.trim(),
        area: input.area.trim(),
        title: input.title.trim(),
        picName: input.picName.trim(),
        attendeesCount: input.attendeesCount,
        severity: input.severity,
        status: input.status,
        details: input.details?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "hse.created",
      entityType: "hse_record",
      entityId: created.id,
      metadata: { recordCode: created.recordCode, recordType: created.recordType },
    });
    return created;
  });
}

export async function updateHseRecord(
  projectId: string,
  recordId: string,
  actorId: string,
  input: HseInput
) {
  const code = input.recordCode.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(hseRecords)
      .set({
        recordCode: code,
        recordType: input.recordType,
        recordDate: input.recordDate.trim(),
        area: input.area.trim(),
        title: input.title.trim(),
        picName: input.picName.trim(),
        attendeesCount: input.attendeesCount,
        severity: input.severity,
        status: input.status,
        details: input.details?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(hseRecords.id, recordId), eq(hseRecords.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Data HSE tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "hse.updated",
      entityType: "hse_record",
      entityId: updated.id,
      metadata: { recordCode: updated.recordCode, status: updated.status },
    });
    return updated;
  });
}

export async function updateHseStatusRecord(
  projectId: string,
  recordId: string,
  actorId: string,
  status: HseStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(hseRecords)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(hseRecords.id, recordId), eq(hseRecords.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Data HSE tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "hse.status_changed",
      entityType: "hse_record",
      entityId: updated.id,
      metadata: { recordCode: updated.recordCode, status },
    });
    return updated;
  });
}

export async function deleteHseRecord(projectId: string, recordId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(hseRecords)
      .where(and(eq(hseRecords.id, recordId), eq(hseRecords.projectId, projectId)))
      .returning();
    if (!deleted) throw new Error("Data HSE tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "hse.deleted",
      entityType: "hse_record",
      entityId: deleted.id,
      metadata: { recordCode: deleted.recordCode },
    });
    return deleted;
  });
}
