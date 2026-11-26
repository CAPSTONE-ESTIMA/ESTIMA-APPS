import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createDocumentRecord,
  deleteDocumentRecord,
  listDocumentsByProject,
  updateDocumentRecord,
  updateDocumentStatusRecord,
} from "@/server/repositories/document.repository";
import {
  documentInputSchema,
  type DocumentInput,
  type DocumentStatus,
  type ProjectDocumentItem,
} from "@/features/documents/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectDocuments(projectId: string): Promise<ProjectDocumentItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listDocumentsByProject(projectId);
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createProjectDocument(projectId: string, rawInput: DocumentInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return createDocumentRecord(projectId, session.user.id, documentInputSchema.parse(rawInput));
}

export async function updateProjectDocument(
  projectId: string,
  docId: string,
  rawInput: DocumentInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateDocumentRecord(
    projectId,
    docId,
    session.user.id,
    documentInputSchema.parse(rawInput)
  );
}

export async function updateProjectDocumentStatus(
  projectId: string,
  docId: string,
  status: DocumentStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateDocumentStatusRecord(projectId, docId, session.user.id, status);
}

export async function deleteProjectDocument(projectId: string, docId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteDocumentRecord(projectId, docId, session.user.id);
}
