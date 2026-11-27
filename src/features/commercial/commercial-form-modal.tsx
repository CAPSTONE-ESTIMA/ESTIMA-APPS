"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMMERCIAL_STATUS_META,
  COMMERCIAL_TYPE_META,
  commercialInputSchema,
  commercialStatusValues,
  commercialTypeValues,
  formatIdr,
  type CommercialInput,
  type CommercialRecordItem,
} from "./schema";
import { createCommercialAction, updateCommercialAction } from "./actions";

interface CommercialFormModalProps {
  projectId: string;
  item?: CommercialRecordItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommercialFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: CommercialFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommercialInput>({
    resolver: zodResolver(commercialInputSchema),
    defaultValues: item
      ? {
          itemCode: item.itemCode,
          itemType: item.itemType,
          title: item.title,
          workPackage: item.workPackage,
          unit: item.unit,
          quantity: item.quantity,
          unitRateIdr: item.unitRateIdr,
          billedPercent: item.billedPercent,
          status: item.status,
          notes: item.notes ?? "",
        }
      : {
          itemCode: "",
          itemType: "boq",
          title: "",
          workPackage: "WP-001",
          unit: "m2",
          quantity: 100,
          unitRateIdr: 250000,
          billedPercent: 0,
          status: "draft",
          notes: "",
        },
  });

  const [qty, rate] = useWatch({ control, name: ["quantity", "unitRateIdr"] });
  const totalValue = (qty || 0) * (rate || 0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: CommercialInput) {
    setServerError(null);
    const res = item
      ? await updateCommercialAction(projectId, item.id, values)
      : await createCommercialAction(projectId, values);

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
      aria-labelledby="com-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Commercial &amp; Cost Control
            </p>
            <h2 id="com-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit ${item?.itemCode}` : "Tambah Item Commercial / BOQ / VO"}
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
              <label htmlFor="com-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Kode Item *
              </label>
              <input
                id="com-code"
                type="text"
                placeholder="BOQ-INS-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("itemCode")}
              />
              {errors.itemCode && <p className="mt-1 text-xs text-red-600">{errors.itemCode.message}</p>}
            </div>

            <div>
              <label htmlFor="com-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tipe *
              </label>
              <select
                id="com-type"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("itemType")}
              >
                {commercialTypeValues.map((t) => (
                  <option key={t} value={t}>
                    {COMMERCIAL_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="com-wp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Work Package *
              </label>
              <input
                id="com-wp"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("workPackage")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="com-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Deskripsi Item / Kontrak *
            </label>
            <input
              id="com-title"
              type="text"
              placeholder="Supply & Install Cold Insulation Aerogel 50mm Pipe Rack Area 42"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Valuasi Kontrak (IDR)
              </span>
              <span className="rounded border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-900">
                Total: {formatIdr(totalValue)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="com-qty" className="mb-1 block text-xs text-slate-600">Quantity *</label>
                <input id="com-qty" type="number" step="0.1" min="0.1" className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none" {...register("quantity", { valueAsNumber: true })} />
              </div>
              <div>
                <label htmlFor="com-unit" className="mb-1 block text-xs text-slate-600">Satuan *</label>
                <input id="com-unit" type="text" placeholder="m2 / m3 / ls" className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none" {...register("unit")} />
              </div>
              <div>
                <label htmlFor="com-rate" className="mb-1 block text-xs text-slate-600">Unit Rate (IDR) *</label>
                <input id="com-rate" type="number" step="1000" min="0" className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none" {...register("unitRateIdr", { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="com-bill" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Progress Billed (%)
              </label>
              <input id="com-bill" type="number" min="0" max="100" className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none" {...register("billedPercent", { valueAsNumber: true })} />
            </div>
            <div>
              <label htmlFor="com-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status
              </label>
              <select id="com-status" className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none" {...register("status")}>
                {commercialStatusValues.map((st) => (
                  <option key={st} value={st}>{COMMERCIAL_STATUS_META[st].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="com-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan / Referensi Invoice
            </label>
            <textarea id="com-notes" rows={2} className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none" {...register("notes")} />
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800" role="alert">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Simpan Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
