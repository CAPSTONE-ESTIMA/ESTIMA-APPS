import { z } from "zod";

export const projectStatusValues = ["draft", "active", "completed", "archived"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectTemplateValues = [
  "scaffolding_insulation",
  "scaffolding_only",
  "insulation_only",
  "shutdown_maintenance",
] as const;
export type ProjectTemplate = (typeof projectTemplateValues)[number];

export const PROJECT_TEMPLATE_LABELS: Record<ProjectTemplate, string> = {
  scaffolding_insulation: "Oil & Gas — Scaffolding + Insulation",
  scaffolding_only: "Industrial — Scaffolding Only",
  insulation_only: "Industrial — Thermal & Acoustic Insulation",
  shutdown_maintenance: "Plant Turnaround / Shutdown Maintenance",
};

export const projectConfigSchema = z.object({
  template: z.enum(projectTemplateValues).default("scaffolding_insulation"),
  defaultUnit: z.enum(["m2", "m3", "m"]).default("m2"),
  scaffoldInspectionCycleDays: z.number().int().min(1).max(30).default(7),
  enabledModules: z
    .object({
      scaffolding: z.boolean().default(true),
      insulation: z.boolean().default(true),
      planning: z.boolean().default(true),
      dailyReports: z.boolean().default(true),
      manpower: z.boolean().default(true),
      materials: z.boolean().default(true),
      quality: z.boolean().default(true),
      punchlist: z.boolean().default(true),
      hse: z.boolean().default(true),
      commercial: z.boolean().default(true),
      documents: z.boolean().default(true),
    })
    .default({
      scaffolding: true,
      insulation: true,
      planning: true,
      dailyReports: true,
      manpower: true,
      materials: true,
      quality: true,
      punchlist: true,
      hse: true,
      commercial: true,
      documents: true,
    }),
  notes: z.string().trim().max(500).default(""),
});

export type ProjectConfiguration = z.infer<typeof projectConfigSchema>;

export function normalizeProjectConfig(raw: Record<string, unknown> | null | undefined): ProjectConfiguration {
  const parsed = projectConfigSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return projectConfigSchema.parse({});
}

export const projectInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Kode proyek minimal 2 karakter.")
      .max(40, "Kode proyek maksimal 40 karakter.")
      .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya boleh huruf, angka, tanda hubung (-), atau garis bawah (_)."),
    name: z
      .string()
      .trim()
      .min(3, "Nama proyek minimal 3 karakter.")
      .max(200, "Nama proyek maksimal 200 karakter."),
    client: z
      .string()
      .trim()
      .min(2, "Nama klien minimal 2 karakter.")
      .max(200, "Nama klien maksimal 200 karakter."),
    location: z
      .string()
      .trim()
      .max(200, "Lokasi maksimal 200 karakter.")
      .optional()
      .or(z.literal("")),
    startDate: z.string().trim().max(20).optional().or(z.literal("")),
    endDate: z.string().trim().max(20).optional().or(z.literal("")),
    status: z.enum(projectStatusValues),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "Tanggal selesai (End Date) tidak boleh lebih awal dari Start Date.",
      path: ["endDate"],
    }
  );

export type ProjectInput = z.infer<typeof projectInputSchema>;

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  role: "manager" | "planner" | "supervisor" | "inspector" | "viewer";
  createdAt: string;
}

export interface ProjectDetailMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: "manager" | "planner" | "supervisor" | "inspector" | "viewer";
}

export interface ProjectDetail extends ProjectSummary {
  configuration: ProjectConfiguration;
  members: ProjectDetailMember[];
}
