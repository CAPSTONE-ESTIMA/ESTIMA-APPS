"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createPunchItem,
  deletePunchItem,
  updatePunchItem,
  updatePunchItemStatus,
} from "@/server/services/punchlist.service";
import type { PunchInput, PunchStatus } from "./schema";

export type PunchActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data punch item tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Nomor punch item sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data punch list.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createPunchAction(
  projectId: string,
  input: PunchInput
): Promise<PunchActionResult<{ id: string }>> {
  try {
    const created = await createPunchItem(projectId, input);
    revalidatePath("/punchlist");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updatePunchAction(
  projectId: string,
  punchId: string,
  input: PunchInput
): Promise<PunchActionResult> {
  try {
    await updatePunchItem(projectId, punchId, input);
    revalidatePath("/punchlist");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updatePunchStatusAction(
  projectId: string,
  punchId: string,
  status: PunchStatus
): Promise<PunchActionResult> {
  try {
    await updatePunchItemStatus(projectId, punchId, status);
    revalidatePath("/punchlist");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deletePunchAction(
  projectId: string,
  punchId: string
): Promise<PunchActionResult> {
  try {
    await deletePunchItem(projectId, punchId);
    revalidatePath("/punchlist");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
