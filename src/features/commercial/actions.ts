"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createCommercialItem,
  deleteCommercialItem,
  updateCommercialItem,
  updateCommercialItemStatus,
} from "@/server/services/commercial.service";
import type { CommercialInput, CommercialStatus } from "./schema";

export type CommercialActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data commercial tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Kode item commercial sudah digunakan pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data commercial.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createCommercialAction(
  projectId: string,
  input: CommercialInput
): Promise<CommercialActionResult<{ id: string }>> {
  try {
    const created = await createCommercialItem(projectId, input);
    revalidatePath("/commercial");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateCommercialAction(
  projectId: string,
  itemId: string,
  input: CommercialInput
): Promise<CommercialActionResult> {
  try {
    await updateCommercialItem(projectId, itemId, input);
    revalidatePath("/commercial");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateCommercialStatusAction(
  projectId: string,
  itemId: string,
  status: CommercialStatus
): Promise<CommercialActionResult> {
  try {
    await updateCommercialItemStatus(projectId, itemId, status);
    revalidatePath("/commercial");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteCommercialAction(
  projectId: string,
  itemId: string
): Promise<CommercialActionResult> {
  try {
    await deleteCommercialItem(projectId, itemId);
    revalidatePath("/commercial");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
