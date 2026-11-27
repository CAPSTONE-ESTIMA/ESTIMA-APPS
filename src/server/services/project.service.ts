import "server-only";
import { cookies } from "next/headers";
import { requireProjectAccess, requireSession } from "@/server/auth/authorization";
import {
  createProjectWithOwner,
  findMembersOfProject,
  findProjectByIdForUser,
  findProjectByIdOrCodeForUser,
  findProjectsForUser,
  updateProjectConfigurationRecord,
  updateProjectRecord,
  updateProjectStatusRecord,
} from "@/server/repositories/project.repository";
import {
  normalizeProjectConfig,
  projectConfigSchema,
  projectInputSchema,
  type ProjectConfiguration,
  type ProjectDetail,
  type ProjectInput,
  type ProjectStatus,
  type ProjectSummary,
} from "@/features/project/schema";

export const ACTIVE_PROJECT_COOKIE = "estima_active_project_id";

export async function listMyProjects(): Promise<ProjectSummary[]> {
  const session = await requireSession();
  const rows = await findProjectsForUser(session.user.id);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getProjectDetailByKey(keyOrId: string): Promise<ProjectDetail | null> {
  const session = await requireSession();
  const row = await findProjectByIdOrCodeForUser(decodeURIComponent(keyOrId), session.user.id);
  if (!row) return null;

  const members = await findMembersOfProject(row.id);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    configuration: normalizeProjectConfig(row.configuration),
    members,
  };
}

export async function getActiveProjectId(projectsList?: ProjectSummary[]): Promise<string | null> {
  const list = projectsList ?? (await listMyProjects());
  if (list.length === 0) return null;

  const cookieStore = await cookies();
  const savedId = cookieStore.get(ACTIVE_PROJECT_COOKIE)?.value;
  if (savedId && list.some((p) => p.id === savedId)) {
    return savedId;
  }

  const firstActive = list.find((p) => p.status === "active") ?? list[0];
  return firstActive?.id ?? null;
}

export async function setActiveProjectForUser(projectId: string) {
  const session = await requireSession();
  const project = await findProjectByIdForUser(projectId, session.user.id);
  if (!project) throw new Error("Proyek tidak ditemukan atau Anda tidak memiliki akses.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROJECT_COOKIE, project.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return project;
}

export async function createProject(rawInput: ProjectInput) {
  const session = await requireSession();
  const parsed = projectInputSchema.parse(rawInput);
  const created = await createProjectWithOwner(session.user.id, parsed);

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROJECT_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return created;
}

export async function updateProject(projectId: string, rawInput: ProjectInput) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  const parsed = projectInputSchema.parse(rawInput);
  return updateProjectRecord(projectId, session.user.id, parsed);
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  return updateProjectStatusRecord(projectId, session.user.id, status);
}

export async function updateProjectConfiguration(
  projectId: string,
  rawConfig: ProjectConfiguration
) {
  const { session } = await requireProjectAccess(projectId, ["manager"]);
  const parsed = projectConfigSchema.parse(rawConfig);
  return updateProjectConfigurationRecord(projectId, session.user.id, parsed);
}
