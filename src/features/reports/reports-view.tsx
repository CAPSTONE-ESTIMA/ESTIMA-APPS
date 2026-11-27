"use client";

import Link from "next/link";
import {
  Download,
  Printer,
  FolderKanban,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/features/project/schema";
import { calcScaffoldVolume, type ScaffoldItem } from "@/features/scaffolding/schema";
import type { InsulationWorkItem } from "@/features/insulation/schema";
import type { PlanningActivityItem } from "@/features/planning/schema";
import type { DailyReportItem } from "@/features/daily-reports/schema";
import type { ManpowerItem } from "@/features/manpower/schema";
import type { MaterialItem } from "@/features/materials/schema";
import type { QaInspectionItem } from "@/features/quality/schema";
import type { PunchItemRecord } from "@/features/punchlist/schema";

interface ReportsViewProps {
  activeProject: ProjectSummary | null;
  scaffolds: ScaffoldItem[];
  insulation: InsulationWorkItem[];
  planning: PlanningActivityItem[];
  dailyReports: DailyReportItem[];
  manpower: ManpowerItem[];
  materials: MaterialItem[];
  qaInspections: QaInspectionItem[];
  punchItems: PunchItemRecord[];
}

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const bom = "\uFEFF";
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ];
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsView({
  activeProject,
  scaffolds,
  insulation,
  planning,
  dailyReports,
  manpower,
  materials,
  qaInspections,
  punchItems,
}: ReportsViewProps) {
  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Reports
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Project Reports &amp; Exports</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Laporan eksekutif dan export spreadsheet (CSV/Excel) dibuat berdasarkan data proyek aktif.
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

  const today = new Date().toISOString().slice(0, 10);
  const code = activeProject.code;

  const totalPlanWeight = planning.reduce((s, a) => s + a.weightPercent, 0);
  const weightedPlan =
    totalPlanWeight > 0
      ? Number(
          (
            planning.reduce((s, a) => s + a.plannedProgress * a.weightPercent, 0) / totalPlanWeight
          ).toFixed(1)
        )
      : 0;
  const weightedActual =
    totalPlanWeight > 0
      ? Number(
          (
            planning.reduce((s, a) => s + a.actualProgress * a.weightPercent, 0) / totalPlanWeight
          ).toFixed(1)
        )
      : 0;
  const greenScaffolds = scaffolds.filter((s) => s.tagStatus === "green").length;
  const scaffoldVol = Number(
    scaffolds
      .filter((s) => s.status !== "closed")
      .reduce((s, x) => s + calcScaffoldVolume(x.lengthM, x.widthM, x.heightM), 0)
      .toFixed(1)
  );
  const avgIns =
    insulation.length > 0
      ? Math.round(insulation.reduce((s, i) => s + i.progressPercent, 0) / insulation.length)
      : 0;
  const totalManhours = Number(
    (
      dailyReports.reduce((s, r) => s + r.regularHours + r.overtimeHours, 0) +
      manpower.reduce((s, m) => s + m.regularHoursTotal + m.overtimeHoursTotal, 0)
    ).toFixed(1)
  );
  const lowStock = materials.filter((m) => m.stockAvailable <= m.minStock).length;
  const qaPassed = qaInspections.filter((q) => q.result === "passed").length;
  const openPunch = punchItems.filter((p) => p.status !== "closed").length;
  const catAOpen = punchItems.filter((p) => p.category === "cat_a" && p.status !== "closed").length;

  const exportCatalog = [
    {
      title: "Scaffold Register Report",
      desc: "Daftar unit scaffold, dimensi, volume m³, ScaffTag, status, dan jadwal inspeksi.",
      count: `${scaffolds.length} unit · ${scaffoldVol} m³`,
      onExport: () =>
        downloadCsv(
          `${code}_scaffold_report_${today}.csv`,
          ["Scaffold ID", "Area", "Location", "Type", "Load Class", "L(m)", "W(m)", "H(m)", "Volume(m3)", "Tag", "Status", "Last Insp", "Next Insp"],
          scaffolds.map((s) => [
            s.scaffoldCode, s.area, s.location, s.scaffoldType, s.loadClass,
            s.lengthM, s.widthM, s.heightM, calcScaffoldVolume(s.lengthM, s.widthM, s.heightM),
            s.tagStatus, s.status, s.lastInspectionDate ?? "", s.nextInspectionDate ?? "",
          ])
        ),
    },
    {
      title: "Insulation Progress Report",
      desc: "Register work item insulasi, spesifikasi material, thickness, cladding, qty, dan progress %.",
      count: `${insulation.length} item · avg ${avgIns}%`,
      onExport: () =>
        downloadCsv(
          `${code}_insulation_report_${today}.csv`,
          ["Work Code", "Area", "Work Package", "Equipment/Line", "Type", "Material", "Thickness(mm)", "Cladding", "Qty", "Unit", "Stage", "Progress(%)"],
          insulation.map((i) => [
            i.workCode, i.area, i.workPackage, i.equipmentOrLine, i.insulationType,
            i.material, i.thicknessMm, i.claddingType, i.quantity, i.unit, i.status, i.progressPercent,
          ])
        ),
    },
    {
      title: "Master Schedule & S-Curve Data",
      desc: "Baseline planned vs actual dates, bobot, persentase progres, dan kendala.",
      count: `${planning.length} aktivitas · Actual ${weightedActual}%`,
      onExport: () =>
        downloadCsv(
          `${code}_planning_report_${today}.csv`,
          ["Activity ID", "Name", "Area", "Work Package", "Discipline", "Weight(%)", "Planned Start", "Planned Finish", "Planned(%)", "Actual(%)", "Status", "Constraints"],
          planning.map((a) => [
            a.activityCode, a.name, a.area, a.workPackage, a.discipline, a.weightPercent,
            a.plannedStart, a.plannedFinish, a.plannedProgress, a.actualProgress, a.status, a.constraints ?? "",
          ])
        ),
    },
    {
      title: "Daily Progress & Manhour Log",
      desc: "Rekap laporan harian per shift, POB, jam kerja regular/OT, cuaca, dan catatan HSE.",
      count: `${dailyReports.length} laporan`,
      onExport: () =>
        downloadCsv(
          `${code}_daily_reports_${today}.csv`,
          ["Report No", "Date", "Shift", "Weather", "Area", "Supervisor", "POB", "Regular Hrs", "OT Hrs", "Status", "Summary", "Constraints"],
          dailyReports.map((r) => [
            r.reportCode, r.reportDate, r.shift, r.weather, r.area, r.supervisorName,
            r.manpowerCount, r.regularHours, r.overtimeHours, r.status, r.activitiesSummary, r.constraints ?? "",
          ])
        ),
    },
    {
      title: "Manpower & Certification Register",
      desc: "Personel proyek, posisi, trade, crew, sertifikasi & masa berlaku, serta total manhours.",
      count: `${manpower.length} personel`,
      onExport: () =>
        downloadCsv(
          `${code}_manpower_report_${today}.csv`,
          ["Employee ID", "Full Name", "Position", "Trade", "Crew", "Certification", "Cert Expiry", "Mob Date", "Regular Hrs", "OT Hrs", "Status"],
          manpower.map((m) => [
            m.employeeCode, m.fullName, m.position, m.trade, m.crew,
            m.certification ?? "", m.certExpiry ?? "", m.mobilizationDate ?? "",
            m.regularHoursTotal, m.overtimeHoursTotal, m.status,
          ])
        ),
    },
    {
      title: "Material & Warehouse Stock Report",
      desc: "Saldo stok available/reserved/issued, minimum stock alert, dan lifecycle material.",
      count: `${materials.length} SKU · ${lowStock} low stock`,
      onExport: () =>
        downloadCsv(
          `${code}_materials_report_${today}.csv`,
          ["Material Code", "Name", "Category", "Warehouse", "Unit", "Available", "Reserved", "Issued", "Min Stock", "Lifecycle"],
          materials.map((m) => [
            m.materialCode, m.name, m.category, m.warehouse, m.unit,
            m.stockAvailable, m.stockReserved, m.stockIssued, m.minStock, m.lifecycleStatus,
          ])
        ),
    },
    {
      title: "QA/QC Inspection & NCR Report",
      desc: "Daftar RFI & NCR, referensi unit, inspector, hasil verifikasi, dan status Client Approval.",
      count: `${qaInspections.length} dokumen · ${qaPassed} passed`,
      onExport: () =>
        downloadCsv(
          `${code}_qaqc_report_${today}.csv`,
          ["RFI/NCR No", "Type", "Discipline", "Reference", "Area", "Title", "Inspector", "Date", "Result", "Client Approval", "Findings", "Corrective Action"],
          qaInspections.map((q) => [
            q.inspectionCode, q.recordType, q.discipline, q.referenceCode, q.area, q.title,
            q.inspectorName, q.inspectionDate, q.result, q.clientApproval, q.findings ?? "", q.correctiveAction ?? "",
          ])
        ),
    },
    {
      title: "Punch List & Handover Status",
      desc: "Temuan Cat A/B/C, prioritas, PIC, due date, status rework, dan verifikasi penutupan.",
      count: `${punchItems.length} temuan · ${openPunch} open`,
      onExport: () =>
        downloadCsv(
          `${code}_punchlist_report_${today}.csv`,
          ["Punch No", "Area", "Reference", "Category", "Priority", "Description", "PIC", "Due Date", "Status", "Corrective Action"],
          punchItems.map((p) => [
            p.punchCode, p.area, p.referenceCode, p.category, p.priority,
            p.description, p.picName, p.dueDate, p.status, p.correctiveAction ?? "",
          ])
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Reports
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Executive Project Control Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan performa lintas modul secara real-time, cetak laporan PDF, dan unduh spreadsheet CSV/Excel.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Executive Summary Banner */}
      <section className="rounded-md border border-border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase text-slate-500">
              EXECUTIVE SNAPSHOT · {today}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              [{activeProject.code}] {activeProject.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Klien: {activeProject.client} {activeProject.location ? `· ${activeProject.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {catAOpen > 0 || lowStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <AlertTriangle className="size-3.5" />
                {catAOpen} Cat A Blocker · {lowStock} Low Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Operasi Terkendali
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Schedule Progress</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{weightedActual}%</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Baseline: {weightedPlan}%</p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Scaffolding &amp; Insulation</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
              {greenScaffolds}/{scaffolds.length} <span className="text-sm font-normal text-slate-500">Green</span>
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {scaffoldVol} m³ · Insulasi avg {avgIns}%
            </p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Manhours</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
              {totalManhours.toLocaleString("id-ID")} hrs
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {manpower.length} personel · {dailyReports.length} daily reports
            </p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Quality &amp; Handover</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
              {qaPassed}/{qaInspections.length} <span className="text-sm font-normal text-slate-500">Passed</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {openPunch} open punch ({catAOpen} Cat A)
            </p>
          </div>
        </div>
      </section>

      {/* Export Center */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Export Spreadsheet Register (CSV / Excel)
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {exportCatalog.map((rep) => (
            <section
              key={rep.title}
              className="flex flex-col justify-between gap-4 rounded-md border border-border bg-white p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4 shrink-0 text-emerald-700" />
                  <h3 className="font-semibold text-foreground">{rep.title}</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{rep.desc}</p>
                <p className="mt-2 font-mono text-[11px] font-medium text-slate-600">{rep.count}</p>
              </div>
              <Button size="sm" variant="outline" onClick={rep.onExport} className="shrink-0">
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
