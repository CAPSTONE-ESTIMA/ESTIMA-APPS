import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getDb } from "@/server/db";
import { account, auditLogs, projectMembers, user } from "@/server/db/schema";
import type { CreateUserInput, ProjectRole } from "@/features/administration/schema";

export async function listAllUsersRecord() {
  return getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export async function listProjectMembersRecord(projectId: string) {
  return getDb()
    .select({
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      userName: user.name,
      userEmail: user.email,
    })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));
}

export async function listAuditLogsRecord(projectId: string | null, limitCount = 80) {
  const baseQuery = getDb()
    .select({
      id: auditLogs.id,
      projectId: auditLogs.projectId,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id));

  if (projectId) {
    return baseQuery
      .where(eq(auditLogs.projectId, projectId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitCount);
  }

  return baseQuery.orderBy(desc(auditLogs.createdAt)).limit(limitCount);
}

export async function createUserWithCredentialRecord(actorId: string, input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);
  const newUserId = randomUUID();

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(user)
      .values({
        id: newUserId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        emailVerified: false,
        systemRole: input.systemRole,
      })
      .returning();

    await tx.insert(account).values({
      id: randomUUID(),
      accountId: newUserId,
      providerId: "credential",
      userId: newUserId,
      password: passwordHash,
    });

    await tx.insert(auditLogs).values({
      actorId,
      action: "user.created",
      entityType: "user",
      entityId: newUserId,
      metadata: { email: created.email, systemRole: created.systemRole },
    });

    return created;
  });
}

export async function upsertProjectMemberRecord(
  actorId: string,
  projectId: string,
  userId: string,
  role: ProjectRole
) {
  return getDb().transaction(async (tx) => {
    await tx
      .insert(projectMembers)
      .values({ projectId, userId, role })
      .onConflictDoUpdate({
        target: [projectMembers.projectId, projectMembers.userId],
        set: { role },
      });

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "project_member.assigned",
      entityType: "project_member",
      entityId: `${projectId}:${userId}`,
      metadata: { userId, role },
    });
  });
}

export async function removeProjectMemberRecord(
  actorId: string,
  projectId: string,
  userId: string
) {
  return getDb().transaction(async (tx) => {
    await tx
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

    await tx.insert(auditLogs).values({
      projectId,
      actorId,
      action: "project_member.removed",
      entityType: "project_member",
      entityId: `${projectId}:${userId}`,
      metadata: { userId },
    });
  });
}
