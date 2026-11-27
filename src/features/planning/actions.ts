"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createPlanningActivity,
  deletePlanningActivity,
  updatePlanningActivity,
  updatePlanningActivityStatus,
} from "@/server/services/planning.service";
import type { PlanningInput, PlanningStatus } from "./schema";

export type PlanningActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data aktivitas tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Kode aktivitas sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah jadwal proyek.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createPlanningAction(
  projectId: string,
  input: PlanningInput
): Promise<PlanningActionResult<{ id: string }>> {
  try {
    const created = await createPlanningActivity(projectId, input);
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updatePlanningAction(
  projectId: string,
  activityId: string,
  input: PlanningInput
): Promise<PlanningActionResult> {
  try {
    await updatePlanningActivity(projectId, activityId, input);
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updatePlanningStatusAction(
  projectId: string,
  activityId: string,
  status: PlanningStatus
): Promise<PlanningActionResult> {
  try {
    await updatePlanningActivityStatus(projectId, activityId, status);
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deletePlanningAction(
  projectId: string,
  activityId: string
): Promise<PlanningActionResult> {
  try {
    await deletePlanningActivity(projectId, activityId);
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
