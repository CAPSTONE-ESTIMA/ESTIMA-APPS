"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderKanban,
  ArrowUpRight,
  Package,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/project/schema";
import {
  MATERIAL_CATEGORY_META,
  MATERIAL_LIFECYCLE_META,
  materialLifecycleValues,
  type MaterialCategory,
  type MaterialItem,
  type MaterialLifecycle,
} from "./schema";
import { deleteMaterialAction, updateMaterialLifecycleAction } from "./actions";
import { MaterialFormModal } from "./material-form-modal";

interface MaterialsViewProps {
  activeProject: ProjectSummary | null;
  items: MaterialItem[];
}

const CATEGORY_FILTERS: { value: "all" | MaterialCategory; label: string }[] = [
  { value: "all", label: "Semua Kategori" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "insulation", label: "Insulation" },
  { value: "cladding", label: "Cladding" },
  { value: "consumables", label: "Consumables" },
  { value: "ppe_tools", label: "PPE & Tools" },
];

export function MaterialsView({ activeProject, items }: MaterialsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | MaterialCategory>("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const lowStock = items.filter((m) => m.stockAvailable <= m.minStock).length;
    const reservedItems = items.filter((m) => m.stockReserved > 0 || m.lifecycleStatus === "reserved").length;
    const issuedItems = items.filter((m) => m.stockIssued > 0 || m.lifecycleStatus === "issued").length;
    const damaged = items.filter((m) => m.lifecycleStatus === "damaged_lost").length;

    return {
      total: items.length,
      lowStock,
      reservedItems,
      issuedItems,
      damaged,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (onlyLowStock && m.stockAvailable > m.minStock) return false;
      if (!q) return true;
      return (
        m.materialCode.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.warehouse.toLowerCase().includes(q)
      );
    });
  }, [items, search, categoryFilter, onlyLowStock]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / Materials
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold">Material &amp; Warehouse</h1>
        </div>
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <FolderKanban className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Pilih atau buat proyek terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Stok gudang dan alokasi material proyek terikat pada proyek aktif.
          </p>
          <Button asChild className="mt-5">
            <Link href="/projects">
              Buka Modul Projects <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  const canWrite = ["manager", "planner", "supervisor"].includes(activeProject.role);
  const canDelete = activeProject.role === "manager";

  function handleInlineLifecycle(item: MaterialItem, nextStatus: MaterialLifecycle) {
    if (!activeProject || nextStatus === item.lifecycleStatus) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateMaterialLifecycleAction(activeProject.id, item.id, nextStatus);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({
        type: "success",
        text: `Lifecycle ${item.materialCode} diubah ke "${MATERIAL_LIFECYCLE_META[nextStatus].label}".`,
      });
      router.refresh();
    });
  }

  function handleDelete(item: MaterialItem) {
    if (!activeProject) return;
    if (!window.confirm(`Hapus material ${item.name} (${item.materialCode})?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteMaterialAction(activeProject.id, item.id);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: `Material ${item.materialCode} dihapus.` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            ESTIMA / {activeProject.code} / Materials
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Material Register &amp; Warehouse Stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring stok gudang (Available, Reserved, Issued), ambang batas Low Stock Alert, dan siklus pemakaian material.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah Material
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Item Material
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.total}</p>
          <p className="mt-2 text-xs text-muted-foreground">SKU terdaftar di warehouse proyek</p>
        </section>

        <section
          className={cn(
            "rounded-md border bg-white p-5",
            stats.lowStock > 0 ? "border-red-200" : "border-emerald-200"
          )}
        >
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              stats.lowStock > 0 ? "text-red-700" : "text-emerald-700"
            )}
          >
            Low Stock Alert
          </h2>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-semibold",
              stats.lowStock > 0 ? "text-red-700" : "text-emerald-700"
            )}
          >
            {stats.lowStock}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.lowStock > 0 ? "Available ≤ minimum stock" : "Semua stok di atas batas aman"}
          </p>
        </section>

        <section className="rounded-md border border-blue-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Reserved &amp; Issued
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-blue-700">
            {stats.reservedItems} / {stats.issuedItems}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Item teralokasi &amp; keluar lapangan</p>
        </section>

        <section className="rounded-md border border-border bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Damaged / Lost
          </h2>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{stats.damaged}</p>
          <p className="mt-2 text-xs text-muted-foreground">Item rusak atau hilang di lapangan</p>
        </section>
      </div>

      {feedback && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between rounded-md border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs font-medium underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode material, nama, atau warehouse..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyLowStock((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
              onlyLowStock
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            )}
          >
            <AlertTriangle className="size-3.5" />
            Low Stock Saja ({stats.lowStock})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategoryFilter(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                categoryFilter === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty State */}
      {items.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Package className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Belum ada material di gudang proyek ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tambahkan register material scaffolding, rockwool, aerogel, atau cladding untuk mulai melacak stok dan pemakaian.
          </p>
          {canWrite && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              Tambah Material Pertama
            </Button>
          )}
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-md border border-border bg-white p-8 text-center">
          <p className="text-sm font-medium">Tidak ada material yang cocok dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setOnlyLowStock(false);
            }}
            className="mt-2 text-xs font-medium text-blue-700 hover:underline"
          >
            Reset filter
          </button>
        </section>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Material Code</th>
                  <th className="px-4 py-3">Nama &amp; Warehouse</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Stock Balance</th>
                  <th className="px-4 py-3">Lifecycle</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const catMeta = MATERIAL_CATEGORY_META[item.category];
                  const lcMeta = MATERIAL_LIFECYCLE_META[item.lifecycleStatus];
                  const isLow = item.stockAvailable <= item.minStock;

                  return (
                    <tr key={item.id} className={cn("hover:bg-slate-50/80", isLow && "bg-red-50/30")}>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                          {item.materialCode}
                        </span>
                        {isLow && (
                          <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                            <AlertTriangle className="size-3" />
                            Low Stock
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Warehouse className="size-3.5 text-slate-400" />
                          {item.warehouse}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded border px-2 py-0.5 text-xs font-medium",
                            catMeta.badgeClass
                          )}
                        >
                          {catMeta.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs">
                        <p className={cn("font-semibold", isLow ? "text-red-700" : "text-foreground")}>
                          Avail: {item.stockAvailable.toLocaleString("id-ID")} {item.unit}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Res: {item.stockReserved} · Iss: {item.stockIssued} · Min: {item.minStock}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-top">
                        {canWrite ? (
                          <select
                            aria-label={`Ubah lifecycle ${item.materialCode}`}
                            value={item.lifecycleStatus}
                            disabled={isPending}
                            onChange={(e) =>
                              handleInlineLifecycle(item, e.target.value as MaterialLifecycle)
                            }
                            className={cn(
                              "h-8 rounded border px-2 text-xs font-medium focus:outline-none",
                              lcMeta.badgeClass
                            )}
                          >
                            {materialLifecycleValues.map((lc) => (
                              <option key={lc} value={lc} className="bg-white text-slate-900">
                                {MATERIAL_LIFECYCLE_META[lc].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("inline-flex rounded border px-2 py-0.5 text-xs font-medium", lcMeta.badgeClass)}>
                            {lcMeta.label}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                setEditing(item);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${item.materialCode}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleDelete(item)}
                              aria-label={`Hapus ${item.materialCode}`}
                            >
                              <Trash2 className="size-3.5 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <MaterialFormModal
          key={editing?.id ?? "new-material"}
          projectId={activeProject.id}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: editing
                ? `Material ${editing.materialCode} berhasil diperbarui.`
                : "Material baru berhasil ditambahkan ke warehouse.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
