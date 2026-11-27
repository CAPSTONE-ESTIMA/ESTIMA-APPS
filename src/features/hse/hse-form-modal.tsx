"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HSE_SEVERITY_META,
  HSE_STATUS_META,
  HSE_TYPE_META,
  hseInputSchema,
  hseRecordTypeValues,
  hseSeverityValues,
  hseStatusValues,
  type HseInput,
  type HseRecordItem,
} from "./schema";
import { createHseAction, updateHseAction } from "./actions";

interface HseFormModalProps {
  projectId: string;
  item?: HseRecordItem | null;
  defaultPic: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function HseFormModal({
  projectId,
  item,
  defaultPic,
  onClose,
  onSuccess,
}: HseFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HseInput>({
    resolver: zodResolver(hseInputSchema),
    defaultValues: item
      ? {
          recordCode: item.recordCode,
          recordType: item.recordType,
          recordDate: item.recordDate,
          area: item.area,
          title: item.title,
          picName: item.picName,
          attendeesCount: item.attendeesCount,
          severity: item.severity,
          status: item.status,
          details: item.details ?? "",
        }
      : {
          recordCode: "",
          recordType: "tbt",
          recordDate: today,
          area: "",
          title: "",
          picName: defaultPic,
          attendeesCount: 15,
          severity: "info",
          status: "closed",
          details: "",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: HseInput) {
    setServerError(null);
    const res = item
      ? await updateHseAction(projectId, item.id, values)
      : await createHseAction(projectId, values);

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
      aria-labelledby="hse-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              HSE &amp; Safety Control
            </p>
            <h2 id="hse-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit ${item?.recordCode}` : "Tambah Catatan HSE"}
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
              <label htmlFor="hse-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                No. Dokumen HSE *
              </label>
              <input
                id="hse-code"
                type="text"
                placeholder="HSE-TBT-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("recordCode")}
              />
              {errors.recordCode && <p className="mt-1 text-xs text-red-600">{errors.recordCode.message}</p>}
            </div>

            <div>
              <label htmlFor="hse-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tipe Catatan *
              </label>
              <select
                id="hse-type"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("recordType")}
              >
                {hseRecordTypeValues.map((t) => (
                  <option key={t} value={t}>
                    {HSE_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hse-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tanggal *
              </label>
              <input
                id="hse-date"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("recordDate")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="hse-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Topik / Judul *
            </label>
            <input
              id="hse-title"
              type="text"
              placeholder="Working at Height & Full Body Harness Check — Area 42"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="hse-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area *
              </label>
              <input
                id="hse-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="hse-pic" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                HSE Officer / PIC *
              </label>
              <input
                id="hse-pic"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("picName")}
              />
              {errors.picName && <p className="mt-1 text-xs text-red-600">{errors.picName.message}</p>}
            </div>

            <div>
              <label htmlFor="hse-att" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Peserta (TBT)
              </label>
              <input
                id="hse-att"
                type="number"
                min="0"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("attendeesCount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hse-sev" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Severity / Risk Level
              </label>
              <select
                id="hse-sev"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("severity")}
              >
                {hseSeverityValues.map((s) => (
                  <option key={s} value={s}>
                    {HSE_SEVERITY_META[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hse-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status
              </label>
              <select
                id="hse-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                {hseStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {HSE_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="hse-det" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Detail / Tindakan Pencegahan
            </label>
            <textarea
              id="hse-det"
              rows={2}
              placeholder="Detail observasi, nomor PTW, atau tindakan perbaikan keselamatan..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("details")}
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
              {isEdit ? "Simpan Perubahan" : "Simpan Catatan HSE"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
