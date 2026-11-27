import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuditMetadata,
  computeAuditDiff,
  extractAuditChanges,
  extractAuditSnapshot,
  extractAuditSummary,
  humanizeAuditField,
} from "../../src/lib/audit-diff.ts";

test("computeAuditDiff detects changed fields and generates readable summary", () => {
  const before = {
    code: "PROJ-01",
    name: "Turnaround Plant A",
    status: "draft",
    endDate: null,
  };
  const after = {
    code: "PROJ-01",
    name: "Turnaround Plant A Rev 2",
    status: "active",
    endDate: "2026-12-31",
  };

  const diff = computeAuditDiff(before, after);

  assert.deepEqual(diff.changedFields, ["name", "status", "endDate"]);
  assert.deepEqual(diff.changes.status, { from: "draft", to: "active" });
  assert.deepEqual(diff.changes.endDate, { from: null, to: "2026-12-31" });
  assert.match(diff.summary, /status \(draft → active\)/);
  assert.match(diff.summary, /endDate \(— → 2026-12-31\)/);
});

test("computeAuditDiff ignores sensitive fields like password and token", () => {
  const diff = computeAuditDiff(
    { name: "Alice", password: "old-secret-password", token: "abc" },
    { name: "Alice", password: "new-secret-password", token: "xyz" }
  );

  assert.deepEqual(diff.changedFields, []);
  assert.equal(diff.changes.password, undefined);
  assert.equal(diff.changes.token, undefined);
});

test("buildAuditMetadata produces structured before/after/changes payload on update", () => {
  const meta = buildAuditMetadata({
    action: "project.updated",
    entityType: "project",
    before: { status: "draft", client: "Pertamina" },
    after: { status: "active", client: "Pertamina" },
  });

  assert.equal(meta.before?.status, "draft");
  assert.equal(meta.after?.status, "active");
  assert.deepEqual(meta.changes, {
    status: { from: "draft", to: "active" },
  });
  assert.match(meta.summary ?? "", /status \(draft → active\)/);
});

test("buildAuditMetadata handles nested configuration object comparison", () => {
  const meta = buildAuditMetadata({
    action: "project.configuration_updated",
    entityType: "project",
    before: { defaultUnit: "m2", enabledModules: { scaffolding: true, hse: true } },
    after: { defaultUnit: "m3", enabledModules: { scaffolding: true, hse: false } },
  });

  const changes = extractAuditChanges(meta);
  assert.equal(changes.length, 2);
  assert.equal(changes[0]?.field, "defaultUnit");
  assert.equal(changes[1]?.field, "enabledModules");
});

test("extractAuditSummary falls back gracefully for legacy audit metadata rows", () => {
  const summary = extractAuditSummary(
    { code: "KERKOM-YUK", name: "Kerkom", status: "active" },
    "project.created"
  );
  assert.match(summary, /code=KERKOM-YUK/);
  assert.match(summary, /status=active/);
});

test("extractAuditSnapshot and humanizeAuditField format create, delete, and legacy views cleanly", () => {
  const created = extractAuditSnapshot({
    summary: "Membuat proyek",
    after: { code: "PROJ-1", startDate: "2026-01-01" },
  });
  assert.equal(created?.mode, "created");
  assert.equal(created?.entries.length, 2);

  const legacy = extractAuditSnapshot({ code: "KERKOM-YUK", status: "active" });
  assert.equal(legacy?.mode, "legacy");
  assert.equal(legacy?.entries.length, 2);

  assert.equal(humanizeAuditField("startDate"), "Start Date");
  assert.equal(humanizeAuditField("scaffold_code"), "Scaffold Code");
});
