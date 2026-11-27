"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderKanban,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  QA_CLIENT_APPROVAL_META,
  QA_DISCIPLINE_META,
  QA_RESULT_META,
  qaClientApprovalValues,
  qaResultValues,
  type QaClientApproval,
  type QaInspectionItem,
  type QaRecordType,
  type QaResult,
} from "./schema";
import { deleteQaAction, updateQaResultAction } from "./actions";
import { QaFormModal } from "./qa-form-modal";

interface QualityViewProps {
  activeProject: ProjectSummary | null;
  records: QaInspectionItem[];
  currentUserName: string;
}

const TYPE_FILTERS: { value: "all" | QaRecordType; label: string }[] = [
  { value: "all", label: "Semua (RFI & NCR)" },
  { value: "inspection", label: "Inspection (RFI)" },
  { value: "ncr", label: "NCR Only" },
];

export function QualityView({
  activeProject,
  records,
  currentUserName,
}: QualityViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | QaRecordType>("all");
  const [resultFilter, setResultFilter] = useState<"all" | QaResult>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QaInspectionItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const passed = records.filter((r) => r.result === "passed").length;
    const pending = records.filter(
      (r) => r.result === "pending" || r.result === "re_inspection"
    ).length;
    const ncrOpen = records.filter(
      (r) => (r.recordType === "ncr" || r.result === "failed") && r.result !== "passed"
    ).length;
    const passRate = records.length > 0 ? Math.round((passed / records.length) * 100) : 0;

    return {
      total: records.length,
      passed,
      pending,
      ncrOpen,
      passRate,
    };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "all" && r.recordType !== typeFilter) return false;
      if (resultFilter !== "all" && r.result !== resultFilter) return false;
      if (!q) return true;
      return (
        r.inspectionCode.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.referenceCode.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.inspectorName.toLowerCase().includes(q)
      );
    });
  }, [records, search, typeFilter, resultFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / QA/QC
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">QA/QC Inspection &amp; NCR</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Data inspeksi QA/QC dan NCR terikat pada proyek aktif.
          </p>
          <Button asChild className="mt-5">
            <Link href="/projects">
              Buka Modul Projects <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  const canWrite = activeProject.role !== "viewer";
  const canDelete = activeProject.role === "manager";

  function handleInlineUpdate(
    item: QaInspectionItem,
    nextResult: QaResult,
    nextApproval?: QaClientApproval
  ) {
    if (!activeProject) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateQaResultAction(activeProject.id, item.id, nextResult, nextApproval);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Status QA/QC ${item.inspectionCode} diperbarui.`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: QaInspectionItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus dokumen ${item.inspectionCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteQaAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Dokumen ${item.inspectionCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / QA/QC
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            QA/QC Inspection Register &amp; NCR Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola Request for Inspection (RFI), Non-Conformance Report (NCR), hasil verifikasi inspector, dan Client Approval.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah RFI / NCR
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Inspeksi &amp; NCR
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Pass Rate: {stats.passRate}%
          </p>
        </section>

        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Passed / Accepted
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.passed}</p>
          <p className="mt-2 text-xs text-muted-foreground">Memenuhi standar kualitas &amp; ITP</p>
        </section>

        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Pending / Re-inspection
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">{stats.pending}</p>
          <p className="mt-2 text-xs text-muted-foreground">Menunggu jadwal witness / verifikasi</p>
        </section>

        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.ncrOpen > 0 ? "border-red-200" : "border-border"
          )}
        >
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              stats.ncrOpen > 0 ? "text-red-700" : "text-muted-foreground"
            )}
          >
            Open NCR / Failed
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.ncrOpen > 0 ? "text-red-700" : "text-foreground"
            )}
          >
            {stats.ncrOpen}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Membutuhkan corrective action</p>
        </section>
      </div>

      {feedback && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between rounded-md border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs font-medium underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari RFI/NCR no., judul, ref unit, area, inspector..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter result QA"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as "all" | QaResult)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Result</option>
            {qaResultValues.map((r) => (
              <option key={r} value={r}>
                {QA_RESULT_META[r].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                typeFilter === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty State */}
      {records.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada catatan inspeksi QA/QC</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Buat Inspection Request (RFI) atau Non-Conformance Report (NCR) untuk memastikan kepatuhan standar proyek.
          </p>
          {canWrite && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              Buat RFI / NCR Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada data QA/QC yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setResultFilter("all");
            }}
            className="mt-2 text-xs font-medium text-blue-700 hover:underline"
          >
            Reset filter
          </button>
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">RFI / NCR No.</th>
                  <th className="px-4 py-3">Judul &amp; Referensi</th>
                  <th className="px-4 py-3">Inspector &amp; Tanggal</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Client Approval</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const discMeta = QA_DISCIPLINE_META[item.discipline];
                  const resMeta = QA_RESULT_META[item.result];
                  const cliMeta = QA_CLIENT_APPROVAL_META[item.clientApproval];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                            {item.inspectionCode}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                              item.recordType === "ncr"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {item.recordType === "ncr" ? "NCR" : "RFI"}
                          </span>
                        </div>
                        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                          Ref: {item.referenceCode}
                        </p>
                      </td>

                      <td className="max-w-md px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                            discMeta.badgeClass
                          )}
                        >
                          {discMeta.label}
                        </span>
                        <p className="mt-1 font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.area}</p>
                        {item.findings && (
                          <p className="mt-1 text-xs text-slate-600">Temuan: {item.findings}</p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
                        <p className="font-medium text-foreground">{item.inspectorName}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {item.inspectionDate}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah result ${item.inspectionCode}`}
                            value={item.result}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineUpdate(item, e.target.value as QaResult, item.clientApproval)
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              resMeta.badgeClass
                            )}
                          >
                            {qaResultValues.map((r) => (
                              <option key={r} value={r} className="bg-white text-slate-900">
                                {QA_RESULT_META[r].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", resMeta.badgeClass)}>
                            {resMeta.label}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Client approval ${item.inspectionCode}`}
                            value={item.clientApproval}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineUpdate(
                                item,
                                item.result,
                                e.target.value as QaClientApproval
                              )
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              cliMeta.badgeClass
                            )}
                          >
                            {qaClientApprovalValues.map((c) => (
                              <option key={c} value={c} className="bg-white text-slate-900">
                                {QA_CLIENT_APPROVAL_META[c].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", cliMeta.badgeClass)}>
                            {cliMeta.label}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                setEditing(item);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${item.inspectionCode}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleDelete(item)}
                              aria-label={`Hapus ${item.inspectionCode}`}
                            >
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
        <QaFormModal
          key={editing?.id ?? "new-qa"}
          projectId={activeProject.id}
          item={editing}
          defaultInspector={currentUserName}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Dokumen ${editing.inspectionCode} berhasil diperbarui.`
                : "Dokumen QA/QC baru berhasil disimpan.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
