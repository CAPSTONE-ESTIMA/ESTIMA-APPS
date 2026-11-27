import "server-only";
import { and, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { projectMembers, projects, user } from "@/server/db/schema";
import { writeAuditEvent } from "@/server/services/audit.service";
import type {
  ProjectConfiguration,
  ProjectInput,
  ProjectStatus,
} from "@/features/project/schema";

export async function findProjectsForUser(userId: string) {
  return getDb()
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      client: projects.client,
      location: projects.location,
      startDate: projects.startDate,
      endDate: projects.endDate,
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
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      configuration: projects.configuration,
      role: projectMembers.role,
      createdAt: projects.createdAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProjectByIdOrCodeForUser(keyOrId: string, userId: string) {
  const normalizedCode = keyOrId.trim().toUpperCase();
  const rows = await getDb()
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      client: projects.client,
      location: projects.location,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      configuration: projects.configuration,
      role: projectMembers.role,
      createdAt: projects.createdAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(
      and(
        eq(projectMembers.userId, userId),
        or(eq(projects.id, keyOrId), eq(projects.code, normalizedCode))
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findMembersOfProject(projectId: string) {
  return getDb()
    .select({
      userId: projectMembers.userId,
      userName: user.name,
      userEmail: user.email,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));
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
        startDate: input.startDate?.trim() || null,
        endDate: input.endDate?.trim() || null,
        status: input.status,
      })
      .returning();

    await tx.insert(projectMembers).values({
      projectId: created.id,
      userId,
      role: "manager",
    });

    await writeAuditEvent(tx, {
      projectId: created.id,
      actorId: userId,
      action: "project.created",
      entityType: "project",
      entityId: created.id,
      summary: `Membuat proyek baru [${created.code}] ${created.name}`,
      after: {
        code: created.code,
        name: created.name,
        client: created.client,
        location: created.location,
        startDate: created.startDate,
        endDate: created.endDate,
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
    const [existing] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existing) throw new Error("Project not found");

    const [updated] = await tx
      .update(projects)
      .set({
        code: normalizedCode,
        name: input.name.trim(),
        client: input.client.trim(),
        location: normalizedLocation,
        startDate: input.startDate?.trim() || null,
        endDate: input.endDate?.trim() || null,
        status: input.status,
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) throw new Error("Project not found");

    await writeAuditEvent(tx, {
      projectId: updated.id,
      actorId,
      action: "project.updated",
      entityType: "project",
      entityId: updated.id,
      before: {
        code: existing.code,
        name: existing.name,
        client: existing.client,
        location: existing.location,
        startDate: existing.startDate,
        endDate: existing.endDate,
        status: existing.status,
      },
      after: {
        code: updated.code,
        name: updated.name,
        client: updated.client,
        location: updated.location,
        startDate: updated.startDate,
        endDate: updated.endDate,
        status: updated.status,
      },
    });

    return updated;
  });
}

export async function updateProjectStatusRecord(projectId: string, actorId: string, status: ProjectStatus) {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ status: projects.status, code: projects.code })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existing) throw new Error("Project not found");

    const [updated] = await tx
      .update(projects)
      .set({ status })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) throw new Error("Project not found");

    await writeAuditEvent(tx, {
      projectId: updated.id,
      actorId,
      action: "project.status_changed",
      entityType: "project",
      entityId: updated.id,
      summary: `Status proyek [${existing.code}] berubah: ${existing.status} → ${updated.status}`,
      before: { status: existing.status },
      after: { status: updated.status },
    });

    return updated;
  });
}

export async function updateProjectConfigurationRecord(
  projectId: string,
  actorId: string,
  configuration: ProjectConfiguration
) {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ configuration: projects.configuration, code: projects.code })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existing) throw new Error("Project not found");

    const [updated] = await tx
      .update(projects)
      .set({ configuration })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) throw new Error("Project not found");

    await writeAuditEvent(tx, {
      projectId: updated.id,
      actorId,
      action: "project.configuration_updated",
      entityType: "project",
      entityId: updated.id,
      before: existing.configuration,
      after: updated.configuration,
      metadata: {
        projectCode: existing.code,
      },
    });

    return updated;
  });
}
