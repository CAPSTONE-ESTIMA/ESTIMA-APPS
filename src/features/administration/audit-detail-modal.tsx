"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Code2, Copy, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  extractAuditChanges,
  extractAuditSnapshot,
  formatAuditValue,
  humanizeAuditField,
} from "@/lib/audit-diff";
import type { AuditLogItem } from "./schema";

interface AuditDetailModalProps {
  log: AuditLogItem;
  onClose: () => void;
}

export function AuditDetailModal({ log, onClose }: AuditDetailModalProps) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const changes = extractAuditChanges(log.metadata);
  const snapshot = changes.length === 0 ? extractAuditSnapshot(log.metadata) : null;

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in insecure context; ignore gracefully
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                {log.action}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                <Lock className="size-3" />
                Read-Only / Immutable
              </span>
            </div>
            <h2 id="audit-detail-title" className="mt-1.5 text-base font-semibold text-foreground">
              Detail Audit Event
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail audit"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {/* Summary */}
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Ringkasan Perubahan
            </p>
            <p className="mt-1 font-medium text-foreground">{log.summary}</p>
          </div>

          {/* Core Audit Attributes */}
          <dl className="grid gap-3 rounded-md border border-border p-3.5 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold uppercase text-muted-foreground">Timestamp (UTC)</dt>
              <dd className="mt-0.5 font-mono text-slate-800">
                {log.createdAt.replace("T", " ").slice(0, 19)} UTC
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase text-muted-foreground">Actor / User</dt>
              <dd className="mt-0.5 text-slate-800">
                {log.actorName ?? "System"}{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  ({log.actorEmail ?? log.actorId ?? "—"})
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase text-muted-foreground">Entity Type &amp; ID</dt>
              <dd className="mt-0.5 break-all font-mono text-slate-800">
                {log.entityType} · {log.entityId}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase text-muted-foreground">Project Scope</dt>
              <dd className="mt-0.5 font-mono text-slate-800">
                {log.projectCode ? `[${log.projectCode}]` : log.projectId ?? "Global / System"}
              </dd>
            </div>
          </dl>

          {/* Before / After Diff Table (Update events) */}
          {changes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Perubahan Field (Before → After)
              </p>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 font-semibold uppercase text-slate-600">
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Before</th>
                      <th className="px-3 py-2">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {changes.map((c) => (
                      <tr key={c.field}>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {humanizeAuditField(c.field)}
                        </td>
                        <td className="bg-red-50/50 px-3 py-2 font-mono text-red-700">
                          {formatAuditValue(c.from)}
                        </td>
                        <td className="bg-emerald-50/50 px-3 py-2 font-mono text-emerald-700">
                          {formatAuditValue(c.to)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Structured Key-Value Table (Create, Delete, or Legacy events) */}
          {snapshot && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {snapshot.mode === "created"
                    ? "Data Awal yang Dibuat"
                    : snapshot.mode === "deleted"
                    ? "Data Sebelum Dihapus"
                    : "Detail Data Tercatat"}
                </p>
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    snapshot.mode === "created"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : snapshot.mode === "deleted"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  )}
                >
                  {snapshot.mode === "created"
                    ? "Created Snapshot"
                    : snapshot.mode === "deleted"
                    ? "Deleted Snapshot"
                    : "Recorded Data"}
                </span>
              </div>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 font-semibold uppercase text-slate-600">
                      <th className="w-44 px-3 py-2">Field</th>
                      <th className="px-3 py-2">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {snapshot.entries.map((entry) => (
                      <tr key={entry.field}>
                        <td className="bg-slate-50/60 px-3 py-2 font-medium text-slate-700">
                          {humanizeAuditField(entry.field)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 font-mono",
                            snapshot.mode === "created"
                              ? "text-emerald-800"
                              : snapshot.mode === "deleted"
                              ? "text-red-800"
                              : "text-slate-800"
                          )}
                        >
                          {formatAuditValue(entry.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Collapsible Technical Raw JSON */}
          <div className="rounded-md border border-border bg-slate-50/60">
            <div className="flex items-center justify-between px-3 py-2">
              <button
                type="button"
                onClick={() => setShowRawJson((prev) => !prev)}
                aria-expanded={showRawJson}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-foreground"
              >
                {showRawJson ? (
                  <ChevronDown className="size-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="size-3.5 text-slate-500" />
                )}
                <Code2 className="size-3.5 text-slate-500" />
                {showRawJson ? "Sembunyikan Raw JSON" : "Lihat Raw JSON (Teknis)"}
              </button>

              {showRawJson && (
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Salin JSON
                    </>
                  )}
                </button>
              )}
            </div>

            {showRawJson && (
              <div className="border-t border-border p-3">
                <pre className="max-h-56 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-slate-50 px-5 py-3">
          <p className="font-mono text-[10px] text-muted-foreground">Event ID: {log.id}</p>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
