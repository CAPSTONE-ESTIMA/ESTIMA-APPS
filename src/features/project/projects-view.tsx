"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  CheckCircle2,
  MapPin,
  Building2,
  Pencil,
  Archive,
  FolderKanban,
  PlayCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectStatus, ProjectSummary } from "./schema";
import { selectActiveProjectAction, updateProjectStatusAction } from "./actions";
import { ProjectFormModal } from "./project-form-modal";

interface ProjectsViewProps {
  projects: ProjectSummary[];
  activeProjectId: string | null;
}

const STATUS_META: Record<ProjectStatus, { label: string; badgeClass: string }> = {
  active: {
    label: "Active",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  draft: {
    label: "Draft",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Completed",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  archived: {
    label: "Archived",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

const FILTER_OPTIONS: { value: "all" | ProjectStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectsView({ projects, activeProjectId }: ProjectsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      draft: projects.filter((p) => p.status === "draft").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (!q) return true;
      return (
        project.code.toLowerCase().includes(q) ||
        project.name.toLowerCase().includes(q) ||
        project.client.toLowerCase().includes(q) ||
        (project.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [projects, search, statusFilter]);

  function openCreateModal() {
    setEditingProject(null);
    setModalOpen(true);
  }

  function openEditModal(project: ProjectSummary) {
    setEditingProject(project);
    setModalOpen(true);
  }

  function handleSelectActive(project: ProjectSummary) {
    setFeedback(null);
    startTransition(async () => {
      const res = await selectActiveProjectAction(project.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Proyek aktif diubah ke ${project.code} — ${project.name}.` });
      router.refresh();
    });
  }

  function handleQuickStatusChange(project: ProjectSummary, nextStatus: ProjectStatus) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProjectStatusAction(project.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Status proyek ${project.code} diubah menjadi ${STATUS_META[nextStatus].label}.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Projects
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Manajemen Proyek
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Master proyek scaffolding &amp; insulation, jadwal durasi, konfigurasi dasar, serta pemilihan workspace aktif.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          Tambah Proyek
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Proyek", value: stats.total, sub: "Seluruh proyek terdaftar" },
          { label: "Proyek Aktif", value: stats.active, sub: "Sedang beroperasi di lapangan" },
          { label: "Draft / Persiapan", value: stats.draft, sub: "Tahap mobilisasi & setup" },
          { label: "Selesai", value: stats.completed, sub: "Handover & close-out" },
        ].map((item) => (
          <section key={item.label} className="rounded-md border border-border bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </h2>
            <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{item.sub}</p>
          </section>
        ))}
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

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-4">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama proyek, klien, atau lokasi..."
            className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm text-foreground focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
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
      {projects.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Belum ada proyek terdaftar
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Buat proyek pertama Anda untuk mulai mengelola register scaffolding, thermal insulation, laporan harian, dan inspeksi QA/QC.
          </p>
          <Button onClick={openCreateModal} className="mt-5">
            <Plus className="size-4" />
            Buat Proyek Pertama
          </Button>
        </section>
      ) : filteredProjects.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium text-foreground">Tidak ada proyek yang cocok dengan filter pencarian.</p>
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
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Proyek &amp; Lokasi</th>
                  <th className="px-4 py-3">Klien &amp; Periode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((project) => {
                  const isActiveWorkspace = project.id === activeProjectId;
                  const meta = STATUS_META[project.status];
                  const canManage = project.role === "manager";
                  const detailHref = `/projects/${encodeURIComponent(project.code)}`;

                  return (
                    <tr
                      key={project.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50/80",
                        isActiveWorkspace && "bg-blue-50/40"
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <div className="flex items-center gap-2">
                          <Link
                            href={detailHref}
                            className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 hover:border-blue-400 hover:text-blue-700"
                          >
                            {project.code}
                          </Link>
                          {isActiveWorkspace && (
                            <span
                              title="Proyek Aktif Saat Ini"
                              className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800"
                            >
                              <CheckCircle2 className="size-3" />
                              Aktif
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={detailHref}
                          className="font-medium text-foreground hover:text-blue-700 hover:underline"
                        >
                          {project.name}
                        </Link>
                        {project.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0 text-slate-400" />
                            {project.location}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Building2 className="size-3.5 text-slate-400" />
                          {project.client}
                        </span>
                        {(project.startDate || project.endDate) && (
                          <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <Calendar className="size-3 text-slate-400" />
                            {project.startDate || "—"} → {project.endDate || "—"}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
                            meta.badgeClass
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="text-xs font-medium capitalize text-slate-600">
                          {project.role}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline">
                            <Link href={detailHref}>
                              <ExternalLink className="size-3.5" />
                              Detail
                            </Link>
                          </Button>

                          {!isActiveWorkspace && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleSelectActive(project)}
                            >
                              <PlayCircle className="size-3.5" />
                              Pilih Aktif
                            </Button>
                          )}

                          {canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => openEditModal(project)}
                              aria-label={`Edit ${project.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}

                          {canManage && project.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleQuickStatusChange(project, "archived")}
                              aria-label={`Arsipkan ${project.name}`}
                              title="Arsipkan proyek"
                            >
                              <Archive className="size-3.5 text-slate-500" />
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
        <ProjectFormModal
          key={editingProject?.id ?? "new"}
          project={editingProject}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editingProject
                ? `Perubahan pada proyek ${editingProject.code} berhasil disimpan.`
                : "Proyek baru berhasil ditambahkan dan dipilih sebagai workspace aktif.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
