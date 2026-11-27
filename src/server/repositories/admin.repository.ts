import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getDb } from "@/server/db";
import { account, projectMembers, user } from "@/server/db/schema";
import { writeAuditEvent } from "@/server/services/audit.service";
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

    await writeAuditEvent(tx, {
      actorId,
      action: "user.created",
      entityType: "user",
      entityId: newUserId,
      summary: `Membuat akun staff ${created.name} (${created.email}) sebagai ${created.systemRole}`,
      after: {
        name: created.name,
        email: created.email,
        systemRole: created.systemRole,
      },
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
    const [existing] = await tx
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    await tx
      .insert(projectMembers)
      .values({ projectId, userId, role })
      .onConflictDoUpdate({
        target: [projectMembers.projectId, projectMembers.userId],
        set: { role },
      });

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: existing ? "project_member.role_updated" : "project_member.assigned",
      entityType: "project_member",
      entityId: `${projectId}:${userId}`,
      summary: existing
        ? `Role anggota diubah: ${existing.role} → ${role}`
        : `Menambahkan anggota proyek dengan role ${role}`,
      before: existing ? { userId, role: existing.role } : null,
      after: { userId, role },
    });
  });
}

export async function removeProjectMemberRecord(
  actorId: string,
  projectId: string,
  userId: string
) {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    await tx
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

    await writeAuditEvent(tx, {
      projectId,
      actorId,
      action: "project_member.removed",
      entityType: "project_member",
      entityId: `${projectId}:${userId}`,
      summary: `Mencabut akses anggota (sebelumnya ${existing?.role ?? "member"})`,
      before: { userId, role: existing?.role ?? null },
      after: null,
    });
  });
}
