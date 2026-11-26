"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createProjectDocument,
  deleteProjectDocument,
  updateProjectDocument,
  updateProjectDocumentStatus,
} from "@/server/services/document.service";
import type { DocumentInput, DocumentStatus } from "./schema";

export type DocumentActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data dokumen tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Nomor dokumen sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah dokumen.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createDocumentAction(
  projectId: string,
  input: DocumentInput
): Promise<DocumentActionResult<{ id: string }>> {
  try {
    const created = await createProjectDocument(projectId, input);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateDocumentAction(
  projectId: string,
  docId: string,
  input: DocumentInput
): Promise<DocumentActionResult> {
  try {
    await updateProjectDocument(projectId, docId, input);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateDocumentStatusAction(
  projectId: string,
  docId: string,
  status: DocumentStatus
): Promise<DocumentActionResult> {
  try {
    await updateProjectDocumentStatus(projectId, docId, status);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteDocumentAction(
  projectId: string,
  docId: string
): Promise<DocumentActionResult> {
  try {
    await deleteProjectDocument(projectId, docId);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
