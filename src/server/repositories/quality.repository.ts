import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, qaInspections } from "@/server/db/schema";
import type { QaClientApproval, QaInput, QaResult } from "@/features/quality/schema";

export async function listQaByProject(projectId: string) {
  return getDb()
    .select()
    .from(qaInspections)
    .where(eq(qaInspections.projectId, projectId))
    .orderBy(desc(qaInspections.inspectionDate), desc(qaInspections.createdAt));
}

export async function createQaRecord(projectId: string, actorId: string, input: QaInput) {
  const code = input.inspectionCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(qaInspections)
      .values({
        projectId,
        inspectionCode: code,
        recordType: input.recordType,
        discipline: input.discipline,
        referenceCode: input.referenceCode.trim(),
        area: input.area.trim(),
        title: input.title.trim(),
        inspectorName: input.inspectorName.trim(),
        inspectionDate: input.inspectionDate.trim(),
        result: input.result,
        clientApproval: input.clientApproval,
        findings: input.findings?.trim() || null,
        correctiveAction: input.correctiveAction?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "qa.created",
      entityType: "qa_inspection",
      entityId: created.id,
      metadata: {
        inspectionCode: created.inspectionCode,
        recordType: created.recordType,
        result: created.result,
      },
    });

    return created;
  });
}

export async function updateQaRecord(
  projectId: string,
  inspectionId: string,
  actorId: string,
  input: QaInput
) {
  const code = input.inspectionCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(qaInspections)
      .set({
        inspectionCode: code,
        recordType: input.recordType,
        discipline: input.discipline,
        referenceCode: input.referenceCode.trim(),
        area: input.area.trim(),
        title: input.title.trim(),
        inspectorName: input.inspectorName.trim(),
        inspectionDate: input.inspectionDate.trim(),
        result: input.result,
        clientApproval: input.clientApproval,
        findings: input.findings?.trim() || null,
        correctiveAction: input.correctiveAction?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(qaInspections.id, inspectionId), eq(qaInspections.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Data inspeksi QA/QC tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "qa.updated",
      entityType: "qa_inspection",
      entityId: updated.id,
      metadata: {
        inspectionCode: updated.inspectionCode,
        result: updated.result,
        clientApproval: updated.clientApproval,
      },
    });

    return updated;
  });
}

export async function updateQaResultRecord(
  projectId: string,
  inspectionId: string,
  actorId: string,
  result: QaResult,
  clientApproval?: QaClientApproval
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(qaInspections)
      .set({
        result,
        ...(clientApproval ? { clientApproval } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(qaInspections.id, inspectionId), eq(qaInspections.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Data inspeksi QA/QC tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "qa.result_changed",
      entityType: "qa_inspection",
      entityId: updated.id,
      metadata: {
        inspectionCode: updated.inspectionCode,
        result: updated.result,
        clientApproval: updated.clientApproval,
      },
    });

    return updated;
  });
}

export async function deleteQaRecord(projectId: string, inspectionId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(qaInspections)
      .where(and(eq(qaInspections.id, inspectionId), eq(qaInspections.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Data inspeksi QA/QC tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "qa.deleted",
      entityType: "qa_inspection",
      entityId: deleted.id,
      metadata: { inspectionCode: deleted.inspectionCode },
    });

    return deleted;
  });
}
