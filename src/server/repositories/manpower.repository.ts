import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, manpowerRecords } from "@/server/db/schema";
import type { ManpowerInput, ManpowerStatus } from "@/features/manpower/schema";

export async function listManpowerByProject(projectId: string) {
  return getDb()
    .select()
    .from(manpowerRecords)
    .where(eq(manpowerRecords.projectId, projectId))
    .orderBy(desc(manpowerRecords.updatedAt), desc(manpowerRecords.createdAt));
}

export async function createManpowerRecord(
  projectId: string,
  actorId: string,
  input: ManpowerInput
) {
  const code = input.employeeCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(manpowerRecords)
      .values({
        projectId,
        employeeCode: code,
        fullName: input.fullName.trim(),
        position: input.position.trim(),
        trade: input.trade,
        crew: input.crew.trim(),
        certification: input.certification?.trim() || null,
        certExpiry: input.certExpiry?.trim() || null,
        mobilizationDate: input.mobilizationDate?.trim() || null,
        regularHoursTotal: input.regularHoursTotal,
        overtimeHoursTotal: input.overtimeHoursTotal,
        status: input.status,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "manpower.created",
      entityType: "manpower",
      entityId: created.id,
      metadata: { employeeCode: created.employeeCode, fullName: created.fullName },
    });

    return created;
  });
}

export async function updateManpowerRecord(
  projectId: string,
  recordId: string,
  actorId: string,
  input: ManpowerInput
) {
  const code = input.employeeCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(manpowerRecords)
      .set({
        employeeCode: code,
        fullName: input.fullName.trim(),
        position: input.position.trim(),
        trade: input.trade,
        crew: input.crew.trim(),
        certification: input.certification?.trim() || null,
        certExpiry: input.certExpiry?.trim() || null,
        mobilizationDate: input.mobilizationDate?.trim() || null,
        regularHoursTotal: input.regularHoursTotal,
        overtimeHoursTotal: input.overtimeHoursTotal,
        status: input.status,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(manpowerRecords.id, recordId), eq(manpowerRecords.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Data personel tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "manpower.updated",
      entityType: "manpower",
      entityId: updated.id,
      metadata: { employeeCode: updated.employeeCode, status: updated.status },
    });

    return updated;
  });
}

export async function updateManpowerStatusRecord(
  projectId: string,
  recordId: string,
  actorId: string,
  status: ManpowerStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(manpowerRecords)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(manpowerRecords.id, recordId), eq(manpowerRecords.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Data personel tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "manpower.status_changed",
      entityType: "manpower",
      entityId: updated.id,
      metadata: { employeeCode: updated.employeeCode, status },
    });

    return updated;
  });
}

export async function deleteManpowerRecord(projectId: string, recordId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(manpowerRecords)
      .where(and(eq(manpowerRecords.id, recordId), eq(manpowerRecords.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Data personel tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "manpower.deleted",
      entityType: "manpower",
      entityId: deleted.id,
      metadata: { employeeCode: deleted.employeeCode },
    });

    return deleted;
  });
}
