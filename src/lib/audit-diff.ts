export interface AuditFieldChange {
  from: unknown;
  to: unknown;
}

export type AuditChangeMap = Record<string, AuditFieldChange>;

export interface AuditStructuredMetadata {
  summary?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: AuditChangeMap;
  [key: string]: unknown;
}

const DEFAULT_IGNORED_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "createdAt",
  "updatedAt",
]);

function stableSerialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableSerialize(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sanitizeSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
  ignoredFields: Set<string>
): Record<string, unknown> | null {
  if (!snapshot) return null;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (ignoredFields.has(key)) continue;
    clean[key] = value instanceof Date ? value.toISOString() : value;
  }
  return clean;
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number" || typeof value === "string") return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > 80 ? `${json.slice(0, 77)}…` : json;
  } catch {
    return String(value);
  }
}

export interface ComputeAuditDiffOptions {
  fields?: string[];
  ignoreFields?: string[];
}

export interface AuditDiffResult {
  changes: AuditChangeMap;
  changedFields: string[];
  summary: string;
}

/**
 * Pure helper to compute field-level before/after differences and a human-readable summary.
 */
export function computeAuditDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options?: ComputeAuditDiffOptions
): AuditDiffResult {
  const ignored = new Set(DEFAULT_IGNORED_FIELDS);
  for (const field of options?.ignoreFields ?? []) {
    ignored.add(field);
  }

  const safeBefore = sanitizeSnapshot(before, ignored) ?? {};
  const safeAfter = sanitizeSnapshot(after, ignored) ?? {};

  const candidateKeys = options?.fields
    ? options.fields.filter((f) => !ignored.has(f))
    : Array.from(new Set([...Object.keys(safeBefore), ...Object.keys(safeAfter)]));

  const changes: AuditChangeMap = {};
  const changedFields: string[] = [];

  for (const key of candidateKeys) {
    const prevVal = safeBefore[key] ?? null;
    const nextVal = safeAfter[key] ?? null;
    if (stableSerialize(prevVal) !== stableSerialize(nextVal)) {
      changes[key] = { from: prevVal, to: nextVal };
      changedFields.push(key);
    }
  }

  if (changedFields.length === 0) {
    return {
      changes,
      changedFields,
      summary: "Tidak ada perubahan nilai field.",
    };
  }

  const previewParts = changedFields.slice(0, 4).map((field) => {
    const { from, to } = changes[field];
    return `${field} (${formatAuditValue(from)} → ${formatAuditValue(to)})`;
  });
  const remainder = changedFields.length > 4 ? ` (+${changedFields.length - 4} field lain)` : "";

  return {
    changes,
    changedFields,
    summary: `Diubah: ${previewParts.join(", ")}${remainder}`,
  };
}

export interface BuildAuditMetadataInput {
  action: string;
  entityType: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  summary?: string;
  extra?: Record<string, unknown>;
  fields?: string[];
  ignoreFields?: string[];
}

/**
 * Builds a standardized, immutable metadata payload for `audit_logs.metadata`.
 */
export function buildAuditMetadata(input: BuildAuditMetadataInput): AuditStructuredMetadata {
  const ignored = new Set(DEFAULT_IGNORED_FIELDS);
  for (const field of input.ignoreFields ?? []) {
    ignored.add(field);
  }

  const cleanBefore = sanitizeSnapshot(input.before, ignored);
  const cleanAfter = sanitizeSnapshot(input.after, ignored);
  const cleanExtra = sanitizeSnapshot(input.extra, ignored);

  let changes: AuditChangeMap | undefined;
  let derivedSummary = input.summary?.trim();

  if (cleanBefore && cleanAfter) {
    const diff = computeAuditDiff(cleanBefore, cleanAfter, {
      fields: input.fields,
      ignoreFields: input.ignoreFields,
    });
    if (diff.changedFields.length > 0) {
      changes = diff.changes;
    }
    if (!derivedSummary) {
      derivedSummary = diff.summary;
    }
  } else if (!derivedSummary) {
    if (cleanAfter && !cleanBefore) {
      const label =
        cleanAfter.code ??
        cleanAfter.scaffoldCode ??
        cleanAfter.name ??
        cleanAfter.email ??
        cleanAfter.title;
      derivedSummary = label
        ? `Membuat ${input.entityType} (${formatAuditValue(label)})`
        : `Membuat ${input.entityType}`;
    } else if (cleanBefore && !cleanAfter) {
      const label =
        cleanBefore.code ??
        cleanBefore.scaffoldCode ??
        cleanBefore.name ??
        cleanBefore.email ??
        cleanBefore.title;
      derivedSummary = label
        ? `Menghapus ${input.entityType} (${formatAuditValue(label)})`
        : `Menghapus ${input.entityType}`;
    } else {
      derivedSummary = `${input.action} pada ${input.entityType}`;
    }
  }

  const result: AuditStructuredMetadata = {
    ...(cleanExtra ?? {}),
    summary: derivedSummary,
  };

  if (cleanBefore) result.before = cleanBefore;
  if (cleanAfter) result.after = cleanAfter;
  if (changes && Object.keys(changes).length > 0) result.changes = changes;

  return result;
}

/**
 * Extracts a clean change summary from either new structured audit metadata or legacy rows.
 */
export function extractAuditSummary(
  metadata: Record<string, unknown> | null | undefined,
  action?: string
): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return action ? `Event ${action}` : "—";
  }

  if (typeof metadata.summary === "string" && metadata.summary.trim().length > 0) {
    return metadata.summary.trim();
  }

  if (metadata.changes && typeof metadata.changes === "object" && !Array.isArray(metadata.changes)) {
    const entries = Object.entries(metadata.changes as Record<string, unknown>);
    if (entries.length > 0) {
      const parts = entries.slice(0, 3).map(([field, val]) => {
        if (val && typeof val === "object" && "from" in val && "to" in val) {
          const typed = val as AuditFieldChange;
          return `${field}: ${formatAuditValue(typed.from)} → ${formatAuditValue(typed.to)}`;
        }
        return field;
      });
      return `Diubah: ${parts.join(", ")}${entries.length > 3 ? ` (+${entries.length - 3})` : ""}`;
    }
  }

  const fallbackPairs = Object.entries(metadata)
    .filter(([k]) => k !== "before" && k !== "after" && k !== "changes" && k !== "summary")
    .slice(0, 3)
    .map(([k, v]) => `${k}=${formatAuditValue(v)}`);

  return fallbackPairs.length > 0 ? fallbackPairs.join(" · ") : action ?? "—";
}

export function extractAuditChanges(
  metadata: Record<string, unknown> | null | undefined
): { field: string; from: unknown; to: unknown }[] {
  if (!metadata || !metadata.changes || typeof metadata.changes !== "object") {
    return [];
  }
  const rows: { field: string; from: unknown; to: unknown }[] = [];
  for (const [field, val] of Object.entries(metadata.changes as Record<string, unknown>)) {
    if (val && typeof val === "object" && "from" in val && "to" in val) {
      const typed = val as AuditFieldChange;
      rows.push({ field, from: typed.from, to: typed.to });
    }
  }
  return rows;
}

export function humanizeAuditField(field: string): string {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface AuditSnapshotView {
  mode: "created" | "deleted" | "legacy";
  entries: { field: string; value: unknown }[];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Extracts structured key-value entries for create, delete, or legacy audit events
 * that do not contain a field-level before/after diff map.
 */
export function extractAuditSnapshot(
  metadata: Record<string, unknown> | null | undefined
): AuditSnapshotView | null {
  if (!metadata) return null;

  const after = isPlainRecord(metadata.after) ? metadata.after : null;
  const before = isPlainRecord(metadata.before) ? metadata.before : null;

  if (after && !before) {
    const entries = Object.entries(after).map(([field, value]) => ({ field, value }));
    return entries.length > 0 ? { mode: "created", entries } : null;
  }

  if (before && !after) {
    const entries = Object.entries(before).map(([field, value]) => ({ field, value }));
    return entries.length > 0 ? { mode: "deleted", entries } : null;
  }

  const fallbackEntries = Object.entries(metadata)
    .filter(([key]) => key !== "summary" && key !== "before" && key !== "after" && key !== "changes")
    .map(([field, value]) => ({ field, value }));

  return fallbackEntries.length > 0 ? { mode: "legacy", entries: fallbackEntries } : null;
}
