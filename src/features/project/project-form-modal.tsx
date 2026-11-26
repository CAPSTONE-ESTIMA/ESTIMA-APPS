"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  projectInputSchema,
  type ProjectInput,
  type ProjectSummary,
} from "./schema";
import { createProjectAction, updateProjectAction } from "./actions";

interface ProjectFormModalProps {
  project?: ProjectSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectFormModal({
  project,
  onClose,
  onSuccess,
}: ProjectFormModalProps) {
  const isEdit = Boolean(project);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: project
      ? {
          code: project.code,
          name: project.name,
          client: project.client,
          location: project.location ?? "",
          status: project.status,
        }
      : {
          code: "",
          name: "",
          client: "",
          location: "",
          status: "active",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: ProjectInput) {
    setServerError(null);
    const result = project
      ? await updateProjectAction(project.id, values)
      : await createProjectAction(values);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-md border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Project Registry
            </p>
            <h2 id="project-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? "Edit Data Proyek" : "Tambah Proyek Baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup modal"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Kode Proyek <span className="text-red-500">*</span>
              </label>
              <input
                id="project-code"
                type="text"
                placeholder="PRJ-LNG-01"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("code")}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="project-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="project-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                <option value="active">Active (Berjalan)</option>
                <option value="draft">Draft (Persiapan)</option>
                <option value="completed">Completed (Selesai)</option>
                <option value="archived">Archived (Diarsipkan)</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="project-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Nama Proyek <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Tangguh LNG Expansion — Train 3"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="project-client" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Klien / Pemilik Proyek <span className="text-red-500">*</span>
            </label>
            <input
              id="project-client"
              type="text"
              placeholder="BP Berau Ltd. / PT Pertamina"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("client")}
            />
            {errors.client && (
              <p className="mt-1 text-xs text-red-600">{errors.client.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="project-location" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Lokasi / Site
            </label>
            <input
              id="project-location"
              type="text"
              placeholder="Teluk Bintuni, Papua Barat — Area 42"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("location")}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800" role="alert">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Proyek"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
