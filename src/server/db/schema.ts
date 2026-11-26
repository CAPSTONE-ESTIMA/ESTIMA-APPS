import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  integer,
  bigint,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  systemRole: text("system_role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rateLimit = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const account = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  client: text("client").notNull(),
  location: text("location"),
  status: text("status", { enum: ["draft", "active", "completed", "archived"] })
    .notNull()
    .default("draft"),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["manager", "planner", "supervisor", "inspector", "viewer"] })
      .notNull()
      .default("viewer"),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.userId] }),
    index("project_members_user_idx").on(t.userId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id").references(() => projects.id, { onDelete: "restrict" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_project_time_idx").on(t.projectId, t.createdAt)]
);

export const scaffolds = pgTable(
  "scaffolds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    scaffoldCode: text("scaffold_code").notNull(),
    area: text("area").notNull(),
    location: text("location").notNull(),
    requester: text("requester").notNull(),
    purpose: text("purpose"),
    scaffoldType: text("scaffold_type").notNull(),
    loadClass: text("load_class").notNull(),
    lengthM: doublePrecision("length_m").notNull(),
    widthM: doublePrecision("width_m").notNull(),
    heightM: doublePrecision("height_m").notNull(),
    tagStatus: text("tag_status", { enum: ["green", "yellow", "red", "none"] })
      .notNull()
      .default("red"),
    status: text("status", {
      enum: [
        "requested",
        "approved",
        "erection",
        "ready_for_inspection",
        "inspected",
        "ready_for_use",
        "modification",
        "re_inspection",
        "dismantling",
        "closed",
      ],
    })
      .notNull()
      .default("requested"),
    requiredDate: text("required_date"),
    lastInspectionDate: text("last_inspection_date"),
    nextInspectionDate: text("next_inspection_date"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("scaffolds_project_code_uq").on(t.projectId, t.scaffoldCode),
    index("scaffolds_project_status_idx").on(t.projectId, t.status),
  ]
);

export const insulationWorks = pgTable(
  "insulation_works",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    workCode: text("work_code").notNull(),
    area: text("area").notNull(),
    workPackage: text("work_package").notNull(),
    equipmentOrLine: text("equipment_or_line").notNull(),
    insulationType: text("insulation_type", {
      enum: ["hot", "cold", "cryogenic", "acoustic", "personnel_protection"],
    })
      .notNull()
      .default("hot"),
    material: text("material").notNull(),
    thicknessMm: integer("thickness_mm").notNull(),
    claddingType: text("cladding_type").notNull(),
    dimension: text("dimension"),
    quantity: doublePrecision("quantity").notNull(),
    unit: text("unit", { enum: ["m2", "m", "m3", "pcs", "lot"] })
      .notNull()
      .default("m2"),
    status: text("status", {
      enum: [
        "not_started",
        "material_ready",
        "surface_ready",
        "insulation_installed",
        "cladding_installed",
        "qc_inspection",
        "punch_list",
        "completed",
      ],
    })
      .notNull()
      .default("not_started"),
    progressPercent: integer("progress_percent").notNull().default(0),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("insulation_project_code_uq").on(t.projectId, t.workCode),
    index("insulation_project_status_idx").on(t.projectId, t.status),
  ]
);

export const planningActivities = pgTable(
  "planning_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    activityCode: text("activity_code").notNull(),
    name: text("name").notNull(),
    area: text("area").notNull(),
    workPackage: text("work_package").notNull(),
    discipline: text("discipline", {
      enum: ["scaffolding", "insulation", "general", "qa_qc"],
    })
      .notNull()
      .default("scaffolding"),
    weightPercent: doublePrecision("weight_percent").notNull().default(1),
    plannedStart: text("planned_start").notNull(),
    plannedFinish: text("planned_finish").notNull(),
    actualStart: text("actual_start"),
    actualFinish: text("actual_finish"),
    plannedProgress: integer("planned_progress").notNull().default(0),
    actualProgress: integer("actual_progress").notNull().default(0),
    status: text("status", {
      enum: ["not_started", "on_track", "at_risk", "delayed", "completed"],
    })
      .notNull()
      .default("not_started"),
    constraints: text("constraints"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("planning_project_code_uq").on(t.projectId, t.activityCode),
    index("planning_project_status_idx").on(t.projectId, t.status),
  ]
);

export const dailyReports = pgTable(
  "daily_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reportCode: text("report_code").notNull(),
    reportDate: text("report_date").notNull(),
    shift: text("shift", { enum: ["day", "night"] }).notNull().default("day"),
    weather: text("weather", {
      enum: ["clear", "cloudy", "rain", "storm", "high_wind"],
    })
      .notNull()
      .default("clear"),
    area: text("area").notNull(),
    supervisorName: text("supervisor_name").notNull(),
    manpowerCount: integer("manpower_count").notNull().default(0),
    regularHours: doublePrecision("regular_hours").notNull().default(0),
    overtimeHours: doublePrecision("overtime_hours").notNull().default(0),
    activitiesSummary: text("activities_summary").notNull(),
    constraints: text("constraints"),
    safetyNotes: text("safety_notes"),
    status: text("status", { enum: ["draft", "submitted", "approved", "rejected"] })
      .notNull()
      .default("draft"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_reports_project_code_uq").on(t.projectId, t.reportCode),
    index("daily_reports_project_date_idx").on(t.projectId, t.reportDate),
  ]
);

export const manpowerRecords = pgTable(
  "manpower_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    employeeCode: text("employee_code").notNull(),
    fullName: text("full_name").notNull(),
    position: text("position").notNull(),
    trade: text("trade", {
      enum: ["scaffolding", "insulation", "cladding", "qa_qc", "hse", "helper", "supervision"],
    })
      .notNull()
      .default("scaffolding"),
    crew: text("crew").notNull(),
    certification: text("certification"),
    certExpiry: text("cert_expiry"),
    mobilizationDate: text("mobilization_date"),
    regularHoursTotal: doublePrecision("regular_hours_total").notNull().default(0),
    overtimeHoursTotal: doublePrecision("overtime_hours_total").notNull().default(0),
    status: text("status", {
      enum: ["active", "standby", "on_leave", "demobilized"],
    })
      .notNull()
      .default("active"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("manpower_project_code_uq").on(t.projectId, t.employeeCode),
    index("manpower_project_status_idx").on(t.projectId, t.status),
  ]
);

export const materials = pgTable(
  "materials",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    materialCode: text("material_code").notNull(),
    name: text("name").notNull(),
    category: text("category", {
      enum: ["scaffolding", "insulation", "cladding", "consumables", "ppe_tools"],
    })
      .notNull()
      .default("insulation"),
    warehouse: text("warehouse").notNull(),
    unit: text("unit").notNull(),
    stockAvailable: doublePrecision("stock_available").notNull().default(0),
    stockReserved: doublePrecision("stock_reserved").notNull().default(0),
    stockIssued: doublePrecision("stock_issued").notNull().default(0),
    minStock: doublePrecision("min_stock").notNull().default(10),
    lifecycleStatus: text("lifecycle_status", {
      enum: ["available", "reserved", "issued", "installed", "returned", "damaged_lost"],
    })
      .notNull()
      .default("available"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("materials_project_code_uq").on(t.projectId, t.materialCode),
    index("materials_project_cat_idx").on(t.projectId, t.category),
  ]
);

export const qaInspections = pgTable(
  "qa_inspections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    inspectionCode: text("inspection_code").notNull(),
    recordType: text("record_type", { enum: ["inspection", "ncr"] })
      .notNull()
      .default("inspection"),
    discipline: text("discipline", {
      enum: ["scaffolding", "insulation", "material", "work_package"],
    })
      .notNull()
      .default("scaffolding"),
    referenceCode: text("reference_code").notNull(),
    area: text("area").notNull(),
    title: text("title").notNull(),
    inspectorName: text("inspector_name").notNull(),
    inspectionDate: text("inspection_date").notNull(),
    result: text("result", {
      enum: ["pending", "passed", "conditional", "failed", "re_inspection"],
    })
      .notNull()
      .default("pending"),
    clientApproval: text("client_approval", {
      enum: ["pending", "approved", "rejected", "na"],
    })
      .notNull()
      .default("pending"),
    findings: text("findings"),
    correctiveAction: text("corrective_action"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("qa_project_code_uq").on(t.projectId, t.inspectionCode),
    index("qa_project_result_idx").on(t.projectId, t.result),
  ]
);

export const punchItems = pgTable(
  "punch_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    punchCode: text("punch_code").notNull(),
    area: text("area").notNull(),
    referenceCode: text("reference_code").notNull(),
    category: text("category", { enum: ["cat_a", "cat_b", "cat_c"] })
      .notNull()
      .default("cat_a"),
    priority: text("priority", { enum: ["critical", "high", "medium", "low"] })
      .notNull()
      .default("high"),
    description: text("description").notNull(),
    picName: text("pic_name").notNull(),
    dueDate: text("due_date").notNull(),
    correctiveAction: text("corrective_action"),
    status: text("status", {
      enum: [
        "open",
        "assigned",
        "rework",
        "ready_for_inspection",
        "re_inspection",
        "rejected",
        "closed",
      ],
    })
      .notNull()
      .default("open"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("punch_project_code_uq").on(t.projectId, t.punchCode),
    index("punch_project_status_idx").on(t.projectId, t.status),
  ]
);

export const hseRecords = pgTable(
  "hse_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    recordCode: text("record_code").notNull(),
    recordType: text("record_type", {
      enum: ["tbt", "ptw", "observation", "incident", "audit"],
    })
      .notNull()
      .default("tbt"),
    recordDate: text("record_date").notNull(),
    area: text("area").notNull(),
    title: text("title").notNull(),
    picName: text("pic_name").notNull(),
    attendeesCount: integer("attendees_count").notNull().default(0),
    severity: text("severity", {
      enum: ["info", "low", "medium", "high", "critical"],
    })
      .notNull()
      .default("info"),
    status: text("status", { enum: ["open", "in_progress", "closed"] })
      .notNull()
      .default("open"),
    details: text("details"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("hse_project_code_uq").on(t.projectId, t.recordCode),
    index("hse_project_date_idx").on(t.projectId, t.recordDate),
  ]
);

export const commercialItems = pgTable(
  "commercial_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    itemCode: text("item_code").notNull(),
    itemType: text("item_type", {
      enum: ["boq", "variation_order", "progress_billing", "cost_entry"],
    })
      .notNull()
      .default("boq"),
    title: text("title").notNull(),
    workPackage: text("work_package").notNull(),
    unit: text("unit").notNull(),
    quantity: doublePrecision("quantity").notNull().default(1),
    unitRateIdr: doublePrecision("unit_rate_idr").notNull().default(0),
    billedPercent: integer("billed_percent").notNull().default(0),
    status: text("status", {
      enum: ["draft", "submitted", "approved", "invoiced", "paid", "rejected"],
    })
      .notNull()
      .default("draft"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("commercial_project_code_uq").on(t.projectId, t.itemCode),
    index("commercial_project_type_idx").on(t.projectId, t.itemType),
  ]
);

export const projectDocuments = pgTable(
  "project_documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    docNumber: text("doc_number").notNull(),
    title: text("title").notNull(),
    category: text("category", {
      enum: ["drawing", "isometric", "itp", "method_statement", "certificate", "transmittal", "other"],
    })
      .notNull()
      .default("drawing"),
    discipline: text("discipline").notNull(),
    revision: text("revision").notNull().default("Rev 0"),
    authorName: text("author_name").notNull(),
    issueDate: text("issue_date").notNull(),
    fileUrl: text("file_url"),
    status: text("status", {
      enum: ["draft", "for_review", "approved", "superseded"],
    })
      .notNull()
      .default("draft"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("documents_project_code_uq").on(t.projectId, t.docNumber),
    index("documents_project_cat_idx").on(t.projectId, t.category),
  ]
);
