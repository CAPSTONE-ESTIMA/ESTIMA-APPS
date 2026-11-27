import { z } from "zod";

export const documentCategoryValues = [
  "drawing",
  "isometric",
  "itp",
  "method_statement",
  "certificate",
  "transmittal",
  "other",
] as const;
export type DocumentCategory = (typeof documentCategoryValues)[number];

export const documentStatusValues = ["draft", "for_review", "approved", "superseded"] as const;
export type DocumentStatus = (typeof documentStatusValues)[number];

export const DOCUMENT_CATEGORY_META: Record<
  DocumentCategory,
  { label: string; badgeClass: string }
> = {
  drawing: { label: "Drawing", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  isometric: { label: "Isometric", badgeClass: "border-sky-200 bg-sky-50 text-sky-800" },
  itp: { label: "ITP / Checklist", badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  method_statement: {
    label: "Method Statement",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
  },
  certificate: { label: "Certificate", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  transmittal: { label: "Transmittal", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  other: { label: "Other", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
};

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; badgeClass: string }> = {
  draft: { label: "Draft", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
  for_review: { label: "For Review", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  approved: { label: "Approved (IFC)", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  superseded: { label: "Superseded", badgeClass: "border-red-200 bg-red-50 text-red-700" },
};

export const documentInputSchema = z.object({
  docNumber: z
    .string()
    .trim()
    .min(2, "Nomor dokumen minimal 2 karakter.")
    .max(50)
    .regex(/^[A-Za-z0-9_.-]+$/, "Gunakan huruf, angka, titik, -, atau _."),
  title: z.string().trim().min(3, "Judul dokumen minimal 3 karakter.").max(200),
  category: z.enum(documentCategoryValues),
  discipline: z.string().trim().min(2, "Disiplin wajib diisi.").max(60),
  revision: z.string().trim().min(1, "Revisi wajib diisi.").max(20),
  authorName: z.string().trim().min(2, "Nama pembuat/pengendali dokumen wajib diisi.").max(120),
  issueDate: z.string().trim().min(8, "Tanggal terbit wajib diisi.").max(20),
  fileUrl: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(documentStatusValues),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

export interface ProjectDocumentItem {
  id: string;
  projectId: string;
  docNumber: string;
  title: string;
  category: DocumentCategory;
  discipline: string;
  revision: string;
  authorName: string;
  issueDate: string;
  fileUrl: string | null;
  status: DocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
