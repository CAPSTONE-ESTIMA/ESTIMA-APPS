"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  Layers,
  Thermometer,
  CalendarRange,
  ClipboardList,
  Users,
  Package,
  ShieldCheck,
  ListChecks,
  ShieldAlert,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
} from "lucide-react";
import {
  MODULE_GROUPS,
  modules,
  type ModuleIconName,
} from "@/config/modules";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/features/auth/logout-button";
import { ProjectSwitcher } from "@/features/project/project-switcher";
import type { ProjectSummary } from "@/features/project/schema";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
  projects: ProjectSummary[];
  activeProjectId: string | null;
}

const MODULE_ICONS: Record<ModuleIconName, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  scaffolding: Layers,
  insulation: Thermometer,
  planning: CalendarRange,
  "daily-reports": ClipboardList,
  manpower: Users,
  materials: Package,
  quality: ShieldCheck,
  punchlist: ListChecks,
  hse: ShieldAlert,
  commercial: Briefcase,
  documents: FileText,
  reports: BarChart3,
  administration: Settings,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRole,
  projects,
  activeProjectId,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  const activeModule = useMemo(() => {
    return (
      modules.find(
        (m) => pathname === `/${m.slug}` || pathname.startsWith(`/${m.slug}/`)
      ) ?? modules[0]
    );
  }, [pathname]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
        setNotifOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function renderNavItems(isCompact: boolean, onNavigate?: () => void) {
    return (
      <div className="space-y-4">
        {MODULE_GROUPS.map((group) => {
          const groupItems = modules.filter((m) => m.group === group.id);
          if (groupItems.length === 0) return null;

          return (
            <div key={group.id}>
              {!isCompact ? (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {group.label}
                </p>
              ) : (
                <div className="mx-3 my-2 h-px bg-slate-800" />
              )}
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = MODULE_ICONS[item.icon];
                  const isActive =
                    pathname === `/${item.slug}` ||
                    pathname.startsWith(`/${item.slug}/`);

                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        onClick={onNavigate}
                        title={isCompact ? item.name : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                          isCompact && "justify-center px-2",
                          isActive
                            ? "bg-[#173254] font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-r before:bg-blue-400"
                            : "text-slate-300 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isActive
                              ? "text-blue-300"
                              : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        {!isCompact && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Sidebar navigasi utama"
        className={cn(
          "hidden shrink-0 flex-col border-r border-[#1e293b] bg-[#0b192c] text-slate-300 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden",
          collapsed ? "w-[72px]" : "w-[252px]"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-[#1e293b] px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-white focus-visible:rounded"
            title="ESTIMA Project Management"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#173e66] text-blue-200 ring-1 ring-white/10">
              <HardHat className="size-5" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <strong className="block text-base font-bold leading-none tracking-[0.16em]">
                  ESTIMA
                </strong>
                <span className="mt-1 block font-mono text-[9px] tracking-[0.14em] text-slate-400">
                  PROJECT CONTROL
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <nav
          aria-label="Navigasi modul"
          className="flex-1 overflow-y-auto px-2.5 py-4"
        >
          {renderNavItems(collapsed)}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-[#1e293b] p-3">
          {!collapsed ? (
            <div className="rounded-md bg-[#112239] px-3 py-2.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                ESTIMA OPS v1.2
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                Scaffolding &amp; Insulation Control
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="font-mono text-[10px] font-semibold text-slate-500">v1.2</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[272px] max-w-[85vw] flex-col bg-[#0b192c] text-slate-300 shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1e293b] px-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 text-white"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-[#173e66] text-blue-200">
                  <HardHat className="size-4" />
                </span>
                <span>
                  <strong className="block text-sm font-bold leading-none tracking-[0.16em]">
                    ESTIMA
                  </strong>
                  <span className="mt-1 block font-mono text-[9px] tracking-[0.12em] text-slate-400">
                    PROJECT CONTROL
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup navigasi"
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav
              aria-label="Navigasi mobile"
              className="flex-1 overflow-y-auto px-2.5 py-4"
            >
              {renderNavItems(false, () => setMobileOpen(false))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-2.5 md:px-6 print:hidden">
          {/* Left: Toggles + Project Context Area + Active Module Breadcrumb */}
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Mobile drawer button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            {/* Desktop sidebar collapse button */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              className="hidden size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>

            {/* Project Context Area */}
            <div className="flex min-w-0 items-center gap-2">
              <ProjectSwitcher projects={projects} activeProjectId={activeProjectId} />
              {activeProject && (
                <span
                  title={`Status proyek: ${activeProject.status}`}
                  className={cn(
                    "hidden items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase sm:inline-flex",
                    activeProject.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : activeProject.status === "draft"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      activeProject.status === "active"
                        ? "bg-emerald-500"
                        : activeProject.status === "draft"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    )}
                  />
                  {activeProject.status}
                </span>
              )}
            </div>

            {/* Breadcrumb Separator + Active Module */}
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
              <ChevronRight className="size-3.5 text-slate-300" />
              <span className="font-medium text-foreground">{activeModule.name}</span>
            </div>
          </div>

          {/* Right: Quick Module Search (hidden on Dashboard) + Notifications + User Profile + Sign Out */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Module Jump Search */}
            {pathname !== "/dashboard" && (
              <div ref={searchContainerRef} className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      e.preventDefault();
                      router.push(`/${searchResults[0].slug}`);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Cari modul..."
                  aria-label="Cari dan pindah modul"
                  className="h-9 w-44 rounded-md border border-slate-300 bg-slate-50 pl-8 pr-3 text-xs text-foreground transition-all focus:w-60 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
                {searchOpen && (
                  <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-md border border-border bg-white shadow-lg">
                    <div className="border-b border-border bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Navigasi Cepat Modul ({searchResults.length})
                    </div>
                    <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.length === 0 ? (
                        <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                          Modul tidak ditemukan.
                        </li>
                      ) : (
                        searchResults.map((mod) => {
                          const Icon = MODULE_ICONS[mod.icon];
                          return (
                            <li key={mod.slug}>
                              <Link
                                href={`/${mod.slug}`}
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery("");
                                }}
                                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50"
                              >
                                <Icon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground">{mod.name}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {mod.description}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Notification Popover */}
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifikasi workspace"
                aria-expanded={notifOpen}
                className="relative inline-flex size-9 items-center justify-center rounded-md border border-border bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Bell className="size-4" />
                {!activeProject && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber-500" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-md border border-border bg-white shadow-lg">
                  <div className="border-b border-border bg-slate-50 px-4 py-2.5">
                    <p className="text-xs font-semibold text-foreground">Status Workspace</p>
                  </div>
                  <div className="divide-y divide-slate-100 p-3 text-xs">
                    <div className="pb-2.5">
                      <p className="font-medium text-foreground">
                        {activeProject
                          ? `Proyek aktif: ${activeProject.code}`
                          : "Belum ada proyek aktif"}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {activeProject
                          ? `${activeProject.name} (${activeProject.client})`
                          : "Buat proyek pertama di menu Projects untuk mengaktifkan kontrol penuh."}
                      </p>
                    </div>
                    <div className="pt-2.5">
                      <p className="font-medium text-foreground">Koneksi Database</p>
                      <p className="mt-0.5 text-emerald-700">
                        Neon Postgres terhubung · Sesi terproteksi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-border sm:block" />

            {/* User Profile */}
            <div className="hidden items-center gap-2.5 sm:flex">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#173e66] font-mono text-xs font-semibold text-white"
              >
                {getInitials(userName)}
              </span>
              <div className="max-w-[140px] leading-tight">
                <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground" title={userEmail}>
                  {userRole.toUpperCase()}
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        {/* Responsive Content Container */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
