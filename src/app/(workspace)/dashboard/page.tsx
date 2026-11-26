import Link from "next/link";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";
import { listProjectScaffolds } from "@/server/services/scaffolding.service";
import { listProjectInsulationWorks } from "@/server/services/insulation.service";
import { listProjectPlanningActivities } from "@/server/services/planning.service";
import { listProjectDailyReports } from "@/server/services/daily-report.service";
import { listProjectManpower } from "@/server/services/manpower.service";
import { listProjectMaterials } from "@/server/services/material.service";
import { listProjectQaInspections } from "@/server/services/quality.service";
import { listProjectPunchItems } from "@/server/services/punchlist.service";
import { listProjectHseRecords } from "@/server/services/hse.service";
import { listProjectCommercialItems } from "@/server/services/commercial.service";
import { listProjectDocuments } from "@/server/services/document.service";
import { calcScaffoldVolume } from "@/features/scaffolding/schema";
import { DashboardModuleExplorer } from "@/features/dashboard/dashboard-module-explorer";

export default async function Dashboard() {
  await requirePageSession();
  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const activeCount = projects.filter((p) => p.status === "active").length;

  const [
    scaffolds,
    insulationItems,
    planningItems,
    dailyReports,
    manpowerItems,
    materialItems,
    qaInspections,
    punchItems,
    hseRecords,
    commercialItems,
    projectDocuments,
  ] = activeProject
    ? await Promise.all([
        listProjectScaffolds(activeProject.id),
        listProjectInsulationWorks(activeProject.id),
        listProjectPlanningActivities(activeProject.id),
        listProjectDailyReports(activeProject.id),
        listProjectManpower(activeProject.id),
        listProjectMaterials(activeProject.id),
        listProjectQaInspections(activeProject.id),
        listProjectPunchItems(activeProject.id),
        listProjectHseRecords(activeProject.id),
        listProjectCommercialItems(activeProject.id),
        listProjectDocuments(activeProject.id),
      ])
    : [[], [], [], [], [], [], [], [], [], [], []];

  const greenScaffolds = scaffolds.filter((s) => s.tagStatus === "green").length;
  const scaffoldVolume = Number(
    scaffolds
      .filter((s) => s.status !== "closed")
      .reduce((sum, s) => sum + calcScaffoldVolume(s.lengthM, s.widthM, s.heightM), 0)
      .toFixed(1)
  );

  const totalPlanWeight = planningItems.reduce((sum, a) => sum + a.weightPercent, 0);
  const weightedActualProgress =
    totalPlanWeight > 0
      ? Number(
          (
            planningItems.reduce((sum, a) => sum + a.actualProgress * a.weightPercent, 0) /
            totalPlanWeight
          ).toFixed(1)
        )
      : insulationItems.length > 0
      ? Math.round(
          insulationItems.reduce((sum, item) => sum + item.progressPercent, 0) /
            insulationItems.length
        )
      : null;

  const totalManhours = Number(
    (
      dailyReports.reduce((sum, r) => sum + r.regularHours + r.overtimeHours, 0) +
      manpowerItems.reduce((sum, m) => sum + m.regularHoursTotal + m.overtimeHoursTotal, 0)
    ).toFixed(1)
  );
  const activePob = manpowerItems.filter((m) => m.status === "active").length;
  const lowStockCount = materialItems.filter((m) => m.stockAvailable <= m.minStock).length;

  const pendingInspections =
    scaffolds.filter(
      (s) => s.status === "ready_for_inspection" || s.status === "re_inspection"
    ).length +
    insulationItems.filter((i) => i.status === "qc_inspection").length +
    qaInspections.filter((q) => q.result === "pending" || q.result === "re_inspection").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Project overview
        </p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pantau progres, sumber daya, material, dan tinjau isi seluruh modul dalam satu workspace.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border bg-white p-5">
          <h2 className="text-sm text-muted-foreground">Proyek aktif</h2>
          <p className="mt-4 font-mono text-3xl font-semibold">
            {projects.length > 0 ? activeCount : "—"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {projects.length > 0 ? `Dari total ${projects.length} proyek terdaftar` : "Belum ada data proyek"}
          </p>
        </section>

        <section className="rounded-md border bg-white p-5">
          <h2 className="text-sm text-muted-foreground">Actual progress</h2>
          <p className="mt-4 font-mono text-3xl font-semibold">
            {weightedActualProgress !== null ? `${weightedActualProgress}%` : "—"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {planningItems.length > 0
              ? `Weighted dari ${planningItems.length} aktivitas schedule`
              : insulationItems.length > 0
              ? `Rata-rata ${insulationItems.length} item insulasi`
              : activeProject
              ? "Belum ada data schedule / insulasi"
              : "Belum ada data proyek"}
          </p>
        </section>

        <section className="rounded-md border bg-white p-5">
          <h2 className="text-sm text-muted-foreground">Manhour &amp; POB</h2>
          <p className="mt-4 font-mono text-3xl font-semibold">
            {activeProject ? totalManhours.toLocaleString("id-ID") : "—"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {activeProject
              ? `${activePob} personel aktif · ${dailyReports.length} daily reports`
              : "Belum ada data proyek"}
          </p>
        </section>

        <section className="rounded-md border bg-white p-5">
          <h2 className="text-sm text-muted-foreground">Pending inspection &amp; Alerts</h2>
          <p className="mt-4 font-mono text-3xl font-semibold">
            {activeProject ? pendingInspections : "—"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {activeProject
              ? `Scaff Ready: ${greenScaffolds}/${scaffolds.length} (${scaffoldVolume} m³) · Low Stock: ${lowStockCount}`
              : "Belum ada data proyek"}
          </p>
        </section>
      </div>

      {/* Onboarding banner only when no project exists yet */}
      {!activeProject && (
        <section className="rounded-md border bg-white p-6 md:p-8">
          <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-slate-100">
            <FolderKanban className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">Mulai dari proyek pertama</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Tambahkan proyek pertama Anda untuk mulai mengaktifkan seluruh modul operasional.
          </p>
          <Button asChild className="mt-5">
            <Link href="/projects">
              Buka modul Projects <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </section>
      )}

      {/* Interactive Module Content Filter Explorer */}
      <DashboardModuleExplorer
        projects={projects}
        activeProject={activeProject}
        scaffolds={scaffolds}
        insulation={insulationItems}
        planning={planningItems}
        dailyReports={dailyReports}
        manpower={manpowerItems}
        materials={materialItems}
        qaInspections={qaInspections}
        punchItems={punchItems}
        hseRecords={hseRecords}
        commercialItems={commercialItems}
        documents={projectDocuments}
      />
    </div>
  );
}
