import "server-only";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, projects, user } from "@/server/db/schema";

/**
 * Compatible with both the root Drizzle DB instance (`getDb()`) and
 * an active Drizzle transaction handle (`tx` inside `getDb().transaction(...)`).
 */
export type AuditDbExecutor = Pick<ReturnType<typeof getDb>, "insert">;

export interface InsertAuditLogRecordInput {
  projectId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface FindAuditLogsFilter {
  projectId?: string | null;
  entityType?: string | null;
  action?: string | null;
  limit?: number;
}

/**
 * Append-only insert into `audit_logs`.
 * Intentionally no update or delete repository functions exist to enforce immutability.
 */
export async function insertAuditLogRecord(
  executor: AuditDbExecutor,
  entry: InsertAuditLogRecordInput
) {
  const [inserted] = await executor
    .insert(auditLogs)
    .values({
      projectId: entry.projectId ?? null,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
    })
    .returning();

  return inserted;
}

export async function findAuditLogRecords(filter: FindAuditLogsFilter = {}) {
  const safeLimit = Math.max(1, Math.min(filter.limit ?? 100, 500));
  const conditions: SQL[] = [];

  if (filter.projectId) {
    conditions.push(eq(auditLogs.projectId, filter.projectId));
  }
  if (filter.entityType) {
    conditions.push(eq(auditLogs.entityType, filter.entityType));
  }
  if (filter.action) {
    conditions.push(eq(auditLogs.action, filter.action));
  }

  const baseQuery = getDb()
    .select({
      id: auditLogs.id,
      projectId: auditLogs.projectId,
      projectCode: projects.code,
      actorId: auditLogs.actorId,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .leftJoin(projects, eq(auditLogs.projectId, projects.id));

  if (conditions.length > 0) {
    return baseQuery
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(safeLimit);
  }

  return baseQuery.orderBy(desc(auditLogs.createdAt)).limit(safeLimit);
}
