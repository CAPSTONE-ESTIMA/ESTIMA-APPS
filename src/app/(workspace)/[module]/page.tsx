import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Layers } from "lucide-react";
import { modules } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { requirePageSession } from "@/server/auth/session";
import { getActiveProjectId, listMyProjects } from "@/server/services/project.service";

const IMPLEMENTED_SLUGS = new Set([
  "dashboard",
  "projects",
  "scaffolding",
  "insulation",
  "planning",
  "daily-reports",
  "manpower",
  "materials",
  "quality",
  "punchlist",
  "hse",
  "commercial",
  "documents",
  "reports",
  "administration",
]);

const MODULE_SCOPE_PREVIEW: Record<string, string[]> = {
  hse: [
    "Toolbox Meeting (TBT) & attendance log harian",
    "Permit to Work (PTW) & JSA compliance tracker",
    "HSE observation card (unsafe act / unsafe condition)",
    "Incident reporting & Safe Manhours (Zero LTI) counter",
  ],
  commercial: [
    "Contract master, BOQ & unit rate register",
    "Progress billing valuation & monthly certificate",
    "Variation Order (VO) & additional work approval",
    "Cost vs Revenue tracking per work package",
  ],
  documents: [
    "Document Control register (Drawing, Isometric, ITP, Method Statement)",
    "Revision history & superseded version tracking",
    "Transmittal & client document approval workflow",
    "Lampiran file terintegrasi Object Storage",
  ],
};

export function generateStaticParams() {
  return modules
    .filter((m) => !IMPLEMENTED_SLUGS.has(m.slug))
    .map((m) => ({ module: m.slug }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  await requirePageSession();
  const { module: slug } = await params;
  const moduleInfo = modules.find((m) => m.slug === slug);
  if (!moduleInfo || IMPLEMENTED_SLUGS.has(slug)) notFound();

  const projects = await listMyProjects();
  const activeProjectId = await getActiveProjectId(projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const scopeItems = MODULE_SCOPE_PREVIEW[slug] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject ? `${activeProject.code} / ` : ""}
            {moduleInfo.name}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">{moduleInfo.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{moduleInfo.description}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            Kembali ke Dashboard <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <section className="rounded-md border border-border bg-white p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Layers className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Shell Navigasi Aktif · Menunggu Sprint Modul
            </span>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              Modul {moduleInfo.name} siap dikembangkan
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Halaman ini sudah terhubung dengan App Shell, proteksi session, dan konteks proyek aktif
              {activeProject ? ` (${activeProject.code} — ${activeProject.name})` : ""}.
            </p>

            {scopeItems.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cakupan Fitur PRD v1.2
                </p>
                <ul className="mt-2.5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {scopeItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
