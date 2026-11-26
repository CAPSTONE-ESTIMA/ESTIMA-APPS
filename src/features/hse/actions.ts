"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createHseItem,
  deleteHseItem,
  updateHseItem,
  updateHseItemStatus,
} from "@/server/services/hse.service";
import type { HseInput, HseStatus } from "./schema";

export type HseActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data HSE tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Nomor dokumen HSE sudah digunakan pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data HSE.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createHseAction(
  projectId: string,
  input: HseInput
): Promise<HseActionResult<{ id: string }>> {
  try {
    const created = await createHseItem(projectId, input);
    revalidatePath("/hse");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateHseAction(
  projectId: string,
  recordId: string,
  input: HseInput
): Promise<HseActionResult> {
  try {
    await updateHseItem(projectId, recordId, input);
    revalidatePath("/hse");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateHseStatusAction(
  projectId: string,
  recordId: string,
  status: HseStatus
): Promise<HseActionResult> {
  try {
    await updateHseItemStatus(projectId, recordId, status);
    revalidatePath("/hse");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteHseAction(
  projectId: string,
  recordId: string
): Promise<HseActionResult> {
  try {
    await deleteHseItem(projectId, recordId);
    revalidatePath("/hse");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
