"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  QA_CLIENT_APPROVAL_META,
  QA_DISCIPLINE_META,
  QA_RESULT_META,
  qaClientApprovalValues,
  qaDisciplineValues,
  qaInputSchema,
  qaResultValues,
  type QaInput,
  type QaInspectionItem,
} from "./schema";
import { createQaAction, updateQaAction } from "./actions";

interface QaFormModalProps {
  projectId: string;
  item?: QaInspectionItem | null;
  defaultInspector: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QaFormModal({
  projectId,
  item,
  defaultInspector,
  onClose,
  onSuccess,
}: QaFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QaInput>({
    resolver: zodResolver(qaInputSchema),
    defaultValues: item
      ? {
          inspectionCode: item.inspectionCode,
          recordType: item.recordType,
          discipline: item.discipline,
          referenceCode: item.referenceCode,
          area: item.area,
          title: item.title,
          inspectorName: item.inspectorName,
          inspectionDate: item.inspectionDate,
          result: item.result,
          clientApproval: item.clientApproval,
          findings: item.findings ?? "",
          correctiveAction: item.correctiveAction ?? "",
        }
      : {
          inspectionCode: "",
          recordType: "inspection",
          discipline: "scaffolding",
          referenceCode: "",
          area: "",
          title: "",
          inspectorName: defaultInspector,
          inspectionDate: today,
          result: "pending",
          clientApproval: "pending",
          findings: "",
          correctiveAction: "",
        },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  async function onSubmit(values: QaInput) {
    setServerError(null);
    const res = item
      ? await updateQaAction(projectId, item.id, values)
      : await createQaAction(projectId, values);

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
      aria-labelledby="qa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              QA/QC Inspection &amp; NCR
            </p>
            <h2 id="qa-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit ${item?.inspectionCode}` : "Tambah Inspection Request / NCR"}
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
              <label htmlFor="qa-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                RFI / NCR No. *
              </label>
              <input
                id="qa-code"
                type="text"
                placeholder="RFI-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("inspectionCode")}
              />
              {errors.inspectionCode && <p className="mt-1 text-xs text-red-600">{errors.inspectionCode.message}</p>}
            </div>

            <div>
              <label htmlFor="qa-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Jenis Dokumen *
              </label>
              <select
                id="qa-type"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("recordType")}
              >
                <option value="inspection">Inspection Request (RFI)</option>
                <option value="ncr">Non-Conformance Report (NCR)</option>
              </select>
            </div>

            <div>
              <label htmlFor="qa-disc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Discipline *
              </label>
              <select
                id="qa-disc"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("discipline")}
              >
                {qaDisciplineValues.map((d) => (
                  <option key={d} value={d}>
                    {QA_DISCIPLINE_META[d].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qa-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Judul Inspeksi / Temuan *
            </label>
            <input
              id="qa-title"
              type="text"
              placeholder="Pre-use Scaffold Safety Inspection — Pipe Rack Bay 4"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="qa-ref" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Ref Unit / Line Number *
              </label>
              <input
                id="qa-ref"
                type="text"
                placeholder="SCF-A42-001 / INS-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("referenceCode")}
              />
              {errors.referenceCode && <p className="mt-1 text-xs text-red-600">{errors.referenceCode.message}</p>}
            </div>

            <div>
              <label htmlFor="qa-area" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Area *
              </label>
              <input
                id="qa-area"
                type="text"
                placeholder="Train 3 — Area 42"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("area")}
              />
              {errors.area && <p className="mt-1 text-xs text-red-600">{errors.area.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="qa-insp" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                QA/QC Inspector *
              </label>
              <input
                id="qa-insp"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("inspectorName")}
              />
              {errors.inspectorName && <p className="mt-1 text-xs text-red-600">{errors.inspectorName.message}</p>}
            </div>

            <div>
              <label htmlFor="qa-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tanggal Inspeksi *
              </label>
              <input
                id="qa-date"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("inspectionDate")}
              />
              {errors.inspectionDate && <p className="mt-1 text-xs text-red-600">{errors.inspectionDate.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="qa-res" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Inspection Result
              </label>
              <select
                id="qa-res"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("result")}
              >
                {qaResultValues.map((r) => (
                  <option key={r} value={r}>
                    {QA_RESULT_META[r].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qa-client" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Client Approval
              </label>
              <select
                id="qa-client"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("clientApproval")}
              >
                {qaClientApprovalValues.map((c) => (
                  <option key={c} value={c}>
                    {QA_CLIENT_APPROVAL_META[c].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qa-find" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Temuan / Root Cause (Checklist Notes)
            </label>
            <textarea
              id="qa-find"
              rows={2}
              placeholder="Hasil pemeriksaan visual, overlapping cladding, vapor barrier, atau deviasi standar..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("findings")}
            />
          </div>

          <div>
            <label htmlFor="qa-act" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Corrective / Preventive Action
            </label>
            <textarea
              id="qa-act"
              rows={2}
              placeholder="Tindakan perbaikan yang disepakati sebelum re-inspection..."
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
              {isEdit ? "Simpan Perubahan" : "Simpan Inspeksi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
