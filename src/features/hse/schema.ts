import { z } from "zod";

export const hseRecordTypeValues = ["tbt", "ptw", "observation", "incident", "audit"] as const;
export type HseRecordType = (typeof hseRecordTypeValues)[number];

export const hseSeverityValues = ["info", "low", "medium", "high", "critical"] as const;
export type HseSeverity = (typeof hseSeverityValues)[number];

export const hseStatusValues = ["open", "in_progress", "closed"] as const;
export type HseStatus = (typeof hseStatusValues)[number];

export const HSE_TYPE_META: Record<HseRecordType, { label: string; badgeClass: string }> = {
  tbt: { label: "Toolbox Meeting (TBT)", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  ptw: { label: "Permit to Work (PTW)", badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  observation: { label: "HSE Observation", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  incident: { label: "Incident / Near Miss", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  audit: { label: "Safety Audit", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export const HSE_SEVERITY_META: Record<HseSeverity, { label: string; badgeClass: string }> = {
  info: { label: "Info", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
  low: { label: "Low", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  medium: { label: "Medium", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  high: { label: "High", badgeClass: "border-orange-200 bg-orange-50 text-orange-800" },
  critical: { label: "Critical", badgeClass: "border-red-200 bg-red-50 text-red-700" },
};

export const HSE_STATUS_META: Record<HseStatus, { label: string; badgeClass: string }> = {
  open: { label: "Open", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  in_progress: { label: "In Progress", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  closed: { label: "Closed", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export const hseInputSchema = z.object({
  recordCode: z
    .string()
    .trim()
    .min(2, "Nomor dokumen HSE minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  recordType: z.enum(hseRecordTypeValues),
  recordDate: z.string().trim().min(8, "Tanggal wajib diisi.").max(20),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  title: z.string().trim().min(3, "Judul / topik minimal 3 karakter.").max(200),
  picName: z.string().trim().min(2, "Nama HSE Officer / PIC wajib diisi.").max(120),
  attendeesCount: z.number().int().min(0).max(5000),
  severity: z.enum(hseSeverityValues),
  status: z.enum(hseStatusValues),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type HseInput = z.infer<typeof hseInputSchema>;

export interface HseRecordItem {
  id: string;
  projectId: string;
  recordCode: string;
  recordType: HseRecordType;
  recordDate: string;
  area: string;
  title: string;
  picName: string;
  attendeesCount: number;
  severity: HseSeverity;
  status: HseStatus;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}
