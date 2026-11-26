"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DAILY_REPORT_STATUS_META,
  WEATHER_LABELS,
  dailyReportInputSchema,
  dailyReportStatusValues,
  weatherValues,
  type DailyReportInput,
  type DailyReportItem,
} from "./schema";
import { createDailyReportAction, updateDailyReportAction } from "./actions";

interface DailyReportFormModalProps {
  projectId: string;
  item?: DailyReportItem | null;
  defaultSupervisor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DailyReportFormModal({
  projectId,
  item,
  defaultSupervisor,
  onClose,
  onSuccess,
}: DailyReportFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DailyReportInput>({
    resolver: zodResolver(dailyReportInputSchema),
    defaultValues: item
      ? {
          reportCode: item.reportCode,
          reportDate: item.reportDate,
          shift: item.shift,
          weather: item.weather,
          area: item.area,
          supervisorName: item.supervisorName,
          manpowerCount: item.manpowerCount,
          regularHours: item.regularHours,
          overtimeHours: item.overtimeHours,
          activitiesSummary: item.activitiesSummary,
          constraints: item.constraints ?? "",
          safetyNotes: item.safetyNotes ?? "",
          status: item.status,
        }
      : {
          reportCode: `DR-${today.replaceAll("-", "")}-01`,
          reportDate: today,
          shift: "day",
          weather: "clear",
          area: "",
          supervisorName: defaultSupervisor,
          manpowerCount: 12,
          regularHours: 96,
          overtimeHours: 0,
          activitiesSummary: "",
          constraints: "",
          safetyNotes: "Zero LTI — Toolbox Talk & PTW verified before shift.",
          status: "submitted",
        },
  });

  const [regHrs, otHrs] = useWatch({ control, name: ["regularHours", "overtimeHours"] });
  const totalManhours = Number(((regHrs || 0) + (otHrs || 0)).toFixed(1));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: DailyReportInput) {
    setServerError(null);
    const res = item
      ? await updateDailyReportAction(projectId, item.id, values)
      : await createDailyReportAction(projectId, values);

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
      aria-labelledby="dr-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Daily Progress Report
            </p>
            <h2 id="dr-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Laporan ${item?.reportCode}` : "Buat Daily Report Baru"}
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
              <label htmlFor="dr-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Report No. *
              </label>
              <input
                id="dr-code"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("reportCode")}
              />
              {errors.reportCode && <p className="mt-1 text-xs text-red-600">{errors.reportCode.message}</p>}
            </div>

            <div>
              <label htmlFor="dr-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tanggal *
              </label>
              <input
                id="dr-date"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("reportDate")}
              />
              {errors.reportDate && <p className="mt-1 text-xs text-red-600">{errors.reportDate.message}</p>}
            </div>

            <div>
              <label htmlFor="dr-shift" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Shift *
              </label>
              <select
                id="dr-shift"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("shift")}
              >
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dr-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area Kerja *
              </label>
              <input
                id="dr-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="dr-sup" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Site Supervisor *
              </label>
              <input
                id="dr-sup"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("supervisorName")}
              />
              {errors.supervisorName && <p className="mt-1 text-xs text-red-600">{errors.supervisorName.message}</p>}
            </div>

            <div>
              <label htmlFor="dr-weather" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Cuaca *
              </label>
              <select
                id="dr-weather"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("weather")}
              >
                {weatherValues.map((w) => (
                  <option key={w} value={w}>
                    {WEATHER_LABELS[w]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manpower & Manhours */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Manpower &amp; Manhours Shift
              </span>
              <span className="rounded border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
                Total: {totalManhours.toLocaleString("id-ID")} hrs
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="dr-mp" className="mb-1 block text-xs text-slate-600">
                  Jumlah Pekerja (POB) *
                </label>
                <input
                  id="dr-mp"
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("manpowerCount", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="dr-reg" className="mb-1 block text-xs text-slate-600">
                  Regular Hours *
                </label>
                <input
                  id="dr-reg"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("regularHours", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="dr-ot" className="mb-1 block text-xs text-slate-600">
                  Overtime Hours *
                </label>
                <input
                  id="dr-ot"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("overtimeHours", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="dr-act" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Ringkasan Pekerjaan Lapangan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="dr-act"
              rows={3}
              placeholder="Detail pekerjaan scaffolding erection, pemasangan insulasi, cladding, dan inspeksi hari ini..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("activitiesSummary")}
            />
            {errors.activitiesSummary && <p className="mt-1 text-xs text-red-600">{errors.activitiesSummary.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dr-cons" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Kendala / Delay Lapangan
              </label>
              <textarea
                id="dr-cons"
                rows={2}
                placeholder="Hujan, waiting PTW, atau keterlambatan material..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("constraints")}
              />
            </div>

            <div>
              <label htmlFor="dr-hse" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Catatan HSE / Safety
              </label>
              <textarea
                id="dr-hse"
                rows={2}
                placeholder="TBT, APD, kondisi unsafe act/condition..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("safetyNotes")}
              />
            </div>
          </div>

          <div className="max-w-xs">
            <label htmlFor="dr-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Status Laporan
            </label>
            <select
              id="dr-status"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("status")}
            >
              {dailyReportStatusValues.map((st) => (
                <option key={st} value={st}>
                  {DAILY_REPORT_STATUS_META[st].label}
                </option>
              ))}
            </select>
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
              {isEdit ? "Simpan Perubahan" : "Simpan Laporan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
