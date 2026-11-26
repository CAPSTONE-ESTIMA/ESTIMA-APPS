"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PUNCH_CATEGORY_META,
  PUNCH_PRIORITY_META,
  PUNCH_STATUS_META,
  punchCategoryValues,
  punchInputSchema,
  punchPriorityValues,
  punchStatusValues,
  type PunchInput,
  type PunchItemRecord,
} from "./schema";
import { createPunchAction, updatePunchAction } from "./actions";

interface PunchFormModalProps {
  projectId: string;
  item?: PunchItemRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PunchFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: PunchFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PunchInput>({
    resolver: zodResolver(punchInputSchema),
    defaultValues: item
      ? {
          punchCode: item.punchCode,
          area: item.area,
          referenceCode: item.referenceCode,
          category: item.category,
          priority: item.priority,
          description: item.description,
          picName: item.picName,
          dueDate: item.dueDate,
          correctiveAction: item.correctiveAction ?? "",
          status: item.status,
        }
      : {
          punchCode: "",
          area: "",
          referenceCode: "",
          category: "cat_a",
          priority: "high",
          description: "",
          picName: "",
          dueDate: today,
          correctiveAction: "",
          status: "open",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: PunchInput) {
    setServerError(null);
    const res = item
      ? await updatePunchAction(projectId, item.id, values)
      : await createPunchAction(projectId, values);

    if (!res.ok) {
      setServerError(res.error);
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
      aria-labelledby="punch-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Punch List &amp; Handover Readiness
            </p>
            <h2 id="punch-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Punch ${item?.punchCode}` : "Tambah Punch Item Baru"}
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pl-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Punch No. *
              </label>
              <input
                id="pl-code"
                type="text"
                placeholder="PL-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("punchCode")}
              />
              {errors.punchCode && <p className="mt-1 text-xs text-red-600">{errors.punchCode.message}</p>}
            </div>

            <div>
              <label htmlFor="pl-cat" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Category *
              </label>
              <select
                id="pl-cat"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("category")}
              >
                {punchCategoryValues.map((c) => (
                  <option key={c} value={c}>
                    {PUNCH_CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pl-prio" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Priority *
              </label>
              <select
                id="pl-prio"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("priority")}
              >
                {punchPriorityValues.map((p) => (
                  <option key={p} value={p}>
                    {PUNCH_PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pl-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area *
              </label>
              <input
                id="pl-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="pl-ref" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Ref Unit / Line *
              </label>
              <input
                id="pl-ref"
                type="text"
                placeholder="INS-A42-001 / SCF-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("referenceCode")}
              />
              {errors.referenceCode && <p className="mt-1 text-xs text-red-600">{errors.referenceCode.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="pl-desc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Deskripsi Temuan *
            </label>
            <textarea
              id="pl-desc"
              rows={2}
              placeholder="Sealant sambungan cladding elbow belum tertutup sempurna, potensi water ingress..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("description")}
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pl-pic" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                PIC / Penanggung Jawab *
              </label>
              <input
                id="pl-pic"
                type="text"
                placeholder="Supervisor Crew B"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("picName")}
              />
              {errors.picName && <p className="mt-1 text-xs text-red-600">{errors.picName.message}</p>}
            </div>

            <div>
              <label htmlFor="pl-due" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Target Due Date *
              </label>
              <input
                id="pl-due"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("dueDate")}
              />
              {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label htmlFor="pl-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Workflow Status
              </label>
              <select
                id="pl-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                {punchStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {PUNCH_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pl-act" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Corrective Action / Hasil Rework
            </label>
            <textarea
              id="pl-act"
              rows={2}
              placeholder="Aplikasi ulang silicone sealant dan verifikasi ulang oleh QC..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("correctiveAction")}
            />
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
              {isEdit ? "Simpan Perubahan" : "Simpan Punch Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
