import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, dailyReports } from "@/server/db/schema";
import type { DailyReportInput, DailyReportStatus } from "@/features/daily-reports/schema";

export async function listDailyReportsByProject(projectId: string) {
  return getDb()
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.projectId, projectId))
    .orderBy(desc(dailyReports.reportDate), desc(dailyReports.createdAt));
}

export async function createDailyReportRecord(
  projectId: string,
  actorId: string,
  input: DailyReportInput
) {
  const code = input.reportCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(dailyReports)
      .values({
        projectId,
        reportCode: code,
        reportDate: input.reportDate.trim(),
        shift: input.shift,
        weather: input.weather,
        area: input.area.trim(),
        supervisorName: input.supervisorName.trim(),
        manpowerCount: input.manpowerCount,
        regularHours: input.regularHours,
        overtimeHours: input.overtimeHours,
        activitiesSummary: input.activitiesSummary.trim(),
        constraints: input.constraints?.trim() || null,
        safetyNotes: input.safetyNotes?.trim() || null,
        status: input.status,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "daily_report.created",
      entityType: "daily_report",
      entityId: created.id,
      metadata: {
        reportCode: created.reportCode,
        reportDate: created.reportDate,
        status: created.status,
      },
    });

    return created;
  });
}

export async function updateDailyReportRecord(
  projectId: string,
  reportId: string,
  actorId: string,
  input: DailyReportInput
) {
  const code = input.reportCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(dailyReports)
      .set({
        reportCode: code,
        reportDate: input.reportDate.trim(),
        shift: input.shift,
        weather: input.weather,
        area: input.area.trim(),
        supervisorName: input.supervisorName.trim(),
        manpowerCount: input.manpowerCount,
        regularHours: input.regularHours,
        overtimeHours: input.overtimeHours,
        activitiesSummary: input.activitiesSummary.trim(),
        constraints: input.constraints?.trim() || null,
        safetyNotes: input.safetyNotes?.trim() || null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Daily report tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "daily_report.updated",
      entityType: "daily_report",
      entityId: updated.id,
      metadata: { reportCode: updated.reportCode, status: updated.status },
    });

    return updated;
  });
}

export async function updateDailyReportStatusRecord(
  projectId: string,
  reportId: string,
  actorId: string,
  status: DailyReportStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(dailyReports)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Daily report tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "daily_report.status_changed",
      entityType: "daily_report",
      entityId: updated.id,
      metadata: { reportCode: updated.reportCode, status },
    });

    return updated;
  });
}

export async function deleteDailyReportRecord(projectId: string, reportId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Daily report tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "daily_report.deleted",
      entityType: "daily_report",
      entityId: deleted.id,
      metadata: { reportCode: deleted.reportCode },
    });

    return deleted;
  });
}
