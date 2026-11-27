import { z } from "zod";

export const scaffoldStatusValues = [
  "requested",
  "approved",
  "erection",
  "ready_for_inspection",
  "inspected",
  "ready_for_use",
  "modification",
  "re_inspection",
  "dismantling",
  "closed",
] as const;

export type ScaffoldStatus = (typeof scaffoldStatusValues)[number];

export const scaffoldTagValues = ["green", "yellow", "red", "none"] as const;
export type ScaffoldTagStatus = (typeof scaffoldTagValues)[number];

export const SCAFFOLD_TYPES = [
  "Independent",
  "Tower",
  "Birdcage",
  "Cantilever",
  "Suspended",
  "Mobile",
] as const;

export const LOAD_CLASSES = [
  "Light (1.5 kN/m²)",
  "Medium (2.0 kN/m²)",
  "Heavy (3.0 kN/m²)",
  "Special Duty",
] as const;

export const SCAFFOLD_STATUS_META: Record<
  ScaffoldStatus,
  { label: string; badgeClass: string; defaultTag: ScaffoldTagStatus }
> = {
  requested: {
    label: "Requested",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    defaultTag: "red",
  },
  approved: {
    label: "Approved",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultTag: "red",
  },
  erection: {
    label: "Erection",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultTag: "yellow",
  },
  ready_for_inspection: {
    label: "Ready for Inspection",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultTag: "red",
  },
  inspected: {
    label: "Inspected",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    defaultTag: "green",
  },
  ready_for_use: {
    label: "Ready for Use",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    defaultTag: "green",
  },
  modification: {
    label: "Modification",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultTag: "yellow",
  },
  re_inspection: {
    label: "Re-inspection",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultTag: "red",
  },
  dismantling: {
    label: "Dismantling",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    defaultTag: "red",
  },
  closed: {
    label: "Closed",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    defaultTag: "none",
  },
};

export const SCAFFOLD_TAG_META: Record<
  ScaffoldTagStatus,
  { label: string; shortLabel: string; dotClass: string; badgeClass: string }
> = {
  green: {
    label: "Green — Ready for Use",
    shortLabel: "GREEN",
    dotClass: "bg-emerald-500",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  yellow: {
    label: "Yellow — Caution / Erect",
    shortLabel: "YELLOW",
    dotClass: "bg-amber-500",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  red: {
    label: "Red — Do Not Use / Hold",
    shortLabel: "RED",
    dotClass: "bg-red-500",
    badgeClass: "border-red-200 bg-red-50 text-red-800",
  },
  none: {
    label: "No Tag / Closed",
    shortLabel: "NONE",
    dotClass: "bg-slate-400",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

export const scaffoldInputSchema = z.object({
  scaffoldCode: z
    .string()
    .trim()
    .min(2, "Scaffold ID minimal 2 karakter.")
    .max(40, "Scaffold ID maksimal 40 karakter.")
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_)."),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  location: z.string().trim().min(2, "Lokasi wajib diisi.").max(200),
  requester: z.string().trim().min(2, "Nama requester wajib diisi.").max(120),
  purpose: z.string().trim().max(240).optional().or(z.literal("")),
  scaffoldType: z.string().trim().min(2, "Tipe scaffold wajib dipilih.").max(60),
  loadClass: z.string().trim().min(2, "Load class wajib dipilih.").max(60),
  lengthM: z.number().positive("Panjang harus > 0").max(500),
  widthM: z.number().positive("Lebar harus > 0").max(500),
  heightM: z.number().positive("Tinggi harus > 0").max(200),
  tagStatus: z.enum(scaffoldTagValues),
  status: z.enum(scaffoldStatusValues),
  requiredDate: z.string().trim().max(20).optional().or(z.literal("")),
  lastInspectionDate: z.string().trim().max(20).optional().or(z.literal("")),
  nextInspectionDate: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ScaffoldInput = z.infer<typeof scaffoldInputSchema>;

export interface ScaffoldItem {
  id: string;
  projectId: string;
  scaffoldCode: string;
  area: string;
  location: string;
  requester: string;
  purpose: string | null;
  scaffoldType: string;
  loadClass: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  tagStatus: ScaffoldTagStatus;
  status: ScaffoldStatus;
  requiredDate: string | null;
  lastInspectionDate: string | null;
  nextInspectionDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function calcScaffoldVolume(lengthM: number, widthM: number, heightM: number) {
  return Number((lengthM * widthM * heightM).toFixed(2));
}
