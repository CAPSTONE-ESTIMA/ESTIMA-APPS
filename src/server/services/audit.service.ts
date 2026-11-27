import "server-only";
import { getDb } from "@/server/db";
import { requireProjectAccess, requireSession } from "@/server/auth/authorization";
import {
  findAuditLogRecords,
  insertAuditLogRecord,
  type AuditDbExecutor,
} from "@/server/repositories/audit.repository";
import {
  buildAuditMetadata,
  extractAuditSummary,
} from "@/lib/audit-diff";

export interface AuditEventInput {
  projectId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  fields?: string[];
  ignoreFields?: string[];
}

export interface SerializedAuditLog {
  id: string;
  projectId: string | null;
  projectCode: string | null;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Reusable transactional audit helper for all ESTIMA modules.
 * Pass the active Drizzle transaction (`tx`) so the audit entry commits atomically
 * with the domain mutation.
 */
export async function writeAuditEvent(executor: AuditDbExecutor, input: AuditEventInput) {
  const structuredMetadata = buildAuditMetadata({
    action: input.action,
    entityType: input.entityType,
    before: input.before,
    after: input.after,
    summary: input.summary,
    extra: input.metadata,
    fields: input.fields,
    ignoreFields: input.ignoreFields,
  });

  return insertAuditLogRecord(executor, {
    projectId: input.projectId ?? null,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: structuredMetadata,
  });
}

/**
 * Standalone helper for emitting an immutable audit event outside an existing DB transaction.
 */
export async function recordAuditEvent(input: AuditEventInput) {
  return writeAuditEvent(getDb(), input);
}

export interface ListAuditTrailOptions {
  projectId?: string | null;
  entityType?: string | null;
  action?: string | null;
  limit?: number;
}

/**
 * Authorized read-only query service for ESTIMA Audit Trail.
 * - Project-scoped queries verify project membership via `requireProjectAccess`.
 * - Global queries (`projectId` omitted) require system administrator role.
 */
export async function listAuditTrail(
  options: ListAuditTrailOptions = {}
): Promise<SerializedAuditLog[]> {
  const session = await requireSession();
  const isSystemAdmin = (session.user as { systemRole?: string }).systemRole === "admin";

  if (options.projectId) {
    if (!isSystemAdmin) {
      await requireProjectAccess(options.projectId);
    }
  } else if (!isSystemAdmin) {
    throw new Error("Forbidden");
  }

  const rows = await findAuditLogRecords({
    projectId: options.projectId ?? null,
    entityType: options.entityType ?? null,
    action: options.action ?? null,
    limit: options.limit ?? 100,
  });

  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectCode: row.projectCode ?? null,
    actorId: row.actorId ?? null,
    actorName: row.actorName ?? null,
    actorEmail: row.actorEmail ?? null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: extractAuditSummary(row.metadata, row.action),
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Returns recent immutable audit events for a specific project (enforces membership check).
 */
export async function listProjectAuditHistory(
  projectId: string,
  limit = 15
): Promise<SerializedAuditLog[]> {
  await requireProjectAccess(projectId);
  const rows = await findAuditLogRecords({ projectId, limit });
  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectCode: row.projectCode ?? null,
    actorId: row.actorId ?? null,
    actorName: row.actorName ?? null,
    actorEmail: row.actorEmail ?? null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: extractAuditSummary(row.metadata, row.action),
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  }));
}
