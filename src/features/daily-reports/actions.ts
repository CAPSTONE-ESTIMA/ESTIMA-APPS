"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createDailyReport,
  deleteDailyReport,
  updateDailyReport,
  updateDailyReportStatus,
} from "@/server/services/daily-report.service";
import type { DailyReportInput, DailyReportStatus } from "./schema";

export type DailyReportActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data laporan harian tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Nomor laporan harian sudah digunakan pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah laporan harian.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createDailyReportAction(
  projectId: string,
  input: DailyReportInput
): Promise<DailyReportActionResult<{ id: string }>> {
  try {
    const created = await createDailyReport(projectId, input);
    revalidatePath("/daily-reports");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateDailyReportAction(
  projectId: string,
  reportId: string,
  input: DailyReportInput
): Promise<DailyReportActionResult> {
  try {
    await updateDailyReport(projectId, reportId, input);
    revalidatePath("/daily-reports");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateDailyReportStatusAction(
  projectId: string,
  reportId: string,
  status: DailyReportStatus
): Promise<DailyReportActionResult> {
  try {
    await updateDailyReportStatus(projectId, reportId, status);
    revalidatePath("/daily-reports");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteDailyReportAction(
  projectId: string,
  reportId: string
): Promise<DailyReportActionResult> {
  try {
    await deleteDailyReport(projectId, reportId);
    revalidatePath("/daily-reports");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
