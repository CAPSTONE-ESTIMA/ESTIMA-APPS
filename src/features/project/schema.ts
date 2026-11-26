import { z } from "zod";

export const projectStatusValues = ["draft", "active", "completed", "archived"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Kode proyek minimal 2 karakter.")
    .max(40, "Kode proyek maksimal 40 karakter.")
    .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya boleh huruf, angka, tanda hubung (-), atau garis bawah (_)."),
  name: z
    .string()
    .trim()
    .min(3, "Nama proyek minimal 3 karakter.")
    .max(200, "Nama proyek maksimal 200 karakter."),
  client: z
    .string()
    .trim()
    .min(2, "Nama klien minimal 2 karakter.")
    .max(200, "Nama klien maksimal 200 karakter."),
  location: z
    .string()
    .trim()
    .max(200, "Lokasi maksimal 200 karakter.")
    .optional()
    .or(z.literal("")),
  status: z.enum(projectStatusValues),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string | null;
  status: ProjectStatus;
  role: "manager" | "planner" | "supervisor" | "inspector" | "viewer";
  createdAt: string;
}
