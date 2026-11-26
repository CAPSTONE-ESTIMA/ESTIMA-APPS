import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, projectMembers, projects } from "@/server/db/schema";
import type { ProjectInput, ProjectStatus } from "@/features/project/schema";

export async function findProjectsForUser(userId: string) {
  return getDb()
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      client: projects.client,
      location: projects.location,
      status: projects.status,
      role: projectMembers.role,
      createdAt: projects.createdAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function findProjectByIdForUser(projectId: string, userId: string) {
  const rows = await getDb()
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      client: projects.client,
      location: projects.location,
      status: projects.status,
      role: projectMembers.role,
      createdAt: projects.createdAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProjectWithOwner(userId: string, input: ProjectInput) {
  const normalizedCode = input.code.trim().toUpperCase();
  const normalizedLocation = input.location?.trim() || null;

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(projects)
      .values({
        code: normalizedCode,
        name: input.name.trim(),
        client: input.client.trim(),
        location: normalizedLocation,
        status: input.status,
      })
      .returning();

    await tx.insert(projectMembers).values({
      projectId: created.id,
      userId,
      role: "manager",
    });

    await tx.insert(auditLogs).values({
      projectId: created.id,
      actorId: userId,
      action: "project.created",
      entityType: "project",
      entityId: created.id,
      metadata: {
        code: created.code,
        name: created.name,
        client: created.client,
        status: created.status,
      },
    });

    return created;
  });
}

export async function updateProjectRecord(projectId: string, actorId: string, input: ProjectInput) {
  const normalizedCode = input.code.trim().toUpperCase();
  const normalizedLocation = input.location?.trim() || null;

  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(projects)
      .set({
        code: normalizedCode,
        name: input.name.trim(),
        client: input.client.trim(),
        location: normalizedLocation,
        status: input.status,
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) throw new Error("Project not found");

    await tx.insert(auditLogs).values({
      projectId: updated.id,
      actorId,
      action: "project.updated",
      entityType: "project",
      entityId: updated.id,
      metadata: {
        code: updated.code,
        name: updated.name,
        client: updated.client,
        status: updated.status,
      },
    });

    return updated;
  });
}

export async function updateProjectStatusRecord(projectId: string, actorId: string, status: ProjectStatus) {
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(projects)
      .set({ status })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) throw new Error("Project not found");

    await tx.insert(auditLogs).values({
      projectId: updated.id,
      actorId,
      action: "project.status_changed",
      entityType: "project",
      entityId: updated.id,
      metadata: { status },
    });

    return updated;
  });
}
