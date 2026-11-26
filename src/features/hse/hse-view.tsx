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
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  HSE_SEVERITY_META,
  HSE_STATUS_META,
  HSE_TYPE_META,
  hseStatusValues,
  type HseRecordItem,
  type HseRecordType,
  type HseStatus,
} from "./schema";
import { deleteHseAction, updateHseStatusAction } from "./actions";
import { HseFormModal } from "./hse-form-modal";

interface HseViewProps {
  activeProject: ProjectSummary | null;
  records: HseRecordItem[];
  currentUserName: string;
}

const TYPE_FILTERS: { value: "all" | HseRecordType; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "tbt", label: "TBT" },
  { value: "ptw", label: "PTW" },
  { value: "observation", label: "Observation" },
  { value: "incident", label: "Incident" },
  { value: "audit", label: "Audit" },
];

export function HseView({ activeProject, records, currentUserName }: HseViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | HseRecordType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HseRecordItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const tbtCount = records.filter((r) => r.recordType === "tbt").length;
    const ptwCount = records.filter((r) => r.recordType === "ptw").length;
    const openFindings = records.filter((r) => r.status !== "closed").length;
    const incidents = records.filter((r) => r.recordType === "incident").length;
    return { total: records.length, tbtCount, ptwCount, openFindings, incidents };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "all" && r.recordType !== typeFilter) return false;
      if (!q) return true;
      return (
        r.recordCode.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.picName.toLowerCase().includes(q)
      );
    });
  }, [records, search, typeFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ESTIMA / HSE</p>
          <h1 className="mt-1.5 text-2xl font-semibold">HSE &amp; Safety Management</h1>
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

  function handleInlineStatus(item: HseRecordItem, nextStatus: HseStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateHseStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Status ${item.recordCode} diperbarui.` });
      router.refresh();
    });
  }

  function handleDelete(item: HseRecordItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus catatan HSE ${item.recordCode}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteHseAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Catatan ${item.recordCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / HSE
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            HSE, Toolbox Meeting &amp; PTW Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pelacakan Toolbox Meeting (TBT), Permit to Work (PTW), observasi keselamatan, dan laporan insiden Zero LTI.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="size-4" />
            Tambah Catatan HSE
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Catatan HSE</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.total}</p>
          <p className="mt-2 text-xs text-muted-foreground">{stats.tbtCount} TBT · {stats.ptwCount} PTW</p>
        </section>
        <section className="rounded-md border border-blue-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Toolbox Meeting</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-blue-700">{stats.tbtCount}</p>
          <p className="mt-2 text-xs text-muted-foreground">Briefing keselamatan harian</p>
        </section>
        <section className="rounded-md border border-amber-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Open Action / Obs</h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-amber-700">{stats.openFindings}</p>
          <p className="mt-2 text-xs text-muted-foreground">Menunggu tindak lanjut</p>
        </section>
        <section className={cn("rounded-md border bg-white p-5", stats.incidents > 0 ? "border-red-200" : "border-emerald-200")}>
          <h2 className={cn("text-xs font-semibold uppercase tracking-wide", stats.incidents > 0 ? "text-red-700" : "text-emerald-700")}>
            Incident / Near Miss
          </h2>
          <p className={cn("mt-3 font-mono text-3xl font-semibold", stats.incidents > 0 ? "text-red-700" : "text-emerald-700")}>
            {stats.incidents}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.incidents === 0 ? "Zero LTI terjaga" : "Perlu investigasi HSE"}
          </p>
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
            placeholder="Cari no. dokumen, topik, area, PIC..."
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

      {records.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada catatan HSE di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Catat Toolbox Meeting (TBT), Permit to Work (PTW), atau observasi keselamatan untuk menjaga standar Zero LTI.
          </p>
          {canWrite && (
            <Button className="mt-5" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="size-4" />
              Tambah Catatan HSE Pertama
            </Button>
          )}
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">No. Dokumen</th>
                  <th className="px-4 py-3">Topik &amp; Area</th>
                  <th className="px-4 py-3">PIC &amp; Tanggal</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const typeMeta = HSE_TYPE_META[item.recordType];
                  const sevMeta = HSE_SEVERITY_META[item.severity];
                  const statusMeta = HSE_STATUS_META[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
                          {item.recordCode}
                        </span>
                        <p className="mt-1.5">
                          <span className={cn("inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", typeMeta.badgeClass)}>
                            {typeMeta.label}
                          </span>
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-3.5 align-top">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.area} {item.attendeesCount > 0 ? `· ${item.attendeesCount} peserta` : ""}
                        </p>
                        {item.details && <p className="mt-1 text-xs text-slate-600">{item.details}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
                        <p className="font-medium text-foreground">{item.picName}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.recordDate}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", sevMeta.badgeClass)}>
                          {sevMeta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.recordCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as HseStatus)}
                            className={cn("h-8 rounded border px-2 text-xs font-medium focus:outline-none", statusMeta.badgeClass)}
                          >
                            {hseStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {HSE_STATUS_META[st].label}
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
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => { setEditing(item); setModalOpen(true); }} aria-label={`Edit ${item.recordCode}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleDelete(item)} aria-label={`Hapus ${item.recordCode}`}>
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
        <HseFormModal
          key={editing?.id ?? "new-hse"}
          projectId={activeProject.id}
          item={editing}
          defaultPic={currentUserName}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({ type: "success", text: editing ? `Catatan ${editing.recordCode} diperbarui.` : "Catatan HSE baru berhasil disimpan." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
