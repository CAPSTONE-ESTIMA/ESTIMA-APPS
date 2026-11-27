"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  assignProjectMember,
  createStaffUser,
  removeProjectMember,
} from "@/server/services/admin.service";
import type { AssignMemberInput, CreateUserInput } from "./schema";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

function formatError(err: unknown): string {
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Data tidak valid.";
  const pgError = err as { code?: string; cause?: { code?: string } };
  if ((pgError?.code ?? pgError?.cause?.code) === "23505") {
    return "Email tersebut sudah terdaftar pada sistem.";
  }
  if (err instanceof Error) {
    if (err.message === "Unauthenticated") return "Sesi berakhir. Silakan login kembali.";
    if (err.message === "Forbidden") return "Akses ditolak. Diperlukan role Administrator / Project Manager.";
    return err.message;
  }
  return "Terjadi kesalahan pada server.";
}

export async function createStaffUserAction(input: CreateUserInput): Promise<AdminActionResult> {
  try {
    await createStaffUser(input);
    revalidatePath("/administration");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function assignProjectMemberAction(
  input: AssignMemberInput
): Promise<AdminActionResult> {
  try {
    await assignProjectMember(input);
    revalidatePath("/administration");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}

export async function removeProjectMemberAction(
  projectId: string,
  userId: string
): Promise<AdminActionResult> {
  try {
    await removeProjectMember(projectId, userId);
    revalidatePath("/administration");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatError(err) };
  }
}
