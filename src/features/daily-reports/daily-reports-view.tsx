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
  ClipboardList,
  Sun,
  Moon,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  DAILY_REPORT_STATUS_META,
  WEATHER_LABELS,
  dailyReportStatusValues,
  type DailyReportItem,
  type DailyReportStatus,
} from "./schema";
import { deleteDailyReportAction, updateDailyReportStatusAction } from "./actions";
import { DailyReportFormModal } from "./daily-report-form-modal";

interface DailyReportsViewProps {
  activeProject: ProjectSummary | null;
  reports: DailyReportItem[];
  currentUserName: string;
}

const STATUS_FILTERS: { value: "all" | DailyReportStatus; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function DailyReportsView({
  activeProject,
  reports,
  currentUserName,
}: DailyReportsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DailyReportStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DailyReportItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const totalHours = Number(
      reports.reduce((sum, r) => sum + r.regularHours + r.overtimeHours, 0).toFixed(1)
    );
    const totalOT = Number(reports.reduce((sum, r) => sum + r.overtimeHours, 0).toFixed(1));
    const latestPob = reports[0]?.manpowerCount ?? 0;
    const pendingApproval = reports.filter((r) => r.status === "submitted").length;
    const approvedCount = reports.filter((r) => r.status === "approved").length;

    return {
      total: reports.length,
      totalHours,
      totalOT,
      latestPob,
      pendingApproval,
      approvedCount,
    };
  }, [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.reportCode.toLowerCase().includes(q) ||
        r.reportDate.includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.supervisorName.toLowerCase().includes(q) ||
        r.activitiesSummary.toLowerCase().includes(q)
      );
    });
  }, [reports, search, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Daily Reports
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Daily Progress Reports</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Laporan harian lapangan selalu terikat pada satu proyek aktif.
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

  function handleInlineStatus(item: DailyReportItem, nextStatus: DailyReportStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateDailyReportStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Status laporan ${item.reportCode} diubah menjadi "${DAILY_REPORT_STATUS_META[nextStatus].label}".`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: DailyReportItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus laporan harian ${item.reportCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteDailyReportAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Laporan ${item.reportCode} berhasil dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Daily Reports
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Daily Field Progress Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pencatatan aktivitas harian per shift, POB &amp; manhours, cuaca, kendala lapangan, dan catatan HSE.
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
            Buat Daily Report
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Laporan
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.approvedCount} approved · {stats.pendingApproval} menunggu review
          </p>
        </section>

        <section className="rounded-md border border-blue-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Total Manhours Tercatat
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-blue-700">
            {stats.totalHours.toLocaleString("id-ID")}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Termasuk {stats.totalOT.toLocaleString("id-ID")} hrs overtime
          </p>
        </section>

        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            POB Laporan Terakhir
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.latestPob}</p>
          <p className="mt-2 text-xs text-muted-foreground">Personel aktif di shift terakhir</p>
        </section>

        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Pending Approval
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">
            {stats.pendingApproval}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Menunggu persetujuan PM / Client</p>
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
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. laporan, tanggal, area, supervisor, aktivitas..."
            className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
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
      {reports.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <ClipboardList className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada laporan harian di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Mulai catat daily report per shift untuk merekam jam kerja (manhour), progres pekerjaan lapangan, dan kondisi cuaca/HSE.
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
              Buat Laporan Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada laporan yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
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
                  <th className="px-4 py-3">Report &amp; Tanggal</th>
                  <th className="px-4 py-3">Area &amp; Ringkasan Aktivitas</th>
                  <th className="px-4 py-3">Manpower &amp; Hours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const statusMeta = DAILY_REPORT_STATUS_META[item.status];
                  const totalHrs = Number((item.regularHours + item.overtimeHours).toFixed(1));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.reportCode}
                        </span>
                        <p className="mt-1.5 font-mono text-xs text-slate-700">{item.reportDate}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            {item.shift === "day" ? (
                              <Sun className="size-3 text-amber-500" />
                            ) : (
                              <Moon className="size-3 text-indigo-500" />
                            )}
                            {item.shift === "day" ? "Day" : "Night"}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <CloudRain className="size-3 text-slate-400" />
                            {WEATHER_LABELS[item.weather].split(" ")[0]}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-xl px-4 py-3.5 align-top">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.area}</span>
                          <span>·</span>
                          <span>Supv: {item.supervisorName}</span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-700">{item.activitiesSummary}</p>
                        {item.constraints && (
                          <p className="mt-1.5 flex items-start gap-1 text-xs text-amber-800">
                            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                            <span>Kendala: {item.constraints}</span>
                          </p>
                        )}
                        {item.safetyNotes && (
                          <p className="mt-1 flex items-start gap-1 text-xs text-emerald-700">
                            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                            <span>HSE: {item.safetyNotes}</span>
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs">
                        <p className="font-semibold text-foreground">{item.manpowerCount} Personnel</p>
                        <p className="mt-1 text-slate-600">{totalHrs} hrs total</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Reg {item.regularHours}h · OT {item.overtimeHours}h
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.reportCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as DailyReportStatus)}
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {dailyReportStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {DAILY_REPORT_STATUS_META[st].label}
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
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                setEditing(item);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${item.reportCode}`}
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
                              aria-label={`Hapus ${item.reportCode}`}
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
        <DailyReportFormModal
          key={editing?.id ?? "new-daily-report"}
          projectId={activeProject.id}
          item={editing}
          defaultSupervisor={currentUserName}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Daily report ${editing.reportCode} berhasil diperbarui.`
                : "Daily report baru berhasil disimpan.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
