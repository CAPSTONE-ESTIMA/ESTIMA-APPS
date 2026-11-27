import { z } from "zod";

export const planningDisciplineValues = [
  "scaffolding",
  "insulation",
  "general",
  "qa_qc",
] as const;
export type PlanningDiscipline = (typeof planningDisciplineValues)[number];

export const planningStatusValues = [
  "not_started",
  "on_track",
  "at_risk",
  "delayed",
  "completed",
] as const;
export type PlanningStatus = (typeof planningStatusValues)[number];

export const PLANNING_DISCIPLINE_META: Record<
  PlanningDiscipline,
  { label: string; badgeClass: string }
> = {
  scaffolding: {
    label: "Scaffolding",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
  },
  insulation: {
    label: "Insulation",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
  },
  general: {
    label: "General / Support",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
  },
  qa_qc: {
    label: "QA/QC Milestone",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
};

export const PLANNING_STATUS_META: Record<
  PlanningStatus,
  { label: string; badgeClass: string }
> = {
  not_started: {
    label: "Not Started",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
  on_track: {
    label: "On Track",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  at_risk: {
    label: "At Risk",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  delayed: {
    label: "Delayed",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
  },
  completed: {
    label: "Completed",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export const planningInputSchema = z.object({
  activityCode: z
    .string()
    .trim()
    .min(2, "Kode aktivitas minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  name: z.string().trim().min(3, "Nama aktivitas minimal 3 karakter.").max(200),
  area: z.string().trim().min(2, "Area wajib diisi.").max(120),
  workPackage: z.string().trim().min(2, "Work package wajib diisi.").max(80),
  discipline: z.enum(planningDisciplineValues),
  weightPercent: z.number().positive("Bobot harus > 0").max(100),
  plannedStart: z.string().trim().min(8, "Tanggal planned start wajib diisi.").max(20),
  plannedFinish: z.string().trim().min(8, "Tanggal planned finish wajib diisi.").max(20),
  actualStart: z.string().trim().max(20).optional().or(z.literal("")),
  actualFinish: z.string().trim().max(20).optional().or(z.literal("")),
  plannedProgress: z.number().int().min(0).max(100),
  actualProgress: z.number().int().min(0).max(100),
  status: z.enum(planningStatusValues),
  constraints: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PlanningInput = z.infer<typeof planningInputSchema>;

export interface PlanningActivityItem {
  id: string;
  projectId: string;
  activityCode: string;
  name: string;
  area: string;
  workPackage: string;
  discipline: PlanningDiscipline;
  weightPercent: number;
  plannedStart: string;
  plannedFinish: string;
  actualStart: string | null;
  actualFinish: string | null;
  plannedProgress: number;
  actualProgress: number;
  status: PlanningStatus;
  constraints: string | null;
  createdAt: string;
  updatedAt: string;
}
