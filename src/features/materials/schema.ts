import { z } from "zod";

export const materialCategoryValues = [
  "scaffolding",
  "insulation",
  "cladding",
  "consumables",
  "ppe_tools",
] as const;
export type MaterialCategory = (typeof materialCategoryValues)[number];

export const materialLifecycleValues = [
  "available",
  "reserved",
  "issued",
  "installed",
  "returned",
  "damaged_lost",
] as const;
export type MaterialLifecycle = (typeof materialLifecycleValues)[number];

export const MATERIAL_UNITS = ["m2", "m", "m3", "pcs", "roll", "sheet", "length", "box", "kg", "lot"] as const;

export const MATERIAL_CATEGORY_META: Record<
  MaterialCategory,
  { label: string; badgeClass: string }
> = {
  scaffolding: { label: "Scaffolding", badgeClass: "border-sky-200 bg-sky-50 text-sky-800" },
  insulation: { label: "Insulation", badgeClass: "border-orange-200 bg-orange-50 text-orange-800" },
  cladding: { label: "Cladding / Sheet", badgeClass: "border-violet-200 bg-violet-50 text-violet-800" },
  consumables: { label: "Consumables", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
  ppe_tools: { label: "PPE & Tools", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800" },
};

export const MATERIAL_LIFECYCLE_META: Record<
  MaterialLifecycle,
  { label: string; badgeClass: string }
> = {
  available: { label: "Available", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  reserved: { label: "Reserved", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  issued: { label: "Issued", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  installed: { label: "Installed / Erected", badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  returned: { label: "Returned", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
  damaged_lost: { label: "Damaged / Lost", badgeClass: "border-red-200 bg-red-50 text-red-700" },
};

export const materialInputSchema = z.object({
  materialCode: z
    .string()
    .trim()
    .min(2, "Material code minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  name: z.string().trim().min(2, "Nama material wajib diisi.").max(200),
  category: z.enum(materialCategoryValues),
  warehouse: z.string().trim().min(2, "Lokasi warehouse / laydown wajib diisi.").max(120),
  unit: z.string().trim().min(1, "Satuan wajib diisi.").max(20),
  stockAvailable: z.number().min(0).max(10_000_000),
  stockReserved: z.number().min(0).max(10_000_000),
  stockIssued: z.number().min(0).max(10_000_000),
  minStock: z.number().min(0).max(10_000_000),
  lifecycleStatus: z.enum(materialLifecycleValues),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MaterialInput = z.infer<typeof materialInputSchema>;

export interface MaterialItem {
  id: string;
  projectId: string;
  materialCode: string;
  name: string;
  category: MaterialCategory;
  warehouse: string;
  unit: string;
  stockAvailable: number;
  stockReserved: number;
  stockIssued: number;
  minStock: number;
  lifecycleStatus: MaterialLifecycle;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
