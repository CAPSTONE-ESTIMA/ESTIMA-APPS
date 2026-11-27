"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  Users,
  Shield,
  History,
  Trash2,
  Loader2,
  Search,
  Lock,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  createUserSchema,
  projectRoleValues,
  systemRoleValues,
  type AdminUserItem,
  type AuditLogItem,
  type CreateUserInput,
  type ProjectMemberItem,
  type ProjectRole,
} from "./schema";
import {
  assignProjectMemberAction,
  createStaffUserAction,
  removeProjectMemberAction,
} from "./actions";
import { AuditDetailModal } from "./audit-detail-modal";

interface AdminViewProps {
  currentUserId: string;
  isSystemAdmin: boolean;
  activeProject: ProjectSummary | null;
  users: AdminUserItem[];
  members: ProjectMemberItem[];
  auditLogs: AuditLogItem[];
}

export function AdminView({
  currentUserId,
  isSystemAdmin,
  activeProject,
  users,
  members,
  auditLogs,
}: AdminViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "members" | "audit">(
    isSystemAdmin ? "users" : "members"
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("supervisor");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>("all");
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      systemRole: "member",
    },
  });

  const entityTypes = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.entityType))).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter((l) => {
      if (auditEntityFilter !== "all" && l.entityType !== auditEntityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.projectCode ?? "").toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        (l.actorName ?? "").toLowerCase().includes(q) ||
        (l.actorEmail ?? "").toLowerCase().includes(q) ||
        JSON.stringify(l.metadata).toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch, auditEntityFilter]);

  function handleExportAuditCsv() {
    const headers = [
      "Timestamp (UTC)",
      "Actor Name",
      "Actor Email",
      "Project",
      "Action",
      "Entity Type",
      "Entity ID",
      "Summary",
    ];
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const rows = filteredLogs.map((l) => [
      l.createdAt,
      l.actorName ?? "System",
      l.actorEmail ?? "",
      l.projectCode ?? l.projectId ?? "Global",
      l.action,
      l.entityType,
      l.entityId,
      l.summary,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estima-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const canManageProjectMembers = activeProject?.role === "manager";

  async function onCreateUser(values: CreateUserInput) {
    setFeedback(null);
    const res = await createStaffUserAction(values);
    if (!res.ok) {
      setFeedback({ type: "error", text: res.error });
      return;
    }
    reset({ name: "", email: "", password: "", systemRole: "member" });
    setFeedback({
      type: "success",
      text: `Akun ${values.email} berhasil dibuat dan dapat langsung login di /login.`,
    });
    router.refresh();
  }

  function handleAssignMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject || !selectedUserId) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await assignProjectMemberAction({
        projectId: activeProject.id,
        userId: selectedUserId,
        role: selectedRole,
      });
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setSelectedUserId("");
      setFeedback({ type: "success", text: "Akses anggota proyek berhasil diperbarui." });
      router.refresh();
    });
  }

  function handleRoleChange(userId: string, role: ProjectRole) {
    if (!activeProject) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await assignProjectMemberAction({
        projectId: activeProject.id,
        userId,
        role,
      });
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: "Role anggota berhasil diperbarui." });
      router.refresh();
    });
  }

  function handleRemoveMember(member: ProjectMemberItem) {
    if (!activeProject) return;
    if (!window.confirm(`Cabut akses ${member.userName} dari proyek ${activeProject.code}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await removeProjectMemberAction(activeProject.id, member.userId);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Akses ${member.userName} dicabut.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          ESTIMA / Administration
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
          User Access, Project Roles &amp; Audit Trail
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manajemen akun staff internal, pembagian role per proyek, dan riwayat audit transaksi sistem.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "users" as const, label: `Akun Staff (${users.length})`, icon: Users },
          {
            id: "members" as const,
            label: `Akses Proyek (${members.length})`,
            icon: Shield,
          },
          {
            id: "audit" as const,
            label: `Audit Trail (${auditLogs.length})`,
            icon: History,
          },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
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

      {/* TAB 1: USERS */}
      {tab === "users" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-md border border-border bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              <h2 className="font-semibold text-foreground">Buat Akun Staff Baru</h2>
            </div>

            {!isSystemAdmin ? (
              <p className="text-sm text-muted-foreground">
                Hanya System Administrator yang dapat membuat akun pengguna baru.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onCreateUser)} className="space-y-3.5" noValidate>
                <div>
                  <label htmlFor="adm-name" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                    Nama Lengkap *
                  </label>
                  <input
                    id="adm-name"
                    type="text"
                    placeholder="Hendra Pratama"
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                    {...register("name")}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="adm-email" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                    Email Perusahaan *
                  </label>
                  <input
                    id="adm-email"
                    type="email"
                    placeholder="h.pratama@estima.com"
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                    {...register("email")}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="adm-pass" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                    Password Awal (Min 12 Karakter) *
                  </label>
                  <input
                    id="adm-pass"
                    type="password"
                    placeholder="Minimal 12 karakter"
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                    {...register("password")}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label htmlFor="adm-sysrole" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                    System Role
                  </label>
                  <select
                    id="adm-sysrole"
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                    {...register("systemRole")}
                  >
                    {systemRoleValues.map((r) => (
                      <option key={r} value={r}>
                        {r === "admin" ? "Admin (Full System)" : "Member (Project-Scoped)"}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Buat Akun Staff
                </Button>
              </form>
            )}
          </section>

          <div className="overflow-hidden rounded-md border border-border bg-white">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Daftar Pengguna Terdaftar</h2>
            </div>
            {users.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Tidak ada data user (khusus System Administrator).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                      <th className="px-4 py-2.5">Nama</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">System Role</th>
                      <th className="px-4 py-2.5">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded border px-2 py-0.5 text-xs font-medium capitalize",
                              u.systemRole === "admin"
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                            )}
                          >
                            {u.systemRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {u.createdAt.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROJECT MEMBERS */}
      {tab === "members" && (
        <div className="space-y-5">
          {!activeProject ? (
            <section className="rounded-md border border-border bg-white p-8 text-center text-sm text-muted-foreground">
              Pilih proyek aktif di header atas untuk mengatur anggota proyek.
            </section>
          ) : (
            <>
              {canManageProjectMembers && users.length > 0 && (
                <form
                  onSubmit={handleAssignMember}
                  className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-white p-4"
                >
                  <div className="min-w-[240px] flex-1">
                    <label htmlFor="assign-user" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                      Tambah / Perbarui Anggota di [{activeProject.code}]
                    </label>
                    <select
                      id="assign-user"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih user terdaftar --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-44">
                    <label htmlFor="assign-role" className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                      Project Role
                    </label>
                    <select
                      id="assign-role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                      className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm capitalize focus:border-blue-600 focus:bg-white focus:outline-none"
                    >
                      {projectRoleValues.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" size="sm" disabled={!selectedUserId || isPending}>
                    Simpan Akses
                  </Button>
                </form>
              )}

              <div className="overflow-hidden rounded-md border border-border bg-white">
                <div className="border-b border-border px-5 py-3.5">
                  <h2 className="text-sm font-semibold text-foreground">
                    Anggota Proyek [{activeProject.code}] {activeProject.name}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                        <th className="px-4 py-2.5">Nama</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Project Role</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {members.map((m) => (
                        <tr key={m.userId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {m.userName}{" "}
                            {m.userId === currentUserId && (
                              <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                Anda
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.userEmail}</td>
                          <td className="px-4 py-3">
                            {canManageProjectMembers && m.userId !== currentUserId ? (
                              <select
                                aria-label={`Role ${m.userName}`}
                                value={m.role}
                                disabled={isPending}
                                onChange={(e) =>
                                  handleRoleChange(m.userId, e.target.value as ProjectRole)
                                }
                                className="h-8 rounded border border-slate-300 bg-white px-2 text-xs font-medium capitalize"
                              >
                                {projectRoleValues.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                                {m.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canManageProjectMembers && m.userId !== currentUserId && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleRemoveMember(m)}
                                aria-label={`Hapus ${m.userName}`}
                              >
                                <Trash2 className="size-3.5 text-red-600" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL (APPEND-ONLY / READ-ONLY) */}
      {tab === "audit" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 shrink-0 text-blue-700" />
              <span>
                <strong>Immutable Audit Trail (Read-Only):</strong> Setiap perubahan data proyek
                dan modul dicatat otomatis dalam transaksi database dan tidak dapat diedit maupun
                dihapus melalui UI.
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-blue-800">
              {filteredLogs.length} / {auditLogs.length} event
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-72 max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Cari aksi, entitas, aktor, atau ringkasan..."
                  className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <select
                aria-label="Filter tipe entitas audit"
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Semua Entitas ({entityTypes.length})</option>
                {entityTypes.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filteredLogs.length === 0}
              onClick={handleExportAuditCsv}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Timestamp (UTC)</th>
                    <th className="px-4 py-2.5">Actor</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Entity</th>
                    <th className="px-4 py-2.5">Ringkasan Perubahan</th>
                    <th className="px-4 py-2.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Tidak ada log audit yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600">
                          {log.createdAt.replace("T", " ").slice(0, 19)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                          <p className="font-medium text-foreground">{log.actorName ?? "System"}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {log.actorEmail ?? "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                          <p className="font-mono font-medium text-slate-700">
                            {log.entityType}
                            {log.projectCode && (
                              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                {log.projectCode}
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground" title={log.entityId}>
                            {log.entityId.slice(0, 14)}
                            {log.entityId.length > 14 ? "…" : ""}
                          </p>
                        </td>
                        <td className="max-w-md truncate px-4 py-2.5 text-xs text-slate-700" title={log.summary}>
                          {log.summary}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedAuditLog && (
        <AuditDetailModal
          log={selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
        />
      )}
    </div>
  );
}
