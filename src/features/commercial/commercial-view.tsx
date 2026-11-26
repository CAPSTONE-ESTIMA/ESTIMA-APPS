"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, FolderKanban, ArrowUpRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  COMMERCIAL_STATUS_META,
  COMMERCIAL_TYPE_META,
  commercialStatusValues,
  formatIdr,
  type CommercialRecordItem,
  type CommercialStatus,
  type CommercialType,
} from "./schema";
import { deleteCommercialAction, updateCommercialStatusAction } from "./actions";
import { CommercialFormModal } from "./commercial-form-modal";

interface CommercialViewProps {
  activeProject: ProjectSummary | null;
  items: CommercialRecordItem[];
}

const TYPE_FILTERS: { value: "all" | CommercialType; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "boq", label: "BOQ" },
  { value: "variation_order", label: "Variation Order" },
  { value: "progress_billing", label: "Billing" },
  { value: "cost_entry", label: "Cost" },
];

export function CommercialView({ activeProject, items }: CommercialViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CommercialType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CommercialRecordItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const boqTotal = items
      .filter((i) => i.itemType === "boq")
      .reduce((s, i) => s + i.quantity * i.unitRateIdr, 0);
    const voTotal = items
      .filter((i) => i.itemType === "variation_order" && i.status !== "rejected")
      .reduce((s, i) => s + i.quantity * i.unitRateIdr, 0);
    const billedTotal = items
      .filter((i) => i.itemType !== "cost_entry")
      .reduce((s, i) => s + (i.quantity * i.unitRateIdr * i.billedPercent) / 100, 0);
    const costTotal = items
      .filter((i) => i.itemType === "cost_entry")
      .reduce((s, i) => s + i.quantity * i.unitRateIdr, 0);
    return { boqTotal, voTotal, billedTotal, costTotal };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (typeFilter !== "all" && i.itemType !== typeFilter) return false;
      if (!q) return true;
      return (
        i.itemCode.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.workPackage.toLowerCase().includes(q)
      );
    });
  }, [items, search, typeFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ESTIMA / Commercial</p>
          <h1 className="mt-1.5 text-2xl font-semibold">Commercial &amp; Cost Control</h1>
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

  const canWrite = ["manager", "planner"].includes(activeProject.role);
  const canDelete = activeProject.role === "manager";

  function handleInlineStatus(item: CommercialRecordItem, nextStatus: CommercialStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateCommercialStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Status ${item.itemCode} diperbarui.` });
      router.refresh();
    });
  }

  function handleDelete(item: CommercialRecordItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus item commercial ${item.itemCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteCommercialAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Item ${item.itemCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Commercial
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Commercial, BOQ, Variation Order &amp; Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengendalian nilai kontrak BOQ, Variation Order (VO), progress billing, dan biaya aktual proyek.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="size-4" />
            Tambah Item Commercial
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contract BOQ</h2>
          <p className="mt-3 font-mono text-xl font-semibold text-foreground">{formatIdr(stats.boqTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Nilai kontrak awal</p>
        </section>
        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Variation Order (VO)</h2>
          <p className="mt-3 font-mono text-xl font-semibold text-amber-700">{formatIdr(stats.voTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Pekerjaan tambah / perubahan</p>
        </section>
        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Billed Value</h2>
          <p className="mt-3 font-mono text-xl font-semibold text-emerald-700">{formatIdr(stats.billedTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Akumulasi progress billing</p>
        </section>
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorded Cost</h2>
          <p className="mt-3 font-mono text-xl font-semibold text-foreground">{formatIdr(stats.costTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Biaya operasional tercatat</p>
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
            placeholder="Cari kode item, deskripsi, work package..."
            className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={cn("rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors", typeFilter === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-600 hover:bg-slate-50")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Briefcase className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada item commercial di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan item BOQ, Variation Order (VO), atau progress billing untuk memantau valuasi finansial proyek.
          </p>
          {canWrite && (
            <Button className="mt-5" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="size-4" />
              Tambah Item Pertama
            </Button>
          )}
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Kode &amp; Tipe</th>
                  <th className="px-4 py-3">Deskripsi &amp; WP</th>
                  <th className="px-4 py-3">Qty &amp; Rate</th>
                  <th className="px-4 py-3">Total Nilai</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const typeMeta = COMMERCIAL_TYPE_META[item.itemType];
                  const statusMeta = COMMERCIAL_STATUS_META[item.status];
                  const total = item.quantity * item.unitRateIdr;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
                          {item.itemCode}
                        </span>
                        <p className="mt-1.5">
                          <span className={cn("inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", typeMeta.badgeClass)}>
                            {typeMeta.label}
                          </span>
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-3.5 align-top">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.workPackage}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs">
                        <p>{item.quantity} {item.unit}</p>
                        <p className="mt-0.5 text-muted-foreground">@ {formatIdr(item.unitRateIdr)}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs">
                        <p className="font-semibold text-foreground">{formatIdr(total)}</p>
                        <p className="mt-0.5 text-[11px] text-emerald-700">Billed: {item.billedPercent}%</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.itemCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as CommercialStatus)}
                            className={cn("h-8 rounded border px-2 text-xs font-medium focus:outline-none", statusMeta.badgeClass)}
                          >
                            {commercialStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {COMMERCIAL_STATUS_META[st].label}
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
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => { setEditing(item); setModalOpen(true); }} aria-label={`Edit ${item.itemCode}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleDelete(item)} aria-label={`Hapus ${item.itemCode}`}>
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
        <CommercialFormModal
          key={editing?.id ?? "new-com"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({ type: "success", text: editing ? `Item ${editing.itemCode} diperbarui.` : "Item commercial baru berhasil disimpan." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
