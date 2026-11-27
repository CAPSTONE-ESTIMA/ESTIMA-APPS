"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createQaInspection,
  deleteQaInspection,
  updateQaInspection,
  updateQaInspectionResult,
} from "@/server/services/quality.service";
import type { QaClientApproval, QaInput, QaResult } from "./schema";

export type QaActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data QA/QC tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Nomor RFI / NCR sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data QA/QC.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createQaAction(
  projectId: string,
  input: QaInput
): Promise<QaActionResult<{ id: string }>> {
  try {
    const created = await createQaInspection(projectId, input);
    revalidatePath("/quality");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateQaAction(
  projectId: string,
  inspectionId: string,
  input: QaInput
): Promise<QaActionResult> {
  try {
    await updateQaInspection(projectId, inspectionId, input);
    revalidatePath("/quality");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateQaResultAction(
  projectId: string,
  inspectionId: string,
  result: QaResult,
  clientApproval?: QaClientApproval
): Promise<QaActionResult> {
  try {
    await updateQaInspectionResult(projectId, inspectionId, result, clientApproval);
    revalidatePath("/quality");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteQaAction(
  projectId: string,
  inspectionId: string
): Promise<QaActionResult> {
  try {
    await deleteQaInspection(projectId, inspectionId);
    revalidatePath("/quality");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
