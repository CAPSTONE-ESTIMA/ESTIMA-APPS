"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MANPOWER_STATUS_META,
  MANPOWER_TRADE_META,
  manpowerInputSchema,
  manpowerStatusValues,
  manpowerTradeValues,
  type ManpowerInput,
  type ManpowerItem,
} from "./schema";
import { createManpowerAction, updateManpowerAction } from "./actions";

interface ManpowerFormModalProps {
  projectId: string;
  item?: ManpowerItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManpowerFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: ManpowerFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManpowerInput>({
    resolver: zodResolver(manpowerInputSchema),
    defaultValues: item
      ? {
          employeeCode: item.employeeCode,
          fullName: item.fullName,
          position: item.position,
          trade: item.trade,
          crew: item.crew,
          certification: item.certification ?? "",
          certExpiry: item.certExpiry ?? "",
          mobilizationDate: item.mobilizationDate ?? "",
          regularHoursTotal: item.regularHoursTotal,
          overtimeHoursTotal: item.overtimeHoursTotal,
          status: item.status,
          notes: item.notes ?? "",
        }
      : {
          employeeCode: "",
          fullName: "",
          position: "Scaffolder",
          trade: "scaffolding",
          crew: "Crew A",
          certification: "",
          certExpiry: "",
          mobilizationDate: today,
          regularHoursTotal: 0,
          overtimeHoursTotal: 0,
          status: "active",
          notes: "",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: ManpowerInput) {
    setServerError(null);
    const res = item
      ? await updateManpowerAction(projectId, item.id, values)
      : await createManpowerAction(projectId, values);

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
      aria-labelledby="mp-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Manpower &amp; Certification Registry
            </p>
            <h2 id="mp-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Personel ${item?.employeeCode}` : "Tambah Personel Proyek"}
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
              <label htmlFor="mp-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Employee ID *
              </label>
              <input
                id="mp-code"
                type="text"
                placeholder="EMP-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("employeeCode")}
              />
              {errors.employeeCode && <p className="mt-1 text-xs text-red-600">{errors.employeeCode.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="mp-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nama Lengkap *
              </label>
              <input
                id="mp-name"
                type="text"
                placeholder="Budi Santoso"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("fullName")}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mp-pos" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Jabatan / Position *
              </label>
              <input
                id="mp-pos"
                type="text"
                placeholder="Lead Scaffolder"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("position")}
              />
              {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>}
            </div>

            <div>
              <label htmlFor="mp-trade" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Trade *
              </label>
              <select
                id="mp-trade"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("trade")}
              >
                {manpowerTradeValues.map((t) => (
                  <option key={t} value={t}>
                    {MANPOWER_TRADE_META[t].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mp-crew" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Crew / Tim *
              </label>
              <input
                id="mp-crew"
                type="text"
                placeholder="Crew A — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("crew")}
              />
              {errors.crew && <p className="mt-1 text-xs text-red-600">{errors.crew.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mp-cert" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Sertifikasi
              </label>
              <input
                id="mp-cert"
                type="text"
                placeholder="Kemnaker Tk. 1 / CISRS"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("certification")}
              />
            </div>

            <div>
              <label htmlFor="mp-exp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Masa Berlaku Sertifikat
              </label>
              <input
                id="mp-exp"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("certExpiry")}
              />
            </div>

            <div>
              <label htmlFor="mp-mob" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tanggal Mobilisasi
              </label>
              <input
                id="mp-mob"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("mobilizationDate")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mp-reg" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Regular Hours Total
              </label>
              <input
                id="mp-reg"
                type="number"
                step="0.5"
                min="0"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("regularHoursTotal", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label htmlFor="mp-ot" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Overtime Hours Total
              </label>
              <input
                id="mp-ot"
                type="number"
                step="0.5"
                min="0"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("overtimeHoursTotal", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label htmlFor="mp-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status Penugasan
              </label>
              <select
                id="mp-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                {manpowerStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {MANPOWER_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mp-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan
            </label>
            <textarea
              id="mp-notes"
              rows={2}
              placeholder="MCU valid, induction safety completed..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("notes")}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Personel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
