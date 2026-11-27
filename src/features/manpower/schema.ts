import { z } from "zod";

export const manpowerTradeValues = [
  "scaffolding",
  "insulation",
  "cladding",
  "qa_qc",
  "hse",
  "helper",
  "supervision",
] as const;
export type ManpowerTrade = (typeof manpowerTradeValues)[number];

export const manpowerStatusValues = [
  "active",
  "standby",
  "on_leave",
  "demobilized",
] as const;
export type ManpowerStatus = (typeof manpowerStatusValues)[number];

export const MANPOWER_TRADE_META: Record<ManpowerTrade, { label: string; badgeClass: string }> = {
  scaffolding: { label: "Scaffolding", badgeClass: "border-sky-200 bg-sky-50 text-sky-800" },
  insulation: { label: "Insulation", badgeClass: "border-orange-200 bg-orange-50 text-orange-800" },
  cladding: { label: "Cladding / Sheet Metal", badgeClass: "border-violet-200 bg-violet-50 text-violet-800" },
  qa_qc: { label: "QA/QC Inspector", badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  hse: { label: "HSE Officer", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  helper: { label: "Helper / Rigger", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
  supervision: { label: "Supervision", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
};

export const MANPOWER_STATUS_META: Record<ManpowerStatus, { label: string; badgeClass: string }> = {
  active: { label: "Active (On Site)", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  standby: { label: "Standby", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  on_leave: { label: "On Leave", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  demobilized: { label: "Demobilized", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
};

export const manpowerInputSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(2, "Employee ID minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  fullName: z.string().trim().min(2, "Nama personel wajib diisi.").max(150),
  position: z.string().trim().min(2, "Jabatan wajib diisi.").max(120),
  trade: z.enum(manpowerTradeValues),
  crew: z.string().trim().min(2, "Crew / Tim wajib diisi.").max(100),
  certification: z.string().trim().max(160).optional().or(z.literal("")),
  certExpiry: z.string().trim().max(20).optional().or(z.literal("")),
  mobilizationDate: z.string().trim().max(20).optional().or(z.literal("")),
  regularHoursTotal: z.number().min(0).max(50000),
  overtimeHoursTotal: z.number().min(0).max(20000),
  status: z.enum(manpowerStatusValues),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ManpowerInput = z.infer<typeof manpowerInputSchema>;

export interface ManpowerItem {
  id: string;
  projectId: string;
  employeeCode: string;
  fullName: string;
  position: string;
  trade: ManpowerTrade;
  crew: string;
  certification: string | null;
  certExpiry: string | null;
  mobilizationDate: string | null;
  regularHoursTotal: number;
  overtimeHoursTotal: number;
  status: ManpowerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
