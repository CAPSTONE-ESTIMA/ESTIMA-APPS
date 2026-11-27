import { z } from "zod";

export const punchCategoryValues = ["cat_a", "cat_b", "cat_c"] as const;
export type PunchCategory = (typeof punchCategoryValues)[number];

export const punchPriorityValues = ["critical", "high", "medium", "low"] as const;
export type PunchPriority = (typeof punchPriorityValues)[number];

export const punchStatusValues = [
  "open",
  "assigned",
  "rework",
  "ready_for_inspection",
  "re_inspection",
  "rejected",
  "closed",
] as const;
export type PunchStatus = (typeof punchStatusValues)[number];

export const PUNCH_CATEGORY_META: Record<
  PunchCategory,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  cat_a: {
    label: "Cat A — Handover Blocker",
    shortLabel: "CAT A",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
  },
  cat_b: {
    label: "Cat B — Post-Handover",
    shortLabel: "CAT B",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  cat_c: {
    label: "Cat C — Minor / Cosmetic",
    shortLabel: "CAT C",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

export const PUNCH_PRIORITY_META: Record<PunchPriority, { label: string; badgeClass: string }> = {
  critical: { label: "Critical", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  high: { label: "High", badgeClass: "border-orange-200 bg-orange-50 text-orange-800" },
  medium: { label: "Medium", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  low: { label: "Low", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
};

export const PUNCH_STATUS_META: Record<PunchStatus, { label: string; badgeClass: string }> = {
  open: { label: "Open", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  assigned: { label: "Assigned", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  rework: { label: "Rework", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  ready_for_inspection: {
    label: "Ready for Inspection",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  re_inspection: {
    label: "Re-inspection",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  rejected: { label: "Rejected", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  closed: { label: "Closed", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export const punchInputSchema = z.object({
  punchCode: z
    .string()
    .trim()
    .min(2, "Nomor punch minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  referenceCode: z.string().trim().min(2, "Referensi unit/line wajib diisi.").max(80),
  category: z.enum(punchCategoryValues),
  priority: z.enum(punchPriorityValues),
  description: z.string().trim().min(5, "Deskripsi temuan minimal 5 karakter.").max(1000),
  picName: z.string().trim().min(2, "PIC penanggung jawab wajib diisi.").max(120),
  dueDate: z.string().trim().min(8, "Target due date wajib diisi.").max(20),
  correctiveAction: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(punchStatusValues),
});

export type PunchInput = z.infer<typeof punchInputSchema>;

export interface PunchItemRecord {
  id: string;
  projectId: string;
  punchCode: string;
  area: string;
  referenceCode: string;
  category: PunchCategory;
  priority: PunchPriority;
  description: string;
  picName: string;
  dueDate: string;
  correctiveAction: string | null;
  status: PunchStatus;
  createdAt: string;
  updatedAt: string;
}
