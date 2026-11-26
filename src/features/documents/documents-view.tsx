"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, FolderKanban, ArrowUpRight, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  DOCUMENT_CATEGORY_META,
  DOCUMENT_STATUS_META,
  documentStatusValues,
  type DocumentCategory,
  type DocumentStatus,
  type ProjectDocumentItem,
} from "./schema";
import { deleteDocumentAction, updateDocumentStatusAction } from "./actions";
import { DocumentFormModal } from "./document-form-modal";

interface DocumentsViewProps {
  activeProject: ProjectSummary | null;
  documents: ProjectDocumentItem[];
  currentUserName: string;
}

const CAT_FILTERS: { value: "all" | DocumentCategory; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "drawing", label: "Drawing" },
  { value: "isometric", label: "Isometric" },
  { value: "itp", label: "ITP" },
  { value: "method_statement", label: "Method Statement" },
  { value: "certificate", label: "Certificate" },
  { value: "transmittal", label: "Transmittal" },
];

export function DocumentsView({
  activeProject,
  documents,
  currentUserName,
}: DocumentsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | DocumentCategory>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDocumentItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const approved = documents.filter((d) => d.status === "approved").length;
    const forReview = documents.filter((d) => d.status === "for_review").length;
    const superseded = documents.filter((d) => d.status === "superseded").length;
    return { total: documents.length, approved, forReview, superseded };
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (catFilter !== "all" && d.category !== catFilter) return false;
      if (!q) return true;
      return (
        d.docNumber.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.discipline.toLowerCase().includes(q) ||
        d.authorName.toLowerCase().includes(q)
      );
    });
  }, [documents, search, catFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ESTIMA / Documents</p>
          <h1 className="mt-1.5 text-2xl font-semibold">Document Control</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <Button asChild className="mt-5">
            <Link href="/projects">Buka Modul Projects <ArrowUpRight className="size-4" /></Link>
          </Button>
        </section>
      </div>
    );
  }

  const canWrite = activeProject.role !== "viewer";
  const canDelete = activeProject.role === "manager";

  function handleInlineStatus(item: ProjectDocumentItem, nextStatus: DocumentStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateDocumentStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Status dokumen ${item.docNumber} diperbarui.` });
      router.refresh();
    });
  }

  function handleDelete(item: ProjectDocumentItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus dokumen ${item.docNumber}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteDocumentAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Dokumen ${item.docNumber} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Documents
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Document Control &amp; Revision Register
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengendalian Drawing, Isometric, ITP, Method Statement, sertifikat, transmittal, dan status revisi IFC.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="size-4" />
            Tambah Dokumen
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Dokumen</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 text-xs text-muted-foreground">Terdaftar di master register</p>
        </section>
        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Approved (IFC)</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.approved}</p>
          <p className="mt-2 text-xs text-muted-foreground">Siap pakai untuk konstruksi</p>
        </section>
        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">For Review</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">{stats.forReview}</p>
          <p className="mt-2 text-xs text-muted-foreground">Menunggu review client / QC</p>
        </section>
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Superseded</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.superseded}</p>
          <p className="mt-2 text-xs text-muted-foreground">Revisi lama / digantikan</p>
        </section>
      </div>

      {feedback && (
        <div role="status" className={cn("flex items-center justify-between rounded-md border px-4 py-3 text-sm", feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800")}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs font-medium underline">Tutup</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-4">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. dokumen, judul, disiplin, author..."
            className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CAT_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCatFilter(opt.value)}
              className={cn("rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors", catFilter === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-600 hover:bg-slate-50")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {documents.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FileText className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada dokumen terdaftar di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan Drawing, Isometric, ITP, Method Statement, atau transmittal beserta nomor revisinya.
          </p>
          {canWrite && (
            <Button className="mt-5" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="size-4" />
              Tambah Dokumen Pertama
            </Button>
          )}
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Doc No. &amp; Rev</th>
                  <th className="px-4 py-3">Judul &amp; Kategori</th>
                  <th className="px-4 py-3">Author &amp; Terbit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const catMeta = DOCUMENT_CATEGORY_META[item.category];
                  const statusMeta = DOCUMENT_STATUS_META[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
                          {item.docNumber}
                        </span>
                        <p className="mt-1.5 font-mono text-[11px] font-semibold text-slate-600">
                          {item.revision}
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-3.5 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", catMeta.badgeClass)}>
                            {catMeta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.discipline}</span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">{item.title}</p>
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                          >
                            Buka Lampiran <ExternalLink className="size-3" />
                          </a>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
                        <p className="font-medium text-foreground">{item.authorName}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.issueDate}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.docNumber}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as DocumentStatus)}
                            className={cn("h-8 rounded border px-2 text-xs font-medium focus:outline-none", statusMeta.badgeClass)}
                          >
                            {documentStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {DOCUMENT_STATUS_META[st].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", statusMeta.badgeClass)}>
                            {statusMeta.label}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => { setEditing(item); setModalOpen(true); }} aria-label={`Edit ${item.docNumber}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleDelete(item)} aria-label={`Hapus ${item.docNumber}`}>
                              <Trash2 className="size-3.5 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <DocumentFormModal
          key={editing?.id ?? "new-doc"}
          projectId={activeProject.id}
          item={editing}
          defaultAuthor={currentUserName}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({ type: "success", text: editing ? `Dokumen ${editing.docNumber} diperbarui.` : "Dokumen baru berhasil disimpan." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
