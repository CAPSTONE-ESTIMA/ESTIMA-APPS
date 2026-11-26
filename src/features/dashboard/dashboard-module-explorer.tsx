"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Filter,
  AlertTriangle,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  SCAFFOLD_STATUS_META,
  SCAFFOLD_TAG_META,
  calcScaffoldVolume,
  type ScaffoldItem,
} from "@/features/scaffolding/schema";
import {
  INSULATION_STATUS_META,
  INSULATION_TYPE_META,
  INSULATION_UNIT_LABELS,
  type InsulationWorkItem,
} from "@/features/insulation/schema";
import {
  PLANNING_DISCIPLINE_META,
  PLANNING_STATUS_META,
  type PlanningActivityItem,
} from "@/features/planning/schema";
import {
  DAILY_REPORT_STATUS_META,
  WEATHER_LABELS,
  type DailyReportItem,
} from "@/features/daily-reports/schema";
import {
  MANPOWER_STATUS_META,
  MANPOWER_TRADE_META,
  type ManpowerItem,
} from "@/features/manpower/schema";
import {
  MATERIAL_CATEGORY_META,
  MATERIAL_LIFECYCLE_META,
  type MaterialItem,
} from "@/features/materials/schema";
import {
  QA_CLIENT_APPROVAL_META,
  QA_RESULT_META,
  type QaInspectionItem,
} from "@/features/quality/schema";
import {
  PUNCH_CATEGORY_META,
  PUNCH_STATUS_META,
  type PunchItemRecord,
} from "@/features/punchlist/schema";
import { HSE_STATUS_META, HSE_TYPE_META, type HseRecordItem } from "@/features/hse/schema";
import {
  COMMERCIAL_STATUS_META,
  COMMERCIAL_TYPE_META,
  formatIdr,
  type CommercialRecordItem,
} from "@/features/commercial/schema";
import {
  DOCUMENT_CATEGORY_META,
  DOCUMENT_STATUS_META,
  type ProjectDocumentItem,
} from "@/features/documents/schema";

export type ModuleFilterKey =
  | "all"
  | "projects"
  | "scaffolding"
  | "insulation"
  | "planning"
  | "daily-reports"
  | "manpower"
  | "materials"
  | "quality"
  | "punchlist"
  | "hse"
  | "commercial"
  | "documents";

interface DashboardModuleExplorerProps {
  projects: ProjectSummary[];
  activeProject: ProjectSummary | null;
  scaffolds: ScaffoldItem[];
  insulation: InsulationWorkItem[];
  planning: PlanningActivityItem[];
  dailyReports: DailyReportItem[];
  manpower: ManpowerItem[];
  materials: MaterialItem[];
  qaInspections: QaInspectionItem[];
  punchItems: PunchItemRecord[];
  hseRecords: HseRecordItem[];
  commercialItems: CommercialRecordItem[];
  documents: ProjectDocumentItem[];
}

export function DashboardModuleExplorer({
  projects,
  activeProject,
  scaffolds,
  insulation,
  planning,
  dailyReports,
  manpower,
  materials,
  qaInspections,
  punchItems,
  hseRecords,
  commercialItems,
  documents,
}: DashboardModuleExplorerProps) {
  const [selected, setSelected] = useState<ModuleFilterKey>("all");

  const filters: {
    key: ModuleFilterKey;
    label: string;
    count?: number;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "all", label: "Semua Modul", icon: Filter },
    { key: "projects", label: "Projects", count: projects.length, href: "/projects", icon: FolderKanban },
    { key: "scaffolding", label: "Scaffolding", count: scaffolds.length, href: "/scaffolding", icon: Layers },
    { key: "insulation", label: "Insulation", count: insulation.length, href: "/insulation", icon: Thermometer },
    { key: "planning", label: "Planning & Progress", count: planning.length, href: "/planning", icon: CalendarRange },
    { key: "daily-reports", label: "Daily Reports", count: dailyReports.length, href: "/daily-reports", icon: ClipboardList },
    { key: "manpower", label: "Manpower", count: manpower.length, href: "/manpower", icon: Users },
    { key: "materials", label: "Materials", count: materials.length, href: "/materials", icon: Package },
    { key: "quality", label: "QA/QC", count: qaInspections.length, href: "/quality", icon: ShieldCheck },
    { key: "punchlist", label: "Punch List", count: punchItems.length, href: "/punchlist", icon: ListChecks },
    { key: "hse", label: "HSE", count: hseRecords.length, href: "/hse", icon: ShieldAlert },
    { key: "commercial", label: "Commercial", count: commercialItems.length, href: "/commercial", icon: Briefcase },
    { key: "documents", label: "Documents", count: documents.length, href: "/documents", icon: FileText },
  ];

  const activeFilterMeta = filters.find((f) => f.key === selected) ?? filters[0];

  const summaryCards: {
    key: ModuleFilterKey;
    title: string;
    href: string;
    metric: string;
    detail: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      key: "projects",
      title: "Projects",
      href: "/projects",
      metric: `${projects.length} Proyek`,
      detail: `${projects.filter((p) => p.status === "active").length} aktif · ${projects.filter((p) => p.status === "completed").length} selesai`,
      icon: FolderKanban,
    },
    {
      key: "scaffolding",
      title: "Scaffolding",
      href: "/scaffolding",
      metric: `${scaffolds.length} Unit`,
      detail: `${scaffolds.filter((s) => s.tagStatus === "green").length} Green · ${scaffolds.filter((s) => s.tagStatus === "yellow").length} Yellow · ${scaffolds.filter((s) => s.tagStatus === "red").length} Red`,
      icon: Layers,
    },
    {
      key: "insulation",
      title: "Insulation",
      href: "/insulation",
      metric: `${insulation.length} Items`,
      detail:
        insulation.length > 0
          ? `Avg progress ${Math.round(insulation.reduce((s, i) => s + i.progressPercent, 0) / insulation.length)}% · ${insulation.filter((i) => i.status === "completed").length} selesai`
          : "Belum ada work item insulasi",
      icon: Thermometer,
    },
    {
      key: "planning",
      title: "Planning & Progress",
      href: "/planning",
      metric: `${planning.length} Aktivitas`,
      detail: `${planning.filter((a) => a.status === "delayed" || a.status === "at_risk").length} at risk/delayed · ${planning.filter((a) => a.status === "completed").length} selesai`,
      icon: CalendarRange,
    },
    {
      key: "daily-reports",
      title: "Daily Reports",
      href: "/daily-reports",
      metric: `${dailyReports.length} Laporan`,
      detail: `${dailyReports.filter((r) => r.status === "approved").length} approved · ${dailyReports.filter((r) => r.status === "submitted").length} pending`,
      icon: ClipboardList,
    },
    {
      key: "manpower",
      title: "Manpower",
      href: "/manpower",
      metric: `${manpower.length} Personel`,
      detail: `${manpower.filter((m) => m.status === "active").length} aktif di site`,
      icon: Users,
    },
    {
      key: "materials",
      title: "Materials",
      href: "/materials",
      metric: `${materials.length} SKU`,
      detail: `${materials.filter((m) => m.stockAvailable <= m.minStock).length} low stock alert`,
      icon: Package,
    },
    {
      key: "quality",
      title: "QA/QC",
      href: "/quality",
      metric: `${qaInspections.length} RFI/NCR`,
      detail: `${qaInspections.filter((q) => q.result === "passed").length} passed · ${qaInspections.filter((q) => q.result === "pending" || q.result === "re_inspection").length} pending`,
      icon: ShieldCheck,
    },
    {
      key: "punchlist",
      title: "Punch List",
      href: "/punchlist",
      metric: `${punchItems.length} Temuan`,
      detail: `${punchItems.filter((p) => p.category === "cat_a" && p.status !== "closed").length} Cat A blocker · ${punchItems.filter((p) => p.status === "closed").length} closed`,
      icon: ListChecks,
    },
    {
      key: "hse",
      title: "HSE",
      href: "/hse",
      metric: `${hseRecords.length} Catatan`,
      detail: `${hseRecords.filter((h) => h.recordType === "tbt").length} TBT · ${hseRecords.filter((h) => h.status !== "closed").length} open action`,
      icon: ShieldAlert,
    },
    {
      key: "commercial",
      title: "Commercial",
      href: "/commercial",
      metric: `${commercialItems.length} Items`,
      detail: formatIdr(commercialItems.filter((c) => c.itemType === "boq").reduce((s, c) => s + c.quantity * c.unitRateIdr, 0)),
      icon: Briefcase,
    },
    {
      key: "documents",
      title: "Documents",
      href: "/documents",
      metric: `${documents.length} Dokumen`,
      detail: `${documents.filter((d) => d.status === "approved").length} IFC approved · ${documents.filter((d) => d.status === "for_review").length} review`,
      icon: FileText,
    },
  ];

  function renderEmptyModule(label: string, href: string) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Belum ada data pada modul {label}
          {activeProject ? ` untuk proyek ${activeProject.code}` : ""}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tambahkan data langsung dari halaman modul untuk melihat ringkasannya di Dashboard.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={href}>
            Buka Modul {label} <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Filter Header Bar */}
      <div className="rounded-md border border-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Filter Isi Modul
            </h2>
            <span className="text-xs text-muted-foreground">
              — Pilih modul untuk meninjau data langsung dari Dashboard
            </span>
          </div>
          {activeFilterMeta.href && (
            <Button asChild size="sm" variant="outline">
              <Link href={activeFilterMeta.href}>
                Buka {activeFilterMeta.label} Lengkap <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter modul dashboard">
          {filters.map((f) => {
            const Icon = f.icon;
            const isSelected = selected === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelected(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="size-3.5" />
                <span>{f.label}</span>
                {typeof f.count === "number" && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 font-mono text-[10px]",
                      isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                    )}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Content Panel */}
      {selected === "all" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="flex flex-col justify-between rounded-md border border-border bg-white p-5 transition-colors hover:border-slate-400"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icon className="size-4" />
                    </span>
                    {card.badge ? (
                      <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                        {card.badge}
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {card.metric}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelected(card.key)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Lihat isi di sini
                  </button>
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-foreground"
                  >
                    Buka <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected === "projects" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {projects.length === 0 ? (
            renderEmptyModule("Projects", "/projects")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Kode</th>
                    <th className="px-4 py-2.5">Nama Proyek</th>
                    <th className="px-4 py-2.5">Klien &amp; Lokasi</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{p.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.client} {p.location ? `· ${p.location}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-slate-600">{p.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "scaffolding" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {scaffolds.length === 0 ? (
            renderEmptyModule("Scaffolding", "/scaffolding")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Scaffold ID</th>
                    <th className="px-4 py-2.5">Area &amp; Lokasi</th>
                    <th className="px-4 py-2.5">Dimensi &amp; Volume</th>
                    <th className="px-4 py-2.5">ScaffTag</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scaffolds.map((s) => {
                    const tag = SCAFFOLD_TAG_META[s.tagStatus];
                    const st = SCAFFOLD_STATUS_META[s.status];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{s.scaffoldCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-foreground">{s.area}</p>
                          <p className="text-muted-foreground">{s.location}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {s.lengthM}×{s.widthM}×{s.heightM}m ({calcScaffoldVolume(s.lengthM, s.widthM, s.heightM)} m³)
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold", tag.badgeClass)}>
                            <span className={cn("size-2 rounded-full", tag.dotClass)} />
                            {tag.shortLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "insulation" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {insulation.length === 0 ? (
            renderEmptyModule("Insulation", "/insulation")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Work Code</th>
                    <th className="px-4 py-2.5">Equipment / Line</th>
                    <th className="px-4 py-2.5">Spec</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Progress &amp; Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {insulation.map((i) => {
                    const tp = INSULATION_TYPE_META[i.insulationType];
                    const st = INSULATION_STATUS_META[i.status];
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{i.workCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-mono font-semibold text-foreground">{i.equipmentOrLine}</p>
                          <p className="text-muted-foreground">{i.area} · {i.workPackage}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", tp.badgeClass)}>
                            {tp.label}
                          </span>
                          <span className="font-medium">{i.material} ({i.thicknessMm}mm)</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {i.quantity} {INSULATION_UNIT_LABELS[i.unit]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold">{i.progressPercent}%</span>
                            <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                              {st.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "planning" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {planning.length === 0 ? (
            renderEmptyModule("Planning & Progress", "/planning")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Activity ID</th>
                    <th className="px-4 py-2.5">Aktivitas</th>
                    <th className="px-4 py-2.5">Schedule</th>
                    <th className="px-4 py-2.5">Plan / Actual</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {planning.map((a) => {
                    const disc = PLANNING_DISCIPLINE_META[a.discipline];
                    const st = PLANNING_STATUS_META[a.status];
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{a.activityCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", disc.badgeClass)}>
                            {disc.label}
                          </span>
                          <span className="font-medium text-foreground">{a.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {a.plannedStart} → {a.plannedFinish}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {a.plannedProgress}% / <strong>{a.actualProgress}%</strong>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "daily-reports" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {dailyReports.length === 0 ? (
            renderEmptyModule("Daily Reports", "/daily-reports")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Report No.</th>
                    <th className="px-4 py-2.5">Tanggal / Shift</th>
                    <th className="px-4 py-2.5">Area &amp; Ringkasan</th>
                    <th className="px-4 py-2.5">POB / Manhours</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dailyReports.map((r) => {
                    const st = DAILY_REPORT_STATUS_META[r.status];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{r.reportCode}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {r.reportDate} · {r.shift} · {WEATHER_LABELS[r.weather].split(" ")[0]}
                        </td>
                        <td className="max-w-md px-4 py-3 text-xs">
                          <p className="font-semibold text-foreground">{r.area}</p>
                          <p className="truncate text-muted-foreground">{r.activitiesSummary}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {r.manpowerCount} POB · {(r.regularHours + r.overtimeHours).toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "manpower" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {manpower.length === 0 ? (
            renderEmptyModule("Manpower", "/manpower")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">ID</th>
                    <th className="px-4 py-2.5">Nama &amp; Posisi</th>
                    <th className="px-4 py-2.5">Trade &amp; Crew</th>
                    <th className="px-4 py-2.5">Manhours</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {manpower.map((m) => {
                    const tr = MANPOWER_TRADE_META[m.trade];
                    const st = MANPOWER_STATUS_META[m.status];
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{m.employeeCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-foreground">{m.fullName}</p>
                          <p className="text-muted-foreground">{m.position}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium", tr.badgeClass)}>
                            {tr.label}
                          </span>
                          <span>{m.crew}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {(m.regularHoursTotal + m.overtimeHoursTotal).toFixed(1)} hrs
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "materials" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {materials.length === 0 ? (
            renderEmptyModule("Materials", "/materials")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Nama Material</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5">Available / Min</th>
                    <th className="px-4 py-2.5">Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materials.map((m) => {
                    const cat = MATERIAL_CATEGORY_META[m.category];
                    const lc = MATERIAL_LIFECYCLE_META[m.lifecycleStatus];
                    const low = m.stockAvailable <= m.minStock;
                    return (
                      <tr key={m.id} className={cn("hover:bg-slate-50/80", low && "bg-red-50/30")}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{m.materialCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-foreground">{m.name}</p>
                          <p className="text-muted-foreground">{m.warehouse}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", cat.badgeClass)}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className={cn("font-semibold", low && "text-red-700")}>
                            {low && <AlertTriangle className="mr-1 inline size-3" />}
                            {m.stockAvailable} {m.unit}
                          </span>{" "}
                          <span className="text-muted-foreground">/ min {m.minStock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", lc.badgeClass)}>
                            {lc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "quality" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {qaInspections.length === 0 ? (
            renderEmptyModule("QA/QC", "/quality")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">RFI / NCR No.</th>
                    <th className="px-4 py-2.5">Judul &amp; Ref</th>
                    <th className="px-4 py-2.5">Inspector</th>
                    <th className="px-4 py-2.5">Result</th>
                    <th className="px-4 py-2.5">Client Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {qaInspections.map((q) => {
                    const res = QA_RESULT_META[q.result];
                    const cli = QA_CLIENT_APPROVAL_META[q.clientApproval];
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{q.inspectionCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-foreground">{q.title}</p>
                          <p className="font-mono text-muted-foreground">Ref: {q.referenceCode} · {q.area}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">{q.inspectorName}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", res.badgeClass)}>
                            {res.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", cli.badgeClass)}>
                            {cli.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "punchlist" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {punchItems.length === 0 ? (
            renderEmptyModule("Punch List", "/punchlist")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Punch No.</th>
                    <th className="px-4 py-2.5">Cat</th>
                    <th className="px-4 py-2.5">Deskripsi Temuan</th>
                    <th className="px-4 py-2.5">PIC &amp; Due</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {punchItems.map((p) => {
                    const cat = PUNCH_CATEGORY_META[p.category];
                    const st = PUNCH_STATUS_META[p.status];
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{p.punchCode}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold", cat.badgeClass)}>
                            {cat.shortLabel}
                          </span>
                        </td>
                        <td className="max-w-md px-4 py-3 text-xs">
                          <p className="font-medium text-foreground">{p.description}</p>
                          <p className="text-muted-foreground">{p.area} · Ref: {p.referenceCode}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <p>{p.picName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.dueDate}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "hse" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {hseRecords.length === 0 ? (
            renderEmptyModule("HSE", "/hse")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">No. HSE</th>
                    <th className="px-4 py-2.5">Tipe &amp; Topik</th>
                    <th className="px-4 py-2.5">Area &amp; Tanggal</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hseRecords.map((h) => {
                    const tp = HSE_TYPE_META[h.recordType];
                    const st = HSE_STATUS_META[h.status];
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{h.recordCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", tp.badgeClass)}>
                            {tp.label}
                          </span>
                          <span className="font-medium text-foreground">{h.title}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{h.area} · {h.recordDate}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "commercial" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {commercialItems.length === 0 ? (
            renderEmptyModule("Commercial", "/commercial")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Kode</th>
                    <th className="px-4 py-2.5">Tipe &amp; Deskripsi</th>
                    <th className="px-4 py-2.5">Total Nilai</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commercialItems.map((c) => {
                    const tp = COMMERCIAL_TYPE_META[c.itemType];
                    const st = COMMERCIAL_STATUS_META[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{c.itemCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", tp.badgeClass)}>
                            {tp.label}
                          </span>
                          <span className="font-medium text-foreground">{c.title}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{formatIdr(c.quantity * c.unitRateIdr)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected === "documents" && (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          {documents.length === 0 ? (
            renderEmptyModule("Documents", "/documents")
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <th className="px-4 py-2.5">Doc No. &amp; Rev</th>
                    <th className="px-4 py-2.5">Kategori &amp; Judul</th>
                    <th className="px-4 py-2.5">Author &amp; Terbit</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((d) => {
                    const cat = DOCUMENT_CATEGORY_META[d.category];
                    const st = DOCUMENT_STATUS_META[d.status];
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{d.docNumber} ({d.revision})</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn("mr-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", cat.badgeClass)}>
                            {cat.label}
                          </span>
                          <span className="font-medium text-foreground">{d.title}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{d.authorName} · {d.issueDate}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", st.badgeClass)}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
