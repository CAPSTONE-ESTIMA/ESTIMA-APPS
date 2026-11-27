import { z } from "zod";

export const shiftValues = ["day", "night"] as const;
export type ShiftType = (typeof shiftValues)[number];

export const weatherValues = ["clear", "cloudy", "rain", "storm", "high_wind"] as const;
export type WeatherType = (typeof weatherValues)[number];

export const dailyReportStatusValues = ["draft", "submitted", "approved", "rejected"] as const;
export type DailyReportStatus = (typeof dailyReportStatusValues)[number];

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: "Cerah (Clear)",
  cloudy: "Berawan (Cloudy)",
  rain: "Hujan (Rain)",
  storm: "Badai (Storm)",
  high_wind: "Angin Kencang (High Wind)",
};

export const DAILY_REPORT_STATUS_META: Record<
  DailyReportStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Draft",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
  submitted: {
    label: "Submitted",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  approved: {
    label: "Approved",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
  },
};

export const dailyReportInputSchema = z.object({
  reportCode: z
    .string()
    .trim()
    .min(2, "Nomor laporan minimal 2 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Gunakan huruf, angka, -, atau _."),
  reportDate: z.string().trim().min(8, "Tanggal laporan wajib diisi.").max(20),
  shift: z.enum(shiftValues),
  weather: z.enum(weatherValues),
  area: z.string().trim().min(2, "Area kerja wajib diisi.").max(120),
  supervisorName: z.string().trim().min(2, "Nama supervisor wajib diisi.").max(120),
  manpowerCount: z.number().int().min(0).max(5000),
  regularHours: z.number().min(0).max(50000),
  overtimeHours: z.number().min(0).max(20000),
  activitiesSummary: z.string().trim().min(5, "Ringkasan aktivitas harian wajib diisi.").max(1500),
  constraints: z.string().trim().max(800).optional().or(z.literal("")),
  safetyNotes: z.string().trim().max(800).optional().or(z.literal("")),
  status: z.enum(dailyReportStatusValues),
});

export type DailyReportInput = z.infer<typeof dailyReportInputSchema>;

export interface DailyReportItem {
  id: string;
  projectId: string;
  reportCode: string;
  reportDate: string;
  shift: ShiftType;
  weather: WeatherType;
  area: string;
  supervisorName: string;
  manpowerCount: number;
  regularHours: number;
  overtimeHours: number;
  activitiesSummary: string;
  constraints: string | null;
  safetyNotes: string | null;
  status: DailyReportStatus;
  createdAt: string;
  updatedAt: string;
}
