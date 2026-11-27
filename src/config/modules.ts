export type ModuleGroup = "overview" | "operations" | "resources" | "control" | "governance";

export type ModuleIconName =
  | "dashboard"
  | "projects"
  | "scaffolding"
  | "insulation"
  | "planning"
  | "daily-reports"
  | "manpower"
  | "materials"
  | "quality"
  | "punchlist"
  | "hse"
  | "commercial"
  | "documents"
  | "reports"
  | "administration";

export interface AppModule {
  slug: ModuleIconName;
  name: string;
  description: string;
  group: ModuleGroup;
  icon: ModuleIconName;
}

export const MODULE_GROUPS: { id: ModuleGroup; label: string }[] = [
  { id: "overview", label: "Workspace" },
  { id: "operations", label: "Field Operations" },
  { id: "resources", label: "Resources" },
  { id: "control", label: "Quality, Safety & Commercial" },
  { id: "governance", label: "Reporting & Admin" },
];

export const modules: readonly AppModule[] = [
  {
    slug: "dashboard",
    name: "Dashboard",
    description: "Ringkasan project control, KPI operasional, dan aktivitas lapangan.",
    group: "overview",
    icon: "dashboard",
  },
  {
    slug: "projects",
    name: "Projects",
    description: "Konfigurasi proyek, klien, lokasi, status, dan workspace aktif.",
    group: "overview",
    icon: "projects",
  },
  {
    slug: "scaffolding",
    name: "Scaffolding",
    description: "Scaffold register, ScaffTag (Green/Yellow/Red), dimensi volume, dan inspeksi.",
    group: "operations",
    icon: "scaffolding",
  },
  {
    slug: "insulation",
    name: "Insulation",
    description: "Work register Hot/Cold/Cryogenic/Acoustic insulation, cladding, dan progres QC.",
    group: "operations",
    icon: "insulation",
  },
  {
    slug: "planning",
    name: "Planning & Progress",
    description: "Master schedule baseline, planned vs actual progress, dan varians jadwal.",
    group: "operations",
    icon: "planning",
  },
  {
    slug: "daily-reports",
    name: "Daily Reports",
    description: "Laporan aktivitas harian per shift, manhour, cuaca, kendala, dan catatan HSE.",
    group: "operations",
    icon: "daily-reports",
  },
  {
    slug: "manpower",
    name: "Manpower",
    description: "Personel proyek, alokasi crew, masa berlaku sertifikasi, dan manhour.",
    group: "resources",
    icon: "manpower",
  },
  {
    slug: "materials",
    name: "Materials",
    description: "Register material warehouse, stok balance, low stock alert, dan lifecycle.",
    group: "resources",
    icon: "materials",
  },
  {
    slug: "quality",
    name: "QA/QC",
    description: "Inspection Request (RFI), Non-Conformance Report (NCR), dan Client Approval.",
    group: "control",
    icon: "quality",
  },
  {
    slug: "punchlist",
    name: "Punch List",
    description: "Temuan Cat A/B/C, penanggung jawab rework, verifikasi, dan closure handover.",
    group: "control",
    icon: "punchlist",
  },
  {
    slug: "hse",
    name: "HSE",
    description: "Toolbox meeting, PTW compliance, observasi keselamatan, dan pelacakan Zero LTI.",
    group: "control",
    icon: "hse",
  },
  {
    slug: "commercial",
    name: "Commercial",
    description: "Kontrak proyek, BOQ, progress billing, variation order, dan pengendalian biaya.",
    group: "control",
    icon: "commercial",
  },
  {
    slug: "documents",
    name: "Documents",
    description: "Document control, drawing isometric, ITP, prosedur kerja, dan histori revisi.",
    group: "control",
    icon: "documents",
  },
  {
    slug: "reports",
    name: "Reports",
    description: "Executive project control reports, cetak PDF, dan export spreadsheet CSV/Excel.",
    group: "governance",
    icon: "reports",
  },
  {
    slug: "administration",
    name: "Administration",
    description: "Manajemen akun staff, role proyek, kontrol akses, dan audit trail.",
    group: "governance",
    icon: "administration",
  },
] as const;
