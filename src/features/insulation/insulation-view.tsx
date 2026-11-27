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
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  INSULATION_STATUS_META,
  INSULATION_TYPE_META,
  INSULATION_UNIT_LABELS,
  insulationStatusValues,
  type InsulationStatus,
  type InsulationType,
  type InsulationWorkItem,
} from "./schema";
import { deleteInsulationAction, updateInsulationStatusAction } from "./actions";
import { InsulationFormModal } from "./insulation-form-modal";

interface InsulationViewProps {
  activeProject: ProjectSummary | null;
  items: InsulationWorkItem[];
}

const TYPE_FILTERS: { value: "all" | InsulationType; label: string }[] = [
  { value: "all", label: "Semua Tipe" },
  { value: "hot", label: "Hot" },
  { value: "cold", label: "Cold" },
  { value: "cryogenic", label: "Cryogenic" },
  { value: "acoustic", label: "Acoustic" },
  { value: "personnel_protection", label: "PP" },
];

export function InsulationView({ activeProject, items }: InsulationViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | InsulationType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InsulationStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InsulationWorkItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const total = items.length;
    const avgProgress =
      total > 0
        ? Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / total)
        : 0;
    const totalM2 = items
      .filter((i) => i.unit === "m2")
      .reduce((sum, i) => sum + i.quantity, 0);
    const qcPending = items.filter((i) => i.status === "qc_inspection").length;
    const punchList = items.filter((i) => i.status === "punch_list").length;
    const completed = items.filter((i) => i.status === "completed").length;

    return {
      total,
      avgProgress,
      totalM2: Number(totalM2.toFixed(1)),
      qcPending,
      punchList,
      completed,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.insulationType !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.workCode.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.workPackage.toLowerCase().includes(q) ||
        item.equipmentOrLine.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.claddingType.toLowerCase().includes(q)
      );
    });
  }, [items, search, typeFilter, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Insulation
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Insulation Work Register</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Work register insulasi selalu terikat pada satu proyek aktif. Buat proyek pertama Anda di modul Projects.
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

  function handleInlineStatusChange(item: InsulationWorkItem, nextStatus: InsulationStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateInsulationStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      const nextMeta = INSULATION_STATUS_META[nextStatus];
      setFeedback({
        type: "success",
        text: `Stage ${item.workCode} diperbarui ke "${nextMeta.label}" (${nextMeta.defaultProgress}%).`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: InsulationWorkItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus work item ${item.workCode}? Aksi ini akan tercatat di audit log.`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteInsulationAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Work item ${item.workCode} berhasil dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Insulation
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Insulation Work Register &amp; Progress Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pelacakan pekerjaan Hot, Cold, Cryogenic, &amp; Acoustic insulation beserta material, cladding, kuantitas, dan tahap QC.
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
            Tambah Work Item
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Work Items
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {stats.totalM2 > 0 ? `${stats.totalM2.toLocaleString("id-ID")} m² terregister` : "Line & equipment terdaftar"}
          </p>
        </section>

        <section className="rounded-md border border-blue-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Rata-rata Progress Fisik
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-blue-700">{stats.avgProgress}%</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </section>

        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            QC Inspection &amp; Punch
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">
            {stats.qcPending + stats.punchList}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.qcPending} QC Inspection · {stats.punchList} Punch List
          </p>
        </section>

        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Completed / Handover
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.completed}</p>
          <p className="mt-2 text-xs text-muted-foreground">Lolos QC &amp; selesai dipasang</p>
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
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline"
          >
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
              placeholder="Cari kode, line number, work package, material..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter progress stage"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | InsulationStatus)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Progress Stage</option>
            {insulationStatusValues.map((st) => (
              <option key={st} value={st}>
                {INSULATION_STATUS_META[st].label}
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
      {items.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Thermometer className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada work item insulasi di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan work item pertama (line number / equipment, material, ketebalan, dan cladding) untuk mulai memantau progres fisik.
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
              Tambah Work Item Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada work item yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
            className="mt-2 text-xs font-medium text-blue-700 hover:underline"
          >
            Reset semua filter
          </button>
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Work Code &amp; WP</th>
                  <th className="px-4 py-3">Equipment / Line &amp; Area</th>
                  <th className="px-4 py-3">Spec &amp; Cladding</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const typeMeta = INSULATION_TYPE_META[item.insulationType];
                  const statusMeta = INSULATION_STATUS_META[item.status];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.workCode}
                        </span>
                        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                          {item.workPackage}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {item.equipmentOrLine}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.area}</p>
                        {item.dimension && (
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.dimension}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                              typeMeta.badgeClass
                            )}
                          >
                            {typeMeta.label}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {item.thicknessMm} mm
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-foreground">{item.material}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.claddingType}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs font-semibold text-foreground">
                        {item.quantity.toLocaleString("id-ID")} {INSULATION_UNIT_LABELS[item.unit]}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <div className="w-24">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="font-semibold text-foreground">{item.progressPercent}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                item.progressPercent === 100
                                  ? "bg-emerald-500"
                                  : item.status === "punch_list"
                                  ? "bg-red-500"
                                  : "bg-blue-600"
                              )}
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah stage ${item.workCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineStatusChange(item, e.target.value as InsulationStatus)
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {insulationStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {INSULATION_STATUS_META[st].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex rounded border px-2 py-0.5 text-xs font-medium",
                              statusMeta.badgeClass
                            )}
                          >
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
                              aria-label={`Edit ${item.workCode}`}
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
                              aria-label={`Hapus ${item.workCode}`}
                              title="Hapus work item"
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
        <InsulationFormModal
          key={editing?.id ?? "new-insulation"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Work item ${editing.workCode} berhasil diperbarui.`
                : "Work item insulasi baru berhasil disimpan.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
