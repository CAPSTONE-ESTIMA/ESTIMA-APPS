import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, projectDocuments } from "@/server/db/schema";
import type { DocumentInput, DocumentStatus } from "@/features/documents/schema";

export async function listDocumentsByProject(projectId: string) {
  return getDb()
    .select()
    .from(projectDocuments)
    .where(eq(projectDocuments.projectId, projectId))
    .orderBy(desc(projectDocuments.issueDate), desc(projectDocuments.createdAt));
}

export async function createDocumentRecord(
  projectId: string,
  actorId: string,
  input: DocumentInput
) {
  const code = input.docNumber.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(projectDocuments)
      .values({
        projectId,
        docNumber: code,
        title: input.title.trim(),
        category: input.category,
        discipline: input.discipline.trim(),
        revision: input.revision.trim(),
        authorName: input.authorName.trim(),
        issueDate: input.issueDate.trim(),
        fileUrl: input.fileUrl?.trim() || null,
        status: input.status,
        notes: input.notes?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "document.created",
      entityType: "project_document",
      entityId: created.id,
      metadata: { docNumber: created.docNumber, revision: created.revision },
    });
    return created;
  });
}

export async function updateDocumentRecord(
  projectId: string,
  docId: string,
  actorId: string,
  input: DocumentInput
) {
  const code = input.docNumber.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(projectDocuments)
      .set({
        docNumber: code,
        title: input.title.trim(),
        category: input.category,
        discipline: input.discipline.trim(),
        revision: input.revision.trim(),
        authorName: input.authorName.trim(),
        issueDate: input.issueDate.trim(),
        fileUrl: input.fileUrl?.trim() || null,
        status: input.status,
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(projectDocuments.id, docId), eq(projectDocuments.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Dokumen tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "document.updated",
      entityType: "project_document",
      entityId: updated.id,
      metadata: { docNumber: updated.docNumber, revision: updated.revision, status: updated.status },
    });
    return updated;
  });
}

export async function updateDocumentStatusRecord(
  projectId: string,
  docId: string,
  actorId: string,
  status: DocumentStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(projectDocuments)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(projectDocuments.id, docId), eq(projectDocuments.projectId, projectId)))
      .returning();
    if (!updated) throw new Error("Dokumen tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "document.status_changed",
      entityType: "project_document",
      entityId: updated.id,
      metadata: { docNumber: updated.docNumber, status },
    });
    return updated;
  });
}

export async function deleteDocumentRecord(projectId: string, docId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(projectDocuments)
      .where(and(eq(projectDocuments.id, docId), eq(projectDocuments.projectId, projectId)))
      .returning();
    if (!deleted) throw new Error("Dokumen tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "document.deleted",
      entityType: "project_document",
      entityId: deleted.id,
      metadata: { docNumber: deleted.docNumber },
    });
    return deleted;
  });
}
