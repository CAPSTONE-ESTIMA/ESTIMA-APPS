"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createScaffold,
  deleteScaffold,
  updateScaffold,
  updateScaffoldStatus,
} from "@/server/services/scaffolding.service";
import type { ScaffoldInput, ScaffoldStatus, ScaffoldTagStatus } from "./schema";

export type ScaffoldActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Data scaffold tidak valid.";
  }
  const pgError = err as { code?: string; cause?: { code?: string } };
  const code = pgError?.code ?? pgError?.cause?.code;
  if (code === "23505") {
    return "Scaffold ID sudah terdaftar pada proyek ini. Gunakan kode unik lain.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin untuk mengubah data scaffold ini.";
    return err.message;
  }
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

export async function createScaffoldAction(
  projectId: string,
  input: ScaffoldInput
): Promise<ScaffoldActionResult<{ id: string }>> {
  try {
    const created = await createScaffold(projectId, input);
    revalidatePath("/scaffolding");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateScaffoldAction(
  projectId: string,
  scaffoldId: string,
  input: ScaffoldInput
): Promise<ScaffoldActionResult> {
  try {
    await updateScaffold(projectId, scaffoldId, input);
    revalidatePath("/scaffolding");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateScaffoldStatusAction(
  projectId: string,
  scaffoldId: string,
  status: ScaffoldStatus,
  tagStatus?: ScaffoldTagStatus
): Promise<ScaffoldActionResult> {
  try {
    await updateScaffoldStatus(projectId, scaffoldId, status, tagStatus);
    revalidatePath("/scaffolding");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteScaffoldAction(
  projectId: string,
  scaffoldId: string
): Promise<ScaffoldActionResult> {
  try {
    await deleteScaffold(projectId, scaffoldId);
    revalidatePath("/scaffolding");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
