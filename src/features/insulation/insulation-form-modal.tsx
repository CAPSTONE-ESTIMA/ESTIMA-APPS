"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INSULATION_STATUS_META,
  INSULATION_TYPE_META,
  INSULATION_UNIT_LABELS,
  insulationInputSchema,
  insulationStatusValues,
  insulationTypeValues,
  insulationUnitValues,
  type InsulationInput,
  type InsulationWorkItem,
} from "./schema";
import { createInsulationAction, updateInsulationAction } from "./actions";

interface InsulationFormModalProps {
  projectId: string;
  item?: InsulationWorkItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function InsulationFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: InsulationFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InsulationInput>({
    resolver: zodResolver(insulationInputSchema),
    defaultValues: item
      ? {
          workCode: item.workCode,
          area: item.area,
          workPackage: item.workPackage,
          equipmentOrLine: item.equipmentOrLine,
          insulationType: item.insulationType,
          material: item.material,
          thicknessMm: item.thicknessMm,
          claddingType: item.claddingType,
          dimension: item.dimension ?? "",
          quantity: item.quantity,
          unit: item.unit,
          status: item.status,
          progressPercent: item.progressPercent,
          notes: item.notes ?? "",
        }
      : {
          workCode: "",
          area: "",
          workPackage: "",
          equipmentOrLine: "",
          insulationType: "hot",
          material: "Rockwool 100kg/m³",
          thicknessMm: 50,
          claddingType: "Aluminum Jacketing 0.8mm",
          dimension: "",
          quantity: 10,
          unit: "m2",
          status: "not_started",
          progressPercent: 0,
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

  async function onSubmit(values: InsulationInput) {
    setServerError(null);
    const res = item
      ? await updateInsulationAction(projectId, item.id, values)
      : await createInsulationAction(projectId, values);

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
      aria-labelledby="insulation-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Insulation Work Register
            </p>
            <h2 id="insulation-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Work Item ${item?.workCode}` : "Tambah Work Item Insulasi"}
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
              <label htmlFor="ins-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Work Item Code <span className="text-red-500">*</span>
              </label>
              <input
                id="ins-code"
                type="text"
                placeholder="INS-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("workCode")}
              />
              {errors.workCode && <p className="mt-1 text-xs text-red-600">{errors.workCode.message}</p>}
            </div>

            <div>
              <label htmlFor="ins-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area <span className="text-red-500">*</span>
              </label>
              <input
                id="ins-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="ins-wp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Work Package <span className="text-red-500">*</span>
              </label>
              <input
                id="ins-wp"
                type="text"
                placeholder="WP-INS-012"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("workPackage")}
              />
              {errors.workPackage && <p className="mt-1 text-xs text-red-600">{errors.workPackage.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ins-equip" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Equipment / Line Number <span className="text-red-500">*</span>
              </label>
              <input
                id="ins-equip"
                type="text"
                placeholder='LINE-42-PG-1004-12" / Vessel V-4201'
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("equipmentOrLine")}
              />
              {errors.equipmentOrLine && <p className="mt-1 text-xs text-red-600">{errors.equipmentOrLine.message}</p>}
            </div>

            <div>
              <label htmlFor="ins-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Insulation Type <span className="text-red-500">*</span>
              </label>
              <select
                id="ins-type"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("insulationType")}
              >
                {insulationTypeValues.map((type) => (
                  <option key={type} value={type}>
                    {INSULATION_TYPE_META[type].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technical Spec */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Spesifikasi Teknis &amp; Material
            </span>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="ins-mat" className="mb-1 block text-xs text-slate-600">
                  Material Insulasi *
                </label>
                <input
                  id="ins-mat"
                  type="text"
                  placeholder="Pyrogel XTE / Rockwool"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                  {...register("material")}
                />
                {errors.material && <p className="mt-1 text-xs text-red-600">{errors.material.message}</p>}
              </div>

              <div>
                <label htmlFor="ins-thick" className="mb-1 block text-xs text-slate-600">
                  Thickness (mm) *
                </label>
                <input
                  id="ins-thick"
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("thicknessMm", { valueAsNumber: true })}
                />
                {errors.thicknessMm && <p className="mt-1 text-xs text-red-600">{errors.thicknessMm.message}</p>}
              </div>

              <div>
                <label htmlFor="ins-clad" className="mb-1 block text-xs text-slate-600">
                  Cladding / Jacketing *
                </label>
                <input
                  id="ins-clad"
                  type="text"
                  placeholder="SS 304 0.5mm / Alu 0.8mm"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                  {...register("claddingType")}
                />
                {errors.claddingType && <p className="mt-1 text-xs text-red-600">{errors.claddingType.message}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="ins-dim" className="mb-1 block text-xs text-slate-600">
                  Dimensi / Pipe Size
                </label>
                <input
                  id="ins-dim"
                  type="text"
                  placeholder='12" Pipe / Ø323mm'
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                  {...register("dimension")}
                />
              </div>

              <div>
                <label htmlFor="ins-qty" className="mb-1 block text-xs text-slate-600">
                  Quantity *
                </label>
                <input
                  id="ins-qty"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
              </div>

              <div>
                <label htmlFor="ins-unit" className="mb-1 block text-xs text-slate-600">
                  Unit *
                </label>
                <select
                  id="ins-unit"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                  {...register("unit")}
                >
                  {insulationUnitValues.map((u) => (
                    <option key={u} value={u}>
                      {INSULATION_UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Progress Stage */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ins-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Progress Stage
              </label>
              <select
                id="ins-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status", {
                  onChange: (e) => {
                    const next = e.target.value as keyof typeof INSULATION_STATUS_META;
                    if (INSULATION_STATUS_META[next]) {
                      setValue("progressPercent", INSULATION_STATUS_META[next].defaultProgress);
                    }
                  },
                })}
              >
                {insulationStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {INSULATION_STATUS_META[st].label} ({INSULATION_STATUS_META[st].defaultProgress}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ins-progress" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Physical Progress (%)
              </label>
              <input
                id="ins-progress"
                type="number"
                min="0"
                max="100"
                step="1"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("progressPercent", { valueAsNumber: true })}
              />
              {errors.progressPercent && (
                <p className="mt-1 text-xs text-red-600">{errors.progressPercent.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="ins-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan QC / Lapangan
            </label>
            <textarea
              id="ins-notes"
              rows={2}
              placeholder="Catatan hasil inspeksi permukaan, vapor barrier, atau punch item..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
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
              {isEdit ? "Simpan Perubahan" : "Simpan Work Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
