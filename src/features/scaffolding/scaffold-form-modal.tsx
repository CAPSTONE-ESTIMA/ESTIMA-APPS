"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LOAD_CLASSES,
  SCAFFOLD_STATUS_META,
  SCAFFOLD_TAG_META,
  SCAFFOLD_TYPES,
  calcScaffoldVolume,
  scaffoldInputSchema,
  scaffoldStatusValues,
  scaffoldTagValues,
  type ScaffoldInput,
  type ScaffoldItem,
} from "./schema";
import { createScaffoldAction, updateScaffoldAction } from "./actions";

interface ScaffoldFormModalProps {
  projectId: string;
  scaffold?: ScaffoldItem | null;
  defaultRequester: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScaffoldFormModal({
  projectId,
  scaffold,
  defaultRequester,
  onClose,
  onSuccess,
}: ScaffoldFormModalProps) {
  const isEdit = Boolean(scaffold);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScaffoldInput>({
    resolver: zodResolver(scaffoldInputSchema),
    defaultValues: scaffold
      ? {
          scaffoldCode: scaffold.scaffoldCode,
          area: scaffold.area,
          location: scaffold.location,
          requester: scaffold.requester,
          purpose: scaffold.purpose ?? "",
          scaffoldType: scaffold.scaffoldType,
          loadClass: scaffold.loadClass,
          lengthM: scaffold.lengthM,
          widthM: scaffold.widthM,
          heightM: scaffold.heightM,
          tagStatus: scaffold.tagStatus,
          status: scaffold.status,
          requiredDate: scaffold.requiredDate ?? "",
          lastInspectionDate: scaffold.lastInspectionDate ?? "",
          nextInspectionDate: scaffold.nextInspectionDate ?? "",
          notes: scaffold.notes ?? "",
        }
      : {
          scaffoldCode: "",
          area: "",
          location: "",
          requester: defaultRequester,
          purpose: "",
          scaffoldType: "Independent",
          loadClass: "Medium (2.0 kN/m²)",
          lengthM: 4,
          widthM: 2,
          heightM: 6,
          tagStatus: "red",
          status: "requested",
          requiredDate: "",
          lastInspectionDate: "",
          nextInspectionDate: "",
          notes: "",
        },
  });

  const [lengthM, widthM, heightM] = useWatch({
    control,
    name: ["lengthM", "widthM", "heightM"],
  });

  const liveVolume =
    Number.isFinite(lengthM) && Number.isFinite(widthM) && Number.isFinite(heightM)
      ? calcScaffoldVolume(lengthM || 0, widthM || 0, heightM || 0)
      : 0;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: ScaffoldInput) {
    setServerError(null);
    const res = scaffold
      ? await updateScaffoldAction(projectId, scaffold.id, values)
      : await createScaffoldAction(projectId, values);

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
      aria-labelledby="scaffold-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Scaffold Register
            </p>
            <h2 id="scaffold-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit Scaffold ${scaffold?.scaffoldCode}` : "Tambah Request / Unit Scaffold"}
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
              <label htmlFor="scf-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Scaffold ID <span className="text-red-500">*</span>
              </label>
              <input
                id="scf-code"
                type="text"
                placeholder="SCF-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("scaffoldCode")}
              />
              {errors.scaffoldCode && <p className="mt-1 text-xs text-red-600">{errors.scaffoldCode.message}</p>}
            </div>

            <div>
              <label htmlFor="scf-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area <span className="text-red-500">*</span>
              </label>
              <input
                id="scf-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>

            <div>
              <label htmlFor="scf-requester" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Requester <span className="text-red-500">*</span>
              </label>
              <input
                id="scf-requester"
                type="text"
                placeholder="Nama Supervisor"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("requester")}
              />
              {errors.requester && <p className="mt-1 text-xs text-red-600">{errors.requester.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="scf-location" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Lokasi Detail <span className="text-red-500">*</span>
              </label>
              <input
                id="scf-location"
                type="text"
                placeholder="Cryogenic Pipe Rack Bay 4 EL +12m"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("location")}
              />
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
            </div>

            <div>
              <label htmlFor="scf-purpose" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tujuan Pekerjaan (Purpose)
              </label>
              <input
                id="scf-purpose"
                type="text"
                placeholder="Cold Insulation & Jacketing"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("purpose")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="scf-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tipe Scaffold <span className="text-red-500">*</span>
              </label>
              <select
                id="scf-type"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("scaffoldType")}
              >
                {SCAFFOLD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scf-load" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Load Class <span className="text-red-500">*</span>
              </label>
              <select
                id="scf-load"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("loadClass")}
              >
                {LOAD_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Dimensi (Meter)
              </span>
              <span className="rounded border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
                Volume: {liveVolume.toLocaleString("id-ID")} m³
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="scf-len" className="mb-1 block text-xs text-slate-600">
                  Panjang (L) *
                </label>
                <input
                  id="scf-len"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("lengthM", { valueAsNumber: true })}
                />
                {errors.lengthM && <p className="mt-1 text-xs text-red-600">{errors.lengthM.message}</p>}
              </div>
              <div>
                <label htmlFor="scf-wid" className="mb-1 block text-xs text-slate-600">
                  Lebar (W) *
                </label>
                <input
                  id="scf-wid"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("widthM", { valueAsNumber: true })}
                />
                {errors.widthM && <p className="mt-1 text-xs text-red-600">{errors.widthM.message}</p>}
              </div>
              <div>
                <label htmlFor="scf-hei" className="mb-1 block text-xs text-slate-600">
                  Tinggi (H) *
                </label>
                <input
                  id="scf-hei"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  {...register("heightM", { valueAsNumber: true })}
                />
                {errors.heightM && <p className="mt-1 text-xs text-red-600">{errors.heightM.message}</p>}
              </div>
            </div>
          </div>

          {/* Lifecycle & Tag Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="scf-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Lifecycle Status
              </label>
              <select
                id="scf-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status", {
                  onChange: (e) => {
                    const next = e.target.value as keyof typeof SCAFFOLD_STATUS_META;
                    if (SCAFFOLD_STATUS_META[next]) {
                      setValue("tagStatus", SCAFFOLD_STATUS_META[next].defaultTag);
                    }
                  },
                })}
              >
                {scaffoldStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {SCAFFOLD_STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scf-tag" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                ScaffTag Status
              </label>
              <select
                id="scf-tag"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("tagStatus")}
              >
                {scaffoldTagValues.map((tag) => (
                  <option key={tag} value={tag}>
                    {SCAFFOLD_TAG_META[tag].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="scf-req-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Required Date
              </label>
              <input
                id="scf-req-date"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("requiredDate")}
              />
            </div>
            <div>
              <label htmlFor="scf-last-insp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Last Inspection
              </label>
              <input
                id="scf-last-insp"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("lastInspectionDate")}
              />
            </div>
            <div>
              <label htmlFor="scf-next-insp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Next Inspection
              </label>
              <input
                id="scf-next-insp"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("nextInspectionDate")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="scf-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan Lapangan / Safety Notes
            </label>
            <textarea
              id="scf-notes"
              rows={2}
              placeholder="Catatan khusus izin kerja, akses, atau hasil inspeksi..."
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
              {isEdit ? "Simpan Perubahan" : "Simpan Scaffold"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
