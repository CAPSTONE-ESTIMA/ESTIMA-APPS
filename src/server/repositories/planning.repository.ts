import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, planningActivities } from "@/server/db/schema";
import type { PlanningInput, PlanningStatus } from "@/features/planning/schema";

export async function listPlanningByProject(projectId: string) {
  return getDb()
    .select()
    .from(planningActivities)
    .where(eq(planningActivities.projectId, projectId))
    .orderBy(asc(planningActivities.plannedStart), desc(planningActivities.createdAt));
}

export async function createPlanningRecord(
  projectId: string,
  actorId: string,
  input: PlanningInput
) {
  const code = input.activityCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(planningActivities)
      .values({
        projectId,
        activityCode: code,
        name: input.name.trim(),
        area: input.area.trim(),
        workPackage: input.workPackage.trim(),
        discipline: input.discipline,
        weightPercent: input.weightPercent,
        plannedStart: input.plannedStart.trim(),
        plannedFinish: input.plannedFinish.trim(),
        actualStart: input.actualStart?.trim() || null,
        actualFinish: input.actualFinish?.trim() || null,
        plannedProgress: input.plannedProgress,
        actualProgress: input.actualProgress,
        status: input.status,
        constraints: input.constraints?.trim() || null,
        createdBy: actorId,
      })
      .returning();

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "planning.created",
      entityType: "planning_activity",
      entityId: created.id,
      metadata: { activityCode: created.activityCode, status: created.status },
    });

    return created;
  });
}

export async function updatePlanningRecord(
  projectId: string,
  activityId: string,
  actorId: string,
  input: PlanningInput
) {
  const code = input.activityCode.trim().toUpperCase();

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(planningActivities)
      .set({
        activityCode: code,
        name: input.name.trim(),
        area: input.area.trim(),
        workPackage: input.workPackage.trim(),
        discipline: input.discipline,
        weightPercent: input.weightPercent,
        plannedStart: input.plannedStart.trim(),
        plannedFinish: input.plannedFinish.trim(),
        actualStart: input.actualStart?.trim() || null,
        actualFinish: input.actualFinish?.trim() || null,
        plannedProgress: input.plannedProgress,
        actualProgress: input.actualProgress,
        status: input.status,
        constraints: input.constraints?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(planningActivities.id, activityId), eq(planningActivities.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Aktivitas planning tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "planning.updated",
      entityType: "planning_activity",
      entityId: updated.id,
      metadata: {
        activityCode: updated.activityCode,
        actualProgress: updated.actualProgress,
        status: updated.status,
      },
    });

    return updated;
  });
}

export async function updatePlanningStatusRecord(
  projectId: string,
  activityId: string,
  actorId: string,
  status: PlanningStatus
) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(planningActivities)
      .set({
        status,
        actualProgress: status === "completed" ? 100 : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(planningActivities.id, activityId), eq(planningActivities.projectId, projectId)))
      .returning();

    if (!updated) throw new Error("Aktivitas planning tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "planning.status_changed",
      entityType: "planning_activity",
      entityId: updated.id,
      metadata: { activityCode: updated.activityCode, status },
    });

    return updated;
  });
}

export async function deletePlanningRecord(projectId: string, activityId: string, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [deleted] = await tx
      .delete(planningActivities)
      .where(and(eq(planningActivities.id, activityId), eq(planningActivities.projectId, projectId)))
      .returning();

    if (!deleted) throw new Error("Aktivitas planning tidak ditemukan.");

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "planning.deleted",
      entityType: "planning_activity",
      entityId: deleted.id,
      metadata: { activityCode: deleted.activityCode },
    });

    return deleted;
  });
}
