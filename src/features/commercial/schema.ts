import { z } from "zod";

export const commercialTypeValues = [
  "boq",
  "variation_order",
  "progress_billing",
  "cost_entry",
] as const;
export type CommercialType = (typeof commercialTypeValues)[number];

export const commercialStatusValues = [
  "draft",
  "submitted",
  "approved",
  "invoiced",
  "paid",
  "rejected",
] as const;
export type CommercialStatus = (typeof commercialStatusValues)[number];

export const COMMERCIAL_TYPE_META: Record<CommercialType, { label: string; badgeClass: string }> = {
  boq: { label: "Contract BOQ", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  variation_order: { label: "Variation Order (VO)", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  progress_billing: { label: "Progress Billing", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  cost_entry: { label: "Cost / Expense", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
};

export const COMMERCIAL_STATUS_META: Record<
  CommercialStatus,
  { label: string; badgeClass: string }
> = {
  draft: { label: "Draft", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
  submitted: { label: "Submitted", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  approved: { label: "Approved", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  invoiced: { label: "Invoiced", badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  paid: { label: "Paid", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { label: "Rejected", badgeClass: "border-red-200 bg-red-50 text-red-700" },
};

export const commercialInputSchema = z.object({
  itemCode: z
    .string()
    .trim()
    .min(2, "Kode item minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  itemType: z.enum(commercialTypeValues),
  title: z.string().trim().min(3, "Deskripsi item minimal 3 karakter.").max(200),
  workPackage: z.string().trim().min(2, "Work package wajib diisi.").max(80),
  unit: z.string().trim().min(1, "Satuan wajib diisi.").max(20),
  quantity: z.number().positive("Quantity harus > 0").max(10_000_000),
  unitRateIdr: z.number().min(0).max(1_000_000_000_000),
  billedPercent: z.number().int().min(0).max(100),
  status: z.enum(commercialStatusValues),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CommercialInput = z.infer<typeof commercialInputSchema>;

export interface CommercialRecordItem {
  id: string;
  projectId: string;
  itemCode: string;
  itemType: CommercialType;
  title: string;
  workPackage: string;
  unit: string;
  quantity: number;
  unitRateIdr: number;
  billedPercent: number;
  status: CommercialStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
