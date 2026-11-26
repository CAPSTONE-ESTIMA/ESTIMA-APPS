import { z } from "zod";

export const qaRecordTypeValues = ["inspection", "ncr"] as const;
export type QaRecordType = (typeof qaRecordTypeValues)[number];

export const qaDisciplineValues = [
  "scaffolding",
  "insulation",
  "material",
  "work_package",
] as const;
export type QaDiscipline = (typeof qaDisciplineValues)[number];

export const qaResultValues = [
  "pending",
  "passed",
  "conditional",
  "failed",
  "re_inspection",
] as const;
export type QaResult = (typeof qaResultValues)[number];

export const qaClientApprovalValues = ["pending", "approved", "rejected", "na"] as const;
export type QaClientApproval = (typeof qaClientApprovalValues)[number];

export const QA_DISCIPLINE_META: Record<QaDiscipline, { label: string; badgeClass: string }> = {
  scaffolding: { label: "Scaffolding", badgeClass: "border-sky-200 bg-sky-50 text-sky-800" },
  insulation: { label: "Insulation", badgeClass: "border-orange-200 bg-orange-50 text-orange-800" },
  material: { label: "Material Receiving", badgeClass: "border-violet-200 bg-violet-50 text-violet-800" },
  work_package: { label: "Work Package", badgeClass: "border-slate-200 bg-slate-100 text-slate-700" },
};

export const QA_RESULT_META: Record<QaResult, { label: string; badgeClass: string }> = {
  pending: { label: "Pending", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  passed: { label: "Passed", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  conditional: { label: "Conditional", badgeClass: "border-blue-200 bg-blue-50 text-blue-700" },
  failed: { label: "Failed / NCR", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  re_inspection: { label: "Re-inspection", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
};

export const QA_CLIENT_APPROVAL_META: Record<
  QaClientApproval,
  { label: string; badgeClass: string }
> = {
  pending: { label: "Pending Client", badgeClass: "border-amber-200 bg-amber-50 text-amber-800" },
  approved: { label: "Client Approved", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "Client Rejected", badgeClass: "border-red-200 bg-red-50 text-red-700" },
  na: { label: "Internal Only", badgeClass: "border-slate-200 bg-slate-100 text-slate-600" },
};

export const qaInputSchema = z.object({
  inspectionCode: z
    .string()
    .trim()
    .min(2, "Nomor RFI / NCR minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  recordType: z.enum(qaRecordTypeValues),
  discipline: z.enum(qaDisciplineValues),
  referenceCode: z.string().trim().min(2, "Referensi unit/line wajib diisi.").max(80),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  title: z.string().trim().min(3, "Judul inspeksi / NCR minimal 3 karakter.").max(200),
  inspectorName: z.string().trim().min(2, "Nama inspector wajib diisi.").max(120),
  inspectionDate: z.string().trim().min(8, "Tanggal inspeksi wajib diisi.").max(20),
  result: z.enum(qaResultValues),
  clientApproval: z.enum(qaClientApprovalValues),
  findings: z.string().trim().max(1000).optional().or(z.literal("")),
  correctiveAction: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type QaInput = z.infer<typeof qaInputSchema>;

export interface QaInspectionItem {
  id: string;
  projectId: string;
  inspectionCode: string;
  recordType: QaRecordType;
  discipline: QaDiscipline;
  referenceCode: string;
  area: string;
  title: string;
  inspectorName: string;
  inspectionDate: string;
  result: QaResult;
  clientApproval: QaClientApproval;
  findings: string | null;
  correctiveAction: string | null;
  createdAt: string;
  updatedAt: string;
}
