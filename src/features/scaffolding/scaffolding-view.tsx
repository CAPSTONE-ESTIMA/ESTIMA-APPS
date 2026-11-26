"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  FolderKanban,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  SCAFFOLD_STATUS_META,
  SCAFFOLD_TAG_META,
  calcScaffoldVolume,
  scaffoldStatusValues,
  type ScaffoldItem,
  type ScaffoldStatus,
  type ScaffoldTagStatus,
} from "./schema";
import { deleteScaffoldAction, updateScaffoldStatusAction } from "./actions";
import { ScaffoldFormModal } from "./scaffold-form-modal";

interface ScaffoldingViewProps {
  activeProject: ProjectSummary | null;
  scaffolds: ScaffoldItem[];
  currentUserName: string;
}

const TAG_FILTERS: { value: "all" | ScaffoldTagStatus; label: string }[] = [
  { value: "all", label: "Semua Tag" },
  { value: "green", label: "Green (Ready)" },
  { value: "yellow", label: "Yellow (Erect/Mod)" },
  { value: "red", label: "Red (Hold/Insp)" },
  { value: "none", label: "Closed / None" },
];

export function ScaffoldingView({
  activeProject,
  scaffolds,
  currentUserName,
}: ScaffoldingViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<"all" | ScaffoldTagStatus>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ScaffoldStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScaffoldItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const activeUnits = scaffolds.filter((s) => s.status !== "closed");
    const totalVolume = activeUnits.reduce(
      (sum, s) => sum + calcScaffoldVolume(s.lengthM, s.widthM, s.heightM),
      0
    );
    return {
      total: scaffolds.length,
      totalVolume: Number(totalVolume.toFixed(1)),
      green: scaffolds.filter((s) => s.tagStatus === "green").length,
      yellow: scaffolds.filter((s) => s.tagStatus === "yellow").length,
      red: scaffolds.filter((s) => s.tagStatus === "red").length,
      pendingInsp: scaffolds.filter(
        (s) => s.status === "ready_for_inspection" || s.status === "re_inspection"
      ).length,
    };
  }, [scaffolds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scaffolds.filter((item) => {
      if (tagFilter !== "all" && item.tagStatus !== tagFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.scaffoldCode.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.requester.toLowerCase().includes(q) ||
        item.scaffoldType.toLowerCase().includes(q)
      );
    });
  }, [scaffolds, search, tagFilter, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Scaffolding
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Scaffolding Register</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Data scaffolding selalu terikat pada satu proyek aktif. Buat proyek pertama Anda di modul Projects.
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

  function handleInlineStatusChange(item: ScaffoldItem, nextStatus: ScaffoldStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateScaffoldStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      const nextMeta = SCAFFOLD_STATUS_META[nextStatus];
      setFeedback({
        type: "success",
        text: `Status ${item.scaffoldCode} diubah ke "${nextMeta.label}" (Tag: ${SCAFFOLD_TAG_META[nextMeta.defaultTag].shortLabel}).`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: ScaffoldItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus unit scaffold ${item.scaffoldCode}? Aksi ini dicatat di audit log.`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteScaffoldAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Unit ${item.scaffoldCode} berhasil dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Scaffolding
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Scaffolding Register &amp; ScaffTag Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kontrol permintaan, erection, status ScaffTag (Green/Yellow/Red), dimensi volume, dan siklus inspeksi.
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
            Tambah Scaffold
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Unit &amp; Volume Aktif
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {stats.totalVolume.toLocaleString("id-ID")} m³ standing volume
          </p>
        </section>

        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            Green Tag (Ready)
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.green}</p>
          <p className="mt-2 text-xs text-muted-foreground">Aman &amp; siap digunakan pekerja</p>
        </section>

        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <span className="size-2 rounded-full bg-amber-500" />
            Yellow Tag (Erect / Mod)
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">{stats.yellow}</p>
          <p className="mt-2 text-xs text-muted-foreground">Sedang perakitan atau modifikasi</p>
        </section>

        <section className="rounded-md border border-red-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-700">
            <span className="size-2 rounded-full bg-red-500" />
            Red Tag / Pending Insp
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-red-700">{stats.red}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.pendingInsp} menunggu inspeksi inspector
          </p>
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
              placeholder="Cari Scaffold ID, area, lokasi, requester..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter lifecycle status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ScaffoldStatus)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Lifecycle Status</option>
            {scaffoldStatusValues.map((s) => (
              <option key={s} value={s}>
                {SCAFFOLD_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TAG_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTagFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                tagFilter === opt.value
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
      {scaffolds.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Layers className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada unit scaffolding di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Mulai catat permintaan scaffolding pertama untuk memantau volume, status ScaffTag, dan jadwal inspeksi 7 harian.
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
              Tambah Scaffold Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada unit scaffold yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTagFilter("all");
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
                  <th className="px-4 py-3">Scaffold ID</th>
                  <th className="px-4 py-3">Area &amp; Lokasi</th>
                  <th className="px-4 py-3">Dimensi &amp; Tipe</th>
                  <th className="px-4 py-3">ScaffTag</th>
                  <th className="px-4 py-3">Lifecycle Status</th>
                  <th className="px-4 py-3">Inspeksi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const tagMeta = SCAFFOLD_TAG_META[item.tagStatus];
                  const statusMeta = SCAFFOLD_STATUS_META[item.status];
                  const vol = calcScaffoldVolume(item.lengthM, item.widthM, item.heightM);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.scaffoldCode}
                        </span>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Req: {item.requester}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-foreground">{item.area}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0 text-slate-400" />
                          {item.location}
                        </p>
                        {item.purpose && (
                          <p className="mt-1 text-[11px] text-slate-500">{item.purpose}</p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {item.lengthM}m × {item.widthM}m × {item.heightM}m{" "}
                          <span className="text-slate-500">({vol} m³)</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.scaffoldType} · {item.loadClass}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold",
                            tagMeta.badgeClass
                          )}
                        >
                          <span className={cn("size-2 rounded-full", tagMeta.dotClass)} />
                          {tagMeta.shortLabel}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.scaffoldCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineStatusChange(item, e.target.value as ScaffoldStatus)
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {scaffoldStatusValues.map((s) => (
                              <option key={s} value={s} className="bg-white text-slate-900">
                                {SCAFFOLD_STATUS_META[s].label}
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

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3 text-slate-400" />
                          <span>Last: {item.lastInspectionDate || "—"}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Next: {item.nextInspectionDate || "—"}
                        </p>
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
                              aria-label={`Edit ${item.scaffoldCode}`}
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
                              aria-label={`Hapus ${item.scaffoldCode}`}
                              title="Hapus unit scaffold"
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
        <ScaffoldFormModal
          key={editing?.id ?? "new-scaffold"}
          projectId={activeProject.id}
          scaffold={editing}
          defaultRequester={currentUserName}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Data scaffold ${editing.scaffoldCode} berhasil diperbarui.`
                : "Unit scaffold baru berhasil disimpan ke register.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
