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
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  PUNCH_CATEGORY_META,
  PUNCH_PRIORITY_META,
  PUNCH_STATUS_META,
  punchStatusValues,
  type PunchCategory,
  type PunchItemRecord,
  type PunchStatus,
} from "./schema";
import { deletePunchAction, updatePunchStatusAction } from "./actions";
import { PunchFormModal } from "./punch-form-modal";

interface PunchlistViewProps {
  activeProject: ProjectSummary | null;
  items: PunchItemRecord[];
}

const CAT_FILTERS: { value: "all" | PunchCategory; label: string }[] = [
  { value: "all", label: "Semua Kategori" },
  { value: "cat_a", label: "Cat A (Blocker)" },
  { value: "cat_b", label: "Cat B" },
  { value: "cat_c", label: "Cat C" },
];

export function PunchlistView({ activeProject, items }: PunchlistViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | PunchCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PunchStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PunchItemRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayIso = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const open = items.filter((i) => i.status !== "closed").length;
    const catAOpen = items.filter((i) => i.category === "cat_a" && i.status !== "closed").length;
    const overdue = items.filter((i) => i.status !== "closed" && i.dueDate < todayIso).length;
    const closed = items.filter((i) => i.status === "closed").length;

    return {
      total: items.length,
      open,
      catAOpen,
      overdue,
      closed,
    };
  }, [items, todayIso]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (catFilter !== "all" && i.category !== catFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.punchCode.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.area.toLowerCase().includes(q) ||
        i.referenceCode.toLowerCase().includes(q) ||
        i.picName.toLowerCase().includes(q)
      );
    });
  }, [items, search, catFilter, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Punch List
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Punch List Control</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Punch list dan verifikasi closure handover terikat pada proyek aktif.
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

  function handleInlineStatus(item: PunchItemRecord, nextStatus: PunchStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updatePunchStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Punch ${item.punchCode} diperbarui ke "${PUNCH_STATUS_META[nextStatus].label}".`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: PunchItemRecord) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus punch item ${item.punchCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deletePunchAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Punch item ${item.punchCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Punch List
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Punch List &amp; Handover Closure
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pelacakan temuan Cat A/B/C, penugasan PIC rework, due date overdue, dan verifikasi penutupan handover.
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
            Tambah Punch Item
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.catAOpen > 0 ? "border-red-200" : "border-border"
          )}
        >
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              stats.catAOpen > 0 ? "text-red-700" : "text-muted-foreground"
            )}
          >
            Cat A Open (Blocker)
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.catAOpen > 0 ? "text-red-700" : "text-foreground"
            )}
          >
            {stats.catAOpen}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.catAOpen > 0 ? "Menahan handover sistem" : "Tidak ada blocker handover"}
          </p>
        </section>

        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Total Open Punch
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">{stats.open}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dari total {stats.total} temuan tercatat
          </p>
        </section>

        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.overdue > 0 ? "border-red-200" : "border-border"
          )}
        >
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              stats.overdue > 0 ? "text-red-700" : "text-muted-foreground"
            )}
          >
            Overdue
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.overdue > 0 ? "text-red-700" : "text-foreground"
            )}
          >
            {stats.overdue}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Melewati target due date</p>
        </section>

        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Closed &amp; Verified
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.closed}</p>
          <p className="mt-2 text-xs text-muted-foreground">Selesai rework &amp; diverifikasi</p>
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
              placeholder="Cari punch no., deskripsi, ref unit, area, PIC..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter status punch"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | PunchStatus)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Workflow Status</option>
            {punchStatusValues.map((st) => (
              <option key={st} value={st}>
                {PUNCH_STATUS_META[st].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CAT_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCatFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                catFilter === opt.value
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
            <ListChecks className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada punch item tercatat</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan temuan punch list (Cat A/B/C) beserta PIC dan target penyelesaian sebelum handover.
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
              Tambah Punch Item Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada punch item yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCatFilter("all");
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
                  <th className="px-4 py-3">Punch No.</th>
                  <th className="px-4 py-3">Temuan &amp; Lokasi</th>
                  <th className="px-4 py-3">PIC &amp; Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const catMeta = PUNCH_CATEGORY_META[item.category];
                  const prioMeta = PUNCH_PRIORITY_META[item.priority];
                  const statusMeta = PUNCH_STATUS_META[item.status];
                  const isOverdue = item.status !== "closed" && item.dueDate < todayIso;

                  return (
                    <tr
                      key={item.id}
                      className={cn("hover:bg-slate-50/80", isOverdue && "bg-red-50/30")}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.punchCode}
                        </span>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                              catMeta.badgeClass
                            )}
                          >
                            {catMeta.shortLabel}
                          </span>
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                              prioMeta.badgeClass
                            )}
                          >
                            {prioMeta.label}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-lg px-4 py-3.5 align-top">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.area}</span>
                          <span>·</span>
                          <span className="font-mono">Ref: {item.referenceCode}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">{item.description}</p>
                        {item.correctiveAction && (
                          <p className="mt-1 text-xs text-emerald-700">
                            Action: {item.correctiveAction}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
                        <p className="font-medium text-foreground">{item.picName}</p>
                        <p
                          className={cn(
                            "mt-1 font-mono text-[11px]",
                            isOverdue ? "font-semibold text-red-600" : "text-muted-foreground"
                          )}
                        >
                          {isOverdue && (
                            <AlertTriangle className="mr-1 inline size-3 align-text-bottom" />
                          )}
                          Due: {item.dueDate}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.punchCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineStatus(item, e.target.value as PunchStatus)
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {punchStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {PUNCH_STATUS_META[st].label}
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
                              aria-label={`Edit ${item.punchCode}`}
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
                              aria-label={`Hapus ${item.punchCode}`}
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
        <PunchFormModal
          key={editing?.id ?? "new-punch"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Punch item ${editing.punchCode} berhasil diperbarui.`
                : "Punch item baru berhasil disimpan.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
