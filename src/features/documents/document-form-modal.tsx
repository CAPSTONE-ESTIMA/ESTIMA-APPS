"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_CATEGORY_META,
  DOCUMENT_STATUS_META,
  documentCategoryValues,
  documentInputSchema,
  documentStatusValues,
  type DocumentInput,
  type ProjectDocumentItem,
} from "./schema";
import { createDocumentAction, updateDocumentAction } from "./actions";

interface DocumentFormModalProps {
  projectId: string;
  item?: ProjectDocumentItem | null;
  defaultAuthor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentFormModal({
  projectId,
  item,
  defaultAuthor,
  onClose,
  onSuccess,
}: DocumentFormModalProps) {
  const isEdit = Boolean(item);
  const [serverError, setServerError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentInputSchema),
    defaultValues: item
      ? {
          docNumber: item.docNumber,
          title: item.title,
          category: item.category,
          discipline: item.discipline,
          revision: item.revision,
          authorName: item.authorName,
          issueDate: item.issueDate,
          fileUrl: item.fileUrl ?? "",
          status: item.status,
          notes: item.notes ?? "",
        }
      : {
          docNumber: "",
          title: "",
          category: "drawing",
          discipline: "Insulation",
          revision: "Rev 0",
          authorName: defaultAuthor,
          issueDate: today,
          fileUrl: "",
          status: "for_review",
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

  async function onSubmit(values: DocumentInput) {
    setServerError(null);
    const res = item
      ? await updateDocumentAction(projectId, item.id, values)
      : await createDocumentAction(projectId, values);

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
      aria-labelledby="doc-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Document Control Register
            </p>
            <h2 id="doc-modal-title" className="text-lg font-semibold text-foreground">
              {isEdit ? `Edit ${item?.docNumber}` : "Tambah Dokumen Proyek"}
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
              <label htmlFor="doc-num" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Document No. *
              </label>
              <input
                id="doc-num"
                type="text"
                placeholder="DOC-ISO-A42-001"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("docNumber")}
              />
              {errors.docNumber && <p className="mt-1 text-xs text-red-600">{errors.docNumber.message}</p>}
            </div>

            <div>
              <label htmlFor="doc-cat" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Kategori *
              </label>
              <select
                id="doc-cat"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("category")}
              >
                {documentCategoryValues.map((c) => (
                  <option key={c} value={c}>
                    {DOCUMENT_CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-rev" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Revisi *
              </label>
              <input
                id="doc-rev"
                type="text"
                placeholder="Rev 0 / Rev A"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("revision")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="doc-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Judul Dokumen / Drawing *
            </label>
            <input
              id="doc-title"
              type="text"
              placeholder="Isometric Drawing Cryogenic Line 42-PG-1004 & Insulation Spec"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="doc-disc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Disiplin *
              </label>
              <input
                id="doc-disc"
                type="text"
                placeholder="Scaffolding / Insulation / QA/QC"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("discipline")}
              />
            </div>

            <div>
              <label htmlFor="doc-auth" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Document Controller / Author *
              </label>
              <input
                id="doc-auth"
                type="text"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("authorName")}
              />
            </div>

            <div>
              <label htmlFor="doc-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Tanggal Terbit *
              </label>
              <input
                id="doc-date"
                type="date"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("issueDate")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Link File / Drive / Storage (Opsional)
              </label>
              <input
                id="doc-url"
                type="url"
                placeholder="https://drive.google.com/..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("fileUrl")}
              />
            </div>

            <div>
              <label htmlFor="doc-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status Dokumen
              </label>
              <select
                id="doc-status"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                {...register("status")}
              >
                {documentStatusValues.map((st) => (
                  <option key={st} value={st}>
                    {DOCUMENT_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="doc-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Catatan Transmittal / Revisi
            </label>
            <textarea
              id="doc-notes"
              rows={2}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Simpan Dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
