"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MATERIAL_CATEGORY_META,
  MATERIAL_LIFECYCLE_META,
  MATERIAL_UNITS,
  materialCategoryValues,
  materialInputSchema,
  materialLifecycleValues,
  type MaterialInput,
  type MaterialItem,
} from "./schema";
import { createMaterialAction, updateMaterialAction } from "./actions";

interface MaterialFormModalProps {
  projectId: string;
  item?: MaterialItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: MaterialFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaterialInput>({
    resolver: zodResolver(materialInputSchema),
    defaultValues: item
      ? {
          materialCode: item.materialCode,
          name: item.name,
          category: item.category,
          warehouse: item.warehouse,
          unit: item.unit,
          stockAvailable: item.stockAvailable,
          stockReserved: item.stockReserved,
          stockIssued: item.stockIssued,
          minStock: item.minStock,
          lifecycleStatus: item.lifecycleStatus,
          notes: item.notes ?? "",
        }
      : {
          materialCode: "",
          name: "",
          category: "insulation",
          warehouse: "Main Laydown Yard A",
          unit: "m2",
          stockAvailable: 100,
          stockReserved: 0,
          stockIssued: 0,
          minStock: 20,
          lifecycleStatus: "available",
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

  async function onSubmit(values: MaterialInput) {
    setServerError(null);
    const res = item
      ? await updateMaterialAction(projectId, item.id, values)
      : await createMaterialAction(projectId, values);

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
      aria-labelledby="mat-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Material &amp; Warehouse Inventory
            </p>
            <h2 id="mat-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Material ${item?.materialCode}` : "Tambah Material Baru"}
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
              <label htmlFor="mat-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Material Code *
              </label>
              <input
                id="mat-code"
                type="text"
                placeholder="MAT-RW-050"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("materialCode")}
              />
              {errors.materialCode && <p className="mt-1 text-xs text-red-600">{errors.materialCode.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="mat-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Nama Material / Spesifikasi *
              </label>
              <input
                id="mat-name"
                type="text"
                placeholder="Rockwool Blanket 50mm 100kg/m³"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mat-cat" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Kategori *
              </label>
              <select
                id="mat-cat"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("category")}
              >
                {materialCategoryValues.map((c) => (
                  <option key={c} value={c}>
                    {MATERIAL_CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mat-wh" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Warehouse / Laydown *
              </label>
              <input
                id="mat-wh"
                type="text"
                placeholder="Main Laydown Yard A"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("warehouse")}
              />
              {errors.warehouse && <p className="mt-1 text-xs text-red-600">{errors.warehouse.message}</p>}
            </div>

            <div>
              <label htmlFor="mat-unit" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Satuan (Unit) *
              </label>
              <select
                id="mat-unit"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("unit")}
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Balance */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Stock Balance &amp; Reorder Threshold
            </span>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label htmlFor="mat-avail" className="mb-1 block text-xs text-slate-600">
                  Available *
                </label>
                <input
                  id="mat-avail"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("stockAvailable", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="mat-res" className="mb-1 block text-xs text-slate-600">
                  Reserved
                </label>
                <input
                  id="mat-res"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("stockReserved", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="mat-iss" className="mb-1 block text-xs text-slate-600">
                  Issued
                </label>
                <input
                  id="mat-iss"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("stockIssued", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="mat-min" className="mb-1 block text-xs text-slate-600">
                  Min. Stock Alert *
                </label>
                <input
                  id="mat-min"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("minStock", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="max-w-xs">
            <label htmlFor="mat-life" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Material Lifecycle Status
            </label>
            <select
              id="mat-life"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("lifecycleStatus")}
            >
              {materialLifecycleValues.map((lc) => (
                <option key={lc} value={lc}>
                  {MATERIAL_LIFECYCLE_META[lc].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mat-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan Warehouse / PO Ref
            </label>
            <textarea
              id="mat-notes"
              rows={2}
              placeholder="PO-2026-0412 / Lokasi rak B-04 / Batch certificate terverifikasi..."
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
              {isEdit ? "Simpan Perubahan" : "Simpan Material"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
