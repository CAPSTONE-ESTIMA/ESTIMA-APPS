"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createInsulationWork,
  deleteInsulationWork,
  updateInsulationStatus,
  updateInsulationWork,
} from "@/server/services/insulation.service";
import type { InsulationInput, InsulationStatus } from "./schema";

export type InsulationActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Data work item insulasi tidak valid.";
  }
  const pgError = err as { code?: string; cause?: { code?: string } };
  const code = pgError?.code ?? pgError?.cause?.code;
  if (code === "23505") {
    return "Kode work item sudah digunakan pada proyek ini. Gunakan kode unik lain.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin untuk mengubah data insulasi ini.";
    return err.message;
  }
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

export async function createInsulationAction(
  projectId: string,
  input: InsulationInput
): Promise<InsulationActionResult<{ id: string }>> {
  try {
    const created = await createInsulationWork(projectId, input);
    revalidatePath("/insulation");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateInsulationAction(
  projectId: string,
  workId: string,
  input: InsulationInput
): Promise<InsulationActionResult> {
  try {
    await updateInsulationWork(projectId, workId, input);
    revalidatePath("/insulation");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateInsulationStatusAction(
  projectId: string,
  workId: string,
  status: InsulationStatus,
  progressPercent?: number
): Promise<InsulationActionResult> {
  try {
    await updateInsulationStatus(projectId, workId, status, progressPercent);
    revalidatePath("/insulation");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteInsulationAction(
  projectId: string,
  workId: string
): Promise<InsulationActionResult> {
  try {
    await deleteInsulationWork(projectId, workId);
    revalidatePath("/insulation");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
