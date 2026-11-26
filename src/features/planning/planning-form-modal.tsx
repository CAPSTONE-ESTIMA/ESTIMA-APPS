"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PLANNING_DISCIPLINE_META,
  PLANNING_STATUS_META,
  planningDisciplineValues,
  planningInputSchema,
  planningStatusValues,
  type PlanningActivityItem,
  type PlanningInput,
} from "./schema";
import { createPlanningAction, updatePlanningAction } from "./actions";

interface PlanningFormModalProps {
  projectId: string;
  item?: PlanningActivityItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlanningFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: PlanningFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanningInput>({
    resolver: zodResolver(planningInputSchema),
    defaultValues: item
      ? {
          activityCode: item.activityCode,
          name: item.name,
          area: item.area,
          workPackage: item.workPackage,
          discipline: item.discipline,
          weightPercent: item.weightPercent,
          plannedStart: item.plannedStart,
          plannedFinish: item.plannedFinish,
          actualStart: item.actualStart ?? "",
          actualFinish: item.actualFinish ?? "",
          plannedProgress: item.plannedProgress,
          actualProgress: item.actualProgress,
          status: item.status,
          constraints: item.constraints ?? "",
        }
      : {
          activityCode: "",
          name: "",
          area: "",
          workPackage: "",
          discipline: "scaffolding",
          weightPercent: 5,
          plannedStart: today,
          plannedFinish: today,
          actualStart: "",
          actualFinish: "",
          plannedProgress: 0,
          actualProgress: 0,
          status: "not_started",
          constraints: "",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: PlanningInput) {
    setServerError(null);
    const res = item
      ? await updatePlanningAction(projectId, item.id, values)
      : await createPlanningAction(projectId, values);

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
      aria-labelledby="planning-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Master Schedule &amp; Progress
            </p>
            <h2 id="planning-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Aktivitas ${item?.activityCode}` : "Tambah Aktivitas Planning"}
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
              <label htmlFor="pln-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Activity ID <span className="text-red-500">*</span>
              </label>
              <input
                id="pln-code"
                type="text"
                placeholder="ACT-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("activityCode")}
              />
              {errors.activityCode && <p className="mt-1 text-xs text-red-600">{errors.activityCode.message}</p>}
            </div>

            <div>
              <label htmlFor="pln-disc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Discipline *
              </label>
              <select
                id="pln-disc"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("discipline")}
              >
                {planningDisciplineValues.map((d) => (
                  <option key={d} value={d}>
                    {PLANNING_DISCIPLINE_META[d].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pln-weight" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Bobot (%) *
              </label>
              <input
                id="pln-weight"
                type="number"
                step="0.5"
                min="0.1"
                max="100"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("weightPercent", { valueAsNumber: true })}
              />
              {errors.weightPercent && <p className="mt-1 text-xs text-red-600">{errors.weightPercent.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="pln-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Nama Aktivitas / Milestone <span className="text-red-500">*</span>
            </label>
            <input
              id="pln-name"
              type="text"
              placeholder="Erection Cryogenic Pipe Rack Scaffolding Bay 4"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pln-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area *
              </label>
              <input
                id="pln-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="pln-wp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Work Package *
              </label>
              <input
                id="pln-wp"
                type="text"
                placeholder="WP-SCF-004"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("workPackage")}
              />
              {errors.workPackage && <p className="mt-1 text-xs text-red-600">{errors.workPackage.message}</p>}
            </div>
          </div>

          {/* Baseline vs Actual Dates */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Baseline &amp; Actual Schedule
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="pln-pstart" className="mb-1 block text-xs text-slate-600">
                  Planned Start *
                </label>
                <input
                  id="pln-pstart"
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  {...register("plannedStart")}
                />
                {errors.plannedStart && <p className="mt-1 text-xs text-red-600">{errors.plannedStart.message}</p>}
              </div>
              <div>
                <label htmlFor="pln-pfin" className="mb-1 block text-xs text-slate-600">
                  Planned Finish *
                </label>
                <input
                  id="pln-pfin"
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  {...register("plannedFinish")}
                />
                {errors.plannedFinish && <p className="mt-1 text-xs text-red-600">{errors.plannedFinish.message}</p>}
              </div>
              <div>
                <label htmlFor="pln-astart" className="mb-1 block text-xs text-slate-600">
                  Actual Start
                </label>
                <input
                  id="pln-astart"
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  {...register("actualStart")}
                />
              </div>
              <div>
                <label htmlFor="pln-afin" className="mb-1 block text-xs text-slate-600">
                  Actual Finish
                </label>
                <input
                  id="pln-afin"
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  {...register("actualFinish")}
                />
              </div>
            </div>
          </div>

          {/* Progress & Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pln-pprog" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Planned (%) *
              </label>
              <input
                id="pln-pprog"
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("plannedProgress", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label htmlFor="pln-aprog" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Actual (%) *
              </label>
              <input
                id="pln-aprog"
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("actualProgress", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label htmlFor="pln-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status *
              </label>
              <select
                id="pln-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                {planningStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {PLANNING_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pln-cons" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Kendala / Constraint &amp; Recovery Plan
            </label>
            <textarea
              id="pln-cons"
              rows={2}
              placeholder="Contoh: Menunggu izin PTW pengelasan selesai di Bay 4..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("constraints")}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Aktivitas"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
