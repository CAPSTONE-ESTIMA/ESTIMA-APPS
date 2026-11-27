import { z } from "zod";

export const insulationTypeValues = [
  "hot",
  "cold",
  "cryogenic",
  "acoustic",
  "personnel_protection",
] as const;
export type InsulationType = (typeof insulationTypeValues)[number];

export const insulationUnitValues = ["m2", "m", "m3", "pcs", "lot"] as const;
export type InsulationUnit = (typeof insulationUnitValues)[number];

export const insulationStatusValues = [
  "not_started",
  "material_ready",
  "surface_ready",
  "insulation_installed",
  "cladding_installed",
  "qc_inspection",
  "punch_list",
  "completed",
] as const;
export type InsulationStatus = (typeof insulationStatusValues)[number];

export const INSULATION_TYPE_META: Record<
  InsulationType,
  { label: string; badgeClass: string }
> = {
  hot: {
    label: "Hot Thermal",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
  },
  cold: {
    label: "Cold Thermal",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
  },
  cryogenic: {
    label: "Cryogenic",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  acoustic: {
    label: "Acoustic",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
  },
  personnel_protection: {
    label: "Personnel Protection (PP)",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

export const INSULATION_UNIT_LABELS: Record<InsulationUnit, string> = {
  m2: "m²",
  m: "m",
  m3: "m³",
  pcs: "pcs",
  lot: "lot",
};

export const INSULATION_STATUS_META: Record<
  InsulationStatus,
  { label: string; badgeClass: string; defaultProgress: number }
> = {
  not_started: {
    label: "Not Started",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    defaultProgress: 0,
  },
  material_ready: {
    label: "Material Ready",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    defaultProgress: 15,
  },
  surface_ready: {
    label: "Surface Ready",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultProgress: 30,
  },
  insulation_installed: {
    label: "Insulation Installed",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultProgress: 60,
  },
  cladding_installed: {
    label: "Cladding Installed",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultProgress: 80,
  },
  qc_inspection: {
    label: "QC Inspection",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultProgress: 90,
  },
  punch_list: {
    label: "Punch List",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    defaultProgress: 95,
  },
  completed: {
    label: "Completed",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    defaultProgress: 100,
  },
};

export const insulationInputSchema = z.object({
  workCode: z
    .string()
    .trim()
    .min(2, "Kode work item minimal 2 karakter.")
    .max(40, "Kode work item maksimal 40 karakter.")
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_)."),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  workPackage: z.string().trim().min(2, "Work package wajib diisi.").max(80),
  equipmentOrLine: z.string().trim().min(2, "Equipment / Line Number wajib diisi.").max(160),
  insulationType: z.enum(insulationTypeValues),
  material: z.string().trim().min(2, "Material insulasi wajib diisi.").max(120),
  thicknessMm: z.number().int("Ketebalan harus bilangan bulat (mm).").positive("Ketebalan harus > 0").max(1000),
  claddingType: z.string().trim().min(2, "Tipe cladding/jacketing wajib diisi.").max(120),
  dimension: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z.number().positive("Quantity harus > 0").max(1_000_000),
  unit: z.enum(insulationUnitValues),
  status: z.enum(insulationStatusValues),
  progressPercent: z.number().int().min(0).max(100),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type InsulationInput = z.infer<typeof insulationInputSchema>;

export interface InsulationWorkItem {
  id: string;
  projectId: string;
  workCode: string;
  area: string;
  workPackage: string;
  equipmentOrLine: string;
  insulationType: InsulationType;
  material: string;
  thicknessMm: number;
  claddingType: string;
  dimension: string | null;
  quantity: number;
  unit: InsulationUnit;
  status: InsulationStatus;
  progressPercent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
