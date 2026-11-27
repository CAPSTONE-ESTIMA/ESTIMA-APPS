"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  History,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  PlayCircle,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuditLogItem } from "@/features/administration/schema";
import { AuditDetailModal } from "@/features/administration/audit-detail-modal";
import {
  PROJECT_TEMPLATE_LABELS,
  projectTemplateValues,
  type ProjectConfiguration,
  type ProjectDetail,
  type ProjectTemplate,
} from "./schema";
import { selectActiveProjectAction, updateProjectConfigAction } from "./actions";
import { ProjectFormModal } from "./project-form-modal";

interface ProjectDetailViewProps {
  project: ProjectDetail;
  isActiveWorkspace: boolean;
  auditHistory: AuditLogItem[];
}

const MODULE_TOGGLES: {
  key: keyof ProjectConfiguration["enabledModules"];
  label: string;
}[] = [
  { key: "scaffolding", label: "Scaffolding" },
  { key: "insulation", label: "Insulation" },
  { key: "planning", label: "Planning & Progress" },
  { key: "dailyReports", label: "Daily Reports" },
  { key: "manpower", label: "Manpower" },
  { key: "materials", label: "Materials" },
  { key: "quality", label: "QA/QC" },
  { key: "punchlist", label: "Punch List" },
  { key: "hse", label: "HSE" },
  { key: "commercial", label: "Commercial" },
  { key: "documents", label: "Documents" },
];

export function ProjectDetailView({
  project,
  isActiveWorkspace,
  auditHistory,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [config, setConfig] = useState<ProjectConfiguration>(project.configuration);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage = project.role === "manager";

  function handleSetActive() {
    setFeedback(null);
    startTransition(async () => {
      const res = await selectActiveProjectAction(project.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Proyek ${project.code} dipilih sebagai workspace aktif.` });
      router.refresh();
    });
  }

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProjectConfigAction(project.id, config);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: "Konfigurasi dasar proyek berhasil disimpan." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke Daftar Projects
          </Link>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-900">
              {project.code}
            </span>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium capitalize text-emerald-700">
              {project.status}
            </span>
            {isActiveWorkspace && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                <CheckCircle2 className="size-3.5" />
                Workspace Aktif
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{project.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isActiveWorkspace && (
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleSetActive}>
              <PlayCircle className="size-4" />
              Jadikan Workspace Aktif
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit Master Proyek
            </Button>
          )}
        </div>
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

      {/* Master Metadata Grid */}
      <section className="grid gap-4 rounded-md border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Klien / Pemilik
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Building2 className="size-4 text-slate-400" />
            {project.client}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Lokasi / Site
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-slate-400" />
            {project.location || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Periode Proyek (Start → End)
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
            <Calendar className="size-4 text-slate-400" />
            {project.startDate || "—"} → {project.endDate || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Project ID &amp; Role Anda
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-slate-600" title={project.id}>
            {project.id.slice(0, 13)}… · <span className="font-sans font-semibold capitalize text-foreground">{project.role}</span>
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Basic Project Configuration */}
        <section className="rounded-md border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <Settings2 className="size-4 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Basic Project Configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Template disiplin, satuan default, siklus inspeksi scaffold, dan modul aktif per proyek.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cfg-tpl" className="mb-1.5 block text-xs font-semibold uppercase text-slate-700">
                  Template Proyek
                </label>
                <select
                  id="cfg-tpl"
                  disabled={!canManage || isPending}
                  value={config.template}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      template: e.target.value as ProjectTemplate,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-60"
                >
                  {projectTemplateValues.map((t) => (
                    <option key={t} value={t}>
                      {PROJECT_TEMPLATE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cfg-unit" className="mb-1.5 block text-xs font-semibold uppercase text-slate-700">
                    Unit Default
                  </label>
                  <select
                    id="cfg-unit"
                    disabled={!canManage || isPending}
                    value={config.defaultUnit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        defaultUnit: e.target.value as "m2" | "m3" | "m",
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-60"
                  >
                    <option value="m2">m²</option>
                    <option value="m3">m³</option>
                    <option value="m">m</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cfg-cycle" className="mb-1.5 block whitespace-nowrap text-xs font-semibold uppercase text-slate-700">
                    Siklus (Hari)
                  </label>
                  <input
                    id="cfg-cycle"
                    type="number"
                    min="1"
                    max="30"
                    disabled={!canManage || isPending}
                    value={config.scaffoldInspectionCycleDays}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        scaffoldInspectionCycleDays: Math.max(1, Math.min(30, Number(e.target.value) || 7)),
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-700">
                Modul Aktif di Proyek Ini
              </p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {MODULE_TOGGLES.map((mod) => (
                  <label
                    key={mod.key}
                    className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      disabled={!canManage || isPending}
                      checked={config.enabledModules[mod.key]}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          enabledModules: {
                            ...prev.enabledModules,
                            [mod.key]: e.target.checked,
                          },
                        }))
                      }
                      className="size-3.5 accent-blue-700"
                    />
                    <span>{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="cfg-notes" className="mb-1.5 block text-xs font-semibold uppercase text-slate-700">
                Catatan Konfigurasi / Client Spec
              </label>
              <textarea
                id="cfg-notes"
                rows={2}
                disabled={!canManage || isPending}
                value={config.notes}
                onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Contoh: Standar BS EN 12811, inspeksi scaffold setiap 7 hari, client approval wajib untuk Cat A..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-60"
              />
            </div>

            {canManage && (
              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan Konfigurasi
                </Button>
              </div>
            )}
          </form>
        </section>

        {/* Project Membership */}
        <section className="rounded-md border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Project Membership ({project.members.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pengguna yang memiliki akses ke proyek ini.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 whitespace-nowrap">
              <Link href="/administration">Kelola Akses</Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {project.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{m.userName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{m.userEmail}</p>
                </div>
                <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Project Audit Trail (Read-Only) */}
      <section className="rounded-md border border-border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Riwayat Audit Proyek ({auditHistory.length})
                </h2>
                <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                  <Lock className="size-2.5" />
                  Read-Only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Log permanen siapa, kapan, dan perubahan apa yang terjadi pada proyek ini.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 whitespace-nowrap">
            <Link href="/administration">Lihat Semua Audit</Link>
          </Button>
        </div>

        {auditHistory.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Belum ada riwayat audit untuk proyek ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50 font-semibold uppercase text-slate-600">
                  <th className="px-3 py-2">Timestamp (UTC)</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Ringkasan Perubahan</th>
                  <th className="px-3 py-2 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-600">
                      {log.createdAt.replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="font-medium text-foreground">{log.actorName ?? "System"}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="max-w-md truncate px-3 py-2.5 text-slate-700" title={log.summary}>
                      {log.summary}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        <Eye className="size-3.5" />
                        Diff
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAuditLog && (
        <AuditDetailModal
          log={selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
        />
      )}

      {editOpen && (
        <ProjectFormModal
          key={project.id}
          project={project}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setFeedback({ type: "success", text: "Master data proyek berhasil diperbarui." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
