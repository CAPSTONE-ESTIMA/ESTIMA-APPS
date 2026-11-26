"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createMaterial,
  deleteMaterial,
  updateMaterial,
  updateMaterialLifecycle,
} from "@/server/services/material.service";
import type { MaterialInput, MaterialLifecycle } from "./schema";

export type MaterialActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data material tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Material code sudah terdaftar pada proyek ini.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin mengubah data material.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createMaterialAction(
  projectId: string,
  input: MaterialInput
): Promise<MaterialActionResult<{ id: string }>> {
  try {
    const created = await createMaterial(projectId, input);
    revalidatePath("/materials");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateMaterialAction(
  projectId: string,
  materialId: string,
  input: MaterialInput
): Promise<MaterialActionResult> {
  try {
    await updateMaterial(projectId, materialId, input);
    revalidatePath("/materials");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function updateMaterialLifecycleAction(
  projectId: string,
  materialId: string,
  lifecycleStatus: MaterialLifecycle
): Promise<MaterialActionResult> {
  try {
    await updateMaterialLifecycle(projectId, materialId, lifecycleStatus);
    revalidatePath("/materials");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function deleteMaterialAction(
  projectId: string,
  materialId: string
): Promise<MaterialActionResult> {
  try {
    await deleteMaterial(projectId, materialId);
    revalidatePath("/materials");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
