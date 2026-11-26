"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createProject,
  setActiveProjectForUser,
  updateProject,
  updateProjectConfiguration,
  updateProjectStatus,
} from "@/server/services/project.service";
import type { ProjectConfiguration, ProjectInput, ProjectStatus } from "./schema";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formatActionError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Data yang dimasukkan tidak valid.";
  }
  const pgError = err as { code?: string; cause?: { code?: string }; message?: string };
  const code = pgError?.code ?? pgError?.cause?.code;
  if (code === "23505") {
    return "Kode proyek sudah digunakan. Gunakan kode proyek yang berbeda.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi Anda telah berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Anda tidak memiliki izin (manager) untuk mengubah proyek ini.";
    return err.message;
  }
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  try {
    const created = await createProject(input);
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return { ok: false, error: formatActionError(err) };
  }
}

export async function updateProjectAction(projectId: string, input: ProjectInput): Promise<ActionResult> {
  try {
    await updateProject(projectId, input);
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatActionError(err) };
  }
}

export async function updateProjectStatusAction(projectId: string, status: ProjectStatus): Promise<ActionResult> {
  try {
    await updateProjectStatus(projectId, status);
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatActionError(err) };
  }
}

export async function updateProjectConfigAction(
  projectId: string,
  config: ProjectConfiguration
): Promise<ActionResult> {
  try {
    await updateProjectConfiguration(projectId, config);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatActionError(err) };
  }
}

export async function selectActiveProjectAction(projectId: string): Promise<ActionResult> {
  try {
    await setActiveProjectForUser(projectId);
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatActionError(err) };
  }
}
