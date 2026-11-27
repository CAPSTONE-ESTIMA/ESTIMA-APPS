"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Loader2 } from "lucide-react";
import type { ProjectSummary } from "./schema";
import { selectActiveProjectAction } from "./actions";

interface ProjectSwitcherProps {
  projects: ProjectSummary[];
  activeProjectId: string | null;
}

export function ProjectSwitcher({ projects, activeProjectId }: ProjectSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (projects.length === 0) {
    return (
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-foreground"
      >
        <FolderKanban className="size-3.5 text-slate-400" />
        Belum ada proyek — Buat di Projects
      </Link>
    );
  }

  function handleChange(nextId: string) {
    if (!nextId || nextId === activeProjectId) return;
    startTransition(async () => {
      await selectActiveProjectAction(nextId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <label htmlFor="workspace-project-switcher" className="sr-only">
          Pilih Proyek Aktif
        </label>
        <select
          id="workspace-project-switcher"
          value={activeProjectId ?? ""}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value)}
          className="h-9 max-w-[260px] truncate rounded-md border border-slate-300 bg-slate-50 px-3 pr-8 text-sm font-medium text-foreground focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-60 sm:max-w-[340px]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.code}] {p.name}
            </option>
          ))}
        </select>
        {isPending && (
          <Loader2 className="pointer-events-none absolute right-2.5 size-3.5 animate-spin text-slate-500" />
        )}
      </div>
    </div>
  );
}
