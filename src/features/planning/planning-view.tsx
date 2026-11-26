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
  CalendarRange,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  PLANNING_DISCIPLINE_META,
  PLANNING_STATUS_META,
  planningStatusValues,
  type PlanningActivityItem,
  type PlanningDiscipline,
  type PlanningStatus,
} from "./schema";
import { deletePlanningAction, updatePlanningStatusAction } from "./actions";
import { PlanningFormModal } from "./planning-form-modal";

interface PlanningViewProps {
  activeProject: ProjectSummary | null;
  activities: PlanningActivityItem[];
}

const DISCIPLINE_FILTERS: { value: "all" | PlanningDiscipline; label: string }[] = [
  { value: "all", label: "Semua Disiplin" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "insulation", label: "Insulation" },
  { value: "qa_qc", label: "QA/QC" },
  { value: "general", label: "General" },
];

export function PlanningView({ activeProject, activities }: PlanningViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"all" | PlanningDiscipline>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanningStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningActivityItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const totalWeight = activities.reduce((sum, a) => sum + a.weightPercent, 0);
    const weightedPlanned =
      totalWeight > 0
        ? Number(
            (
              activities.reduce((sum, a) => sum + a.plannedProgress * a.weightPercent, 0) /
              totalWeight
            ).toFixed(1)
          )
        : 0;
    const weightedActual =
      totalWeight > 0
        ? Number(
            (
              activities.reduce((sum, a) => sum + a.actualProgress * a.weightPercent, 0) /
              totalWeight
            ).toFixed(1)
          )
        : 0;
    const variance = Number((weightedActual - weightedPlanned).toFixed(1));
    const delayedCount = activities.filter(
      (a) => a.status === "delayed" || a.status === "at_risk"
    ).length;
    const completedCount = activities.filter((a) => a.status === "completed").length;

    return {
      total: activities.length,
      weightedPlanned,
      weightedActual,
      variance,
      delayedCount,
      completedCount,
    };
  }, [activities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((item) => {
      if (disciplineFilter !== "all" && item.discipline !== disciplineFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.activityCode.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.workPackage.toLowerCase().includes(q)
      );
    });
  }, [activities, search, disciplineFilter, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Planning &amp; Progress
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Planning &amp; Progress Control</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Jadwal baseline dan kontrol progres S-Curve terikat pada proyek aktif.
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

  const canWrite = ["manager", "planner", "supervisor"].includes(activeProject.role);
  const canDelete = activeProject.role === "manager";

  function handleInlineStatus(item: PlanningActivityItem, nextStatus: PlanningStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updatePlanningStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Status aktivitas ${item.activityCode} diperbarui ke "${PLANNING_STATUS_META[nextStatus].label}".`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: PlanningActivityItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus aktivitas ${item.activityCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deletePlanningAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Aktivitas ${item.activityCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Planning &amp; Progress
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Master Schedule &amp; Progress Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbandingan Baseline (Planned) vs Actual Progress, varians jadwal, bobot work package, dan pelacakan kendala.
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
            Tambah Aktivitas
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weighted Planned vs Actual
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
            {stats.weightedActual}%
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Baseline plan: {stats.weightedPlanned}%
          </p>
        </section>

        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.variance < 0 ? "border-amber-200" : "border-emerald-200"
          )}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Schedule Variance
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.variance < 0 ? "text-amber-700" : "text-emerald-700"
            )}
          >
            {stats.variance > 0 ? `+${stats.variance}%` : `${stats.variance}%`}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.variance < 0 ? "Tertinggal dari baseline" : "Sesuai / lebih cepat dari baseline"}
          </p>
        </section>

        <section className="rounded-md border border-red-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-red-700">
            At Risk / Delayed
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-red-700">{stats.delayedCount}</p>
          <p className="mt-2 text-xs text-muted-foreground">Aktivitas butuh recovery plan</p>
        </section>

        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Completed Activities
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">
            {stats.completedCount}/{stats.total}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Milestone &amp; paket selesai</p>
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
              placeholder="Cari kode, nama aktivitas, area, work package..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter status jadwal"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | PlanningStatus)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Status</option>
            {planningStatusValues.map((st) => (
              <option key={st} value={st}>
                {PLANNING_STATUS_META[st].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {DISCIPLINE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDisciplineFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                disciplineFilter === opt.value
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
      {activities.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <CalendarRange className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada aktivitas master schedule</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan aktivitas baseline beserta bobot dan jadwal target untuk melacak Planned vs Actual progress proyek.
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
              Tambah Aktivitas Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada aktivitas yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDisciplineFilter("all");
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
                  <th className="px-4 py-3">Activity ID</th>
                  <th className="px-4 py-3">Aktivitas &amp; Area</th>
                  <th className="px-4 py-3">Baseline Dates</th>
                  <th className="px-4 py-3">Planned vs Actual</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const discMeta = PLANNING_DISCIPLINE_META[item.discipline];
                  const statusMeta = PLANNING_STATUS_META[item.status];
                  const diff = item.actualProgress - item.plannedProgress;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.activityCode}
                        </span>
                        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                          Wt: {item.weightPercent}%
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                              discMeta.badgeClass
                            )}
                          >
                            {discMeta.label}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {item.workPackage}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.area}</p>
                        {item.constraints && (
                          <p className="mt-1.5 flex items-start gap-1 text-[11px] text-amber-800">
                            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                            <span>{item.constraints}</span>
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs text-slate-600">
                        <p>Plan: {item.plannedStart} → {item.plannedFinish}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Act: {item.actualStart || "—"} → {item.actualFinish || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <div className="w-36 space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-500">P: {item.plannedProgress}%</span>
                            <span className="font-semibold text-foreground">A: {item.actualProgress}%</span>
                            <span className={cn("font-semibold", diff < 0 ? "text-red-600" : "text-emerald-700")}>
                              {diff > 0 ? `+${diff}%` : `${diff}%`}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-400"
                                style={{ width: `${item.plannedProgress}%` }}
                              />
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  item.actualProgress === 100
                                    ? "bg-emerald-500"
                                    : diff < 0
                                    ? "bg-amber-500"
                                    : "bg-blue-600"
                                )}
                                style={{ width: `${item.actualProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.activityCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as PlanningStatus)}
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {planningStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {PLANNING_STATUS_META[st].label}
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
                              aria-label={`Edit ${item.activityCode}`}
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
                              aria-label={`Hapus ${item.activityCode}`}
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
        <PlanningFormModal
          key={editing?.id ?? "new-planning"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Aktivitas ${editing.activityCode} berhasil diperbarui.`
                : "Aktivitas baru berhasil ditambahkan ke master schedule.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
