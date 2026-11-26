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
  Users,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  MANPOWER_STATUS_META,
  MANPOWER_TRADE_META,
  manpowerStatusValues,
  type ManpowerItem,
  type ManpowerStatus,
  type ManpowerTrade,
} from "./schema";
import { deleteManpowerAction, updateManpowerStatusAction } from "./actions";
import { ManpowerFormModal } from "./manpower-form-modal";

interface ManpowerViewProps {
  activeProject: ProjectSummary | null;
  records: ManpowerItem[];
}

const TRADE_FILTERS: { value: "all" | ManpowerTrade; label: string }[] = [
  { value: "all", label: "Semua Trade" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "insulation", label: "Insulation" },
  { value: "cladding", label: "Cladding" },
  { value: "qa_qc", label: "QA/QC" },
  { value: "hse", label: "HSE" },
  { value: "supervision", label: "Supervision" },
];

export function ManpowerView({ activeProject, records }: ManpowerViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState<"all" | ManpowerTrade>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ManpowerStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManpowerItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayIso = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const activePob = records.filter((r) => r.status === "active").length;
    const totalHours = Number(
      records.reduce((sum, r) => sum + r.regularHoursTotal + r.overtimeHoursTotal, 0).toFixed(1)
    );
    const expiredCerts = records.filter(
      (r) => r.certExpiry && r.certExpiry < todayIso && r.status !== "demobilized"
    ).length;

    return {
      total: records.length,
      activePob,
      totalHours,
      expiredCerts,
    };
  }, [records, todayIso]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (tradeFilter !== "all" && r.trade !== tradeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.employeeCode.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q) ||
        r.crew.toLowerCase().includes(q) ||
        (r.certification ?? "").toLowerCase().includes(q)
      );
    });
  }, [records, search, tradeFilter, statusFilter]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Manpower
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Manpower &amp; Certification</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Penugasan personel, crew, dan sertifikasi terikat pada proyek aktif.
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

  function handleInlineStatus(item: ManpowerItem, nextStatus: ManpowerStatus) {
    if (!activeProject || nextStatus === item.status) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateManpowerStatusAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Status ${item.fullName} diubah ke "${MANPOWER_STATUS_META[nextStatus].label}".`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: ManpowerItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus personel ${item.fullName} (${item.employeeCode})?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteManpowerAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Personel ${item.fullName} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Manpower
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Manpower, Crew &amp; Certification Register
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar personel proyek, alokasi crew &amp; trade, masa berlaku sertifikat, serta akumulasi manhour.
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
            Tambah Personel
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-emerald-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Active Site POB
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-emerald-700">{stats.activePob}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dari total {stats.total} personel terdaftar
          </p>
        </section>

        <section className="rounded-md border border-blue-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Akumulasi Manhours
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-blue-700">
            {stats.totalHours.toLocaleString("id-ID")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Total Regular + Overtime personel</p>
        </section>

        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Personel
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 text-xs text-muted-foreground">Seluruh status mobilisasi</p>
        </section>

        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.expiredCerts > 0 ? "border-red-200" : "border-border"
          )}
        >
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              stats.expiredCerts > 0 ? "text-red-700" : "text-muted-foreground"
            )}
          >
            Sertifikat Kadaluarsa
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.expiredCerts > 0 ? "text-red-700" : "text-foreground"
            )}
          >
            {stats.expiredCerts}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.expiredCerts > 0 ? "Perlu perpanjangan segera" : "Semua sertifikat valid"}
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
              placeholder="Cari ID, nama, jabatan, crew, sertifikat..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter status manpower"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ManpowerStatus)}
            className="h-9 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Status</option>
            {manpowerStatusValues.map((st) => (
              <option key={st} value={st}>
                {MANPOWER_STATUS_META[st].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TRADE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTradeFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                tradeFilter === opt.value
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
            <Users className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada personel terdaftar di proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan personel lapangan beserta trade, crew, sertifikasi, dan jam kerja untuk mengontrol POB proyek.
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
              Tambah Personel Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada personel yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTradeFilter("all");
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
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Nama &amp; Posisi</th>
                  <th className="px-4 py-3">Trade &amp; Crew</th>
                  <th className="px-4 py-3">Sertifikasi</th>
                  <th className="px-4 py-3">Manhours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const tradeMeta = MANPOWER_TRADE_META[item.trade];
                  const statusMeta = MANPOWER_STATUS_META[item.status];
                  const isCertExpired = Boolean(item.certExpiry && item.certExpiry < todayIso);
                  const totalHrs = Number(
                    (item.regularHoursTotal + item.overtimeHoursTotal).toFixed(1)
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.employeeCode}
                        </span>
                        {item.mobilizationDate && (
                          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                            Mob: {item.mobilizationDate}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-foreground">{item.fullName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.position}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                            tradeMeta.badgeClass
                          )}
                        >
                          {tradeMeta.label}
                        </span>
                        <p className="mt-1 text-xs text-slate-600">{item.crew}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
                        {item.certification ? (
                          <>
                            <p className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Award className="size-3.5 text-slate-400" />
                              {item.certification}
                            </p>
                            {item.certExpiry && (
                              <p
                                className={cn(
                                  "mt-1 font-mono text-[11px]",
                                  isCertExpired ? "font-semibold text-red-600" : "text-muted-foreground"
                                )}
                              >
                                {isCertExpired && (
                                  <AlertTriangle className="mr-1 inline size-3 align-text-bottom" />
                                )}
                                Exp: {item.certExpiry}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs">
                        <p className="font-semibold text-foreground">{totalHrs} hrs</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          R: {item.regularHoursTotal} · OT: {item.overtimeHoursTotal}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah status ${item.employeeCode}`}
                            value={item.status}
                            disabled={isPending}
                            onChange={(e) => handleInlineStatus(item, e.target.value as ManpowerStatus)}
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              statusMeta.badgeClass
                            )}
                          >
                            {manpowerStatusValues.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {MANPOWER_STATUS_META[st].label}
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
                              aria-label={`Edit ${item.employeeCode}`}
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
                              aria-label={`Hapus ${item.employeeCode}`}
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
        <ManpowerFormModal
          key={editing?.id ?? "new-manpower"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Data personel ${editing.fullName} berhasil diperbarui.`
                : "Personel baru berhasil didaftarkan ke proyek.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
