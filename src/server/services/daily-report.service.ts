import "server-only";
import { requireProjectAccess } from "@/server/auth/authorization";
import {
  createDailyReportRecord,
  deleteDailyReportRecord,
  listDailyReportsByProject,
  updateDailyReportRecord,
  updateDailyReportStatusRecord,
} from "@/server/repositories/daily-report.repository";
import {
  dailyReportInputSchema,
  type DailyReportInput,
  type DailyReportItem,
  type DailyReportStatus,
} from "@/features/daily-reports/schema";

const WRITE_ROLES = ["manager", "planner", "supervisor", "inspector"] as const;

export async function listProjectDailyReports(projectId: string): Promise<DailyReportItem[]> {
  await requireProjectAccess(projectId);
  const rows = await listDailyReportsByProject(projectId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createDailyReport(projectId: string, rawInput: DailyReportInput) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = dailyReportInputSchema.parse(rawInput);
  return createDailyReportRecord(projectId, session.user.id, parsed);
}

export async function updateDailyReport(
  projectId: string,
  reportId: string,
  rawInput: DailyReportInput
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  const parsed = dailyReportInputSchema.parse(rawInput);
  return updateDailyReportRecord(projectId, reportId, session.user.id, parsed);
}

export async function updateDailyReportStatus(
  projectId: string,
  reportId: string,
  status: DailyReportStatus
) {
  const { session } = await requireProjectAccess(projectId, [...WRITE_ROLES]);
  return updateDailyReportStatusRecord(projectId, reportId, session.user.id, status);
}

export async function deleteDailyReport(projectId: string, reportId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return deleteDailyReportRecord(projectId, reportId, session.user.id);
}
