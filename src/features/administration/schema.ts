import { z } from "zod";

export const systemRoleValues = ["admin", "member"] as const;
export type SystemRole = (typeof systemRoleValues)[number];

export const projectRoleValues = [
  "manager",
  "planner",
  "supervisor",
  "inspector",
  "viewer",
] as const;
export type ProjectRole = (typeof projectRoleValues)[number];

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid.")),
  password: z
    .string()
    .min(12, "Password minimal 12 karakter sesuai kebijakan keamanan Better Auth.")
    .max(128),
  systemRole: z.enum(systemRoleValues),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const assignMemberSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1, "Pilih user terlebih dahulu."),
  role: z.enum(projectRoleValues),
});

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  createdAt: string;
}

export interface ProjectMemberItem {
  projectId: string;
  userId: string;
  role: ProjectRole;
  userName: string;
  userEmail: string;
}

export interface AuditLogItem {
  id: string;
  projectId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
