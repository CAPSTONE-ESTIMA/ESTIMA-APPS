"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createManpower,
  deleteManpower,
  updateManpower,
  updateManpowerStatus,
} from "@/server/services/manpower.service";
import type { ManpowerInput, ManpowerStatus } from "./schema";

export type ManpowerActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data personel tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Employee ID sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data manpower.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createManpowerAction(
  projectId: string,
  input: ManpowerInput
): Promise<ManpowerActionResult<{ id: string }>> {
  try {
    const created = await createManpower(projectId, input);
    revalidatePath("/manpower");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateManpowerAction(
  projectId: string,
  recordId: string,
  input: ManpowerInput
): Promise<ManpowerActionResult> {
  try {
    await updateManpower(projectId, recordId, input);
    revalidatePath("/manpower");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateManpowerStatusAction(
  projectId: string,
  recordId: string,
  status: ManpowerStatus
): Promise<ManpowerActionResult> {
  try {
    await updateManpowerStatus(projectId, recordId, status);
    revalidatePath("/manpower");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteManpowerAction(
  projectId: string,
  recordId: string
): Promise<ManpowerActionResult> {
  try {
    await deleteManpower(projectId, recordId);
    revalidatePath("/manpower");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
