import "server-only";
import { requireProjectAccess, requireSession } from "@/server/auth/authorization";
import {
  createUserWithCredentialRecord,
  listAllUsersRecord,
  listProjectMembersRecord,
  removeProjectMemberRecord,
  upsertProjectMemberRecord,
} from "@/server/repositories/admin.repository";
import { listAuditTrail } from "@/server/services/audit.service";
import {
  assignMemberSchema,
  createUserSchema,
  type AdminUserItem,
  type AssignMemberInput,
  type AuditLogItem,
  type CreateUserInput,
  type ProjectMemberItem,
} from "@/features/administration/schema";

async function requireSystemAdmin() {
  const session = await requireSession();
  const role = (session.user as { systemRole?: string }).systemRole;
  if (role !== "admin") throw new Error("Forbidden");
  return session;
}

export async function getAdminOverview(activeProjectId: string | null): Promise<{
  isSystemAdmin: boolean;
  users: AdminUserItem[];
  members: ProjectMemberItem[];
  auditLogs: AuditLogItem[];
}> {
  const session = await requireSession();
  const isSystemAdmin = (session.user as { systemRole?: string }).systemRole === "admin";

  let canViewProject = false;
  if (activeProjectId) {
    try {
      await requireProjectAccess(activeProjectId);
      canViewProject = true;
    } catch {
      canViewProject = false;
    }
  }

  const [usersRaw, membersRaw, auditLogs] = await Promise.all([
    isSystemAdmin ? listAllUsersRecord() : Promise.resolve([]),
    activeProjectId && canViewProject ? listProjectMembersRecord(activeProjectId) : Promise.resolve([]),
    isSystemAdmin
      ? listAuditTrail({ projectId: null, limit: 150 })
      : activeProjectId && canViewProject
      ? listAuditTrail({ projectId: activeProjectId, limit: 150 })
      : Promise.resolve([]),
  ]);

  return {
    isSystemAdmin,
    users: usersRaw.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    members: membersRaw,
    auditLogs,
  };
}

export async function createStaffUser(rawInput: CreateUserInput) {
  const session = await requireSystemAdmin();
  const parsed = createUserSchema.parse(rawInput);
  return createUserWithCredentialRecord(session.user.id, parsed);
}

export async function assignProjectMember(rawInput: AssignMemberInput) {
  const parsed = assignMemberSchema.parse(rawInput);
  const { session } = await requireProjectAccess(parsed.projectId, ["manager"]);
  return upsertProjectMemberRecord(session.user.id, parsed.projectId, parsed.userId, parsed.role);
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  if (userId === session.user.id) {
    throw new Error("Anda tidak dapat menghapus akses diri sendiri dari proyek.");
  }
  return removeProjectMemberRecord(session.user.id, projectId, userId);
}
