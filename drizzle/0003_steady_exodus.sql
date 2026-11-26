CREATE TABLE "daily_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"report_code" text NOT NULL,
	"report_date" text NOT NULL,
	"shift" text DEFAULT 'day' NOT NULL,
	"weather" text DEFAULT 'clear' NOT NULL,
	"area" text NOT NULL,
	"supervisor_name" text NOT NULL,
	"manpower_count" integer DEFAULT 0 NOT NULL,
	"regular_hours" double precision DEFAULT 0 NOT NULL,
	"overtime_hours" double precision DEFAULT 0 NOT NULL,
	"activities_summary" text NOT NULL,
	"constraints" text,
	"safety_notes" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manpower_records" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"position" text NOT NULL,
	"trade" text DEFAULT 'scaffolding' NOT NULL,
	"crew" text NOT NULL,
	"certification" text,
	"cert_expiry" text,
	"mobilization_date" text,
	"regular_hours_total" double precision DEFAULT 0 NOT NULL,
	"overtime_hours_total" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"material_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'insulation' NOT NULL,
	"warehouse" text NOT NULL,
	"unit" text NOT NULL,
	"stock_available" double precision DEFAULT 0 NOT NULL,
	"stock_reserved" double precision DEFAULT 0 NOT NULL,
	"stock_issued" double precision DEFAULT 0 NOT NULL,
	"min_stock" double precision DEFAULT 10 NOT NULL,
	"lifecycle_status" text DEFAULT 'available' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planning_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"activity_code" text NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"work_package" text NOT NULL,
	"discipline" text DEFAULT 'scaffolding' NOT NULL,
	"weight_percent" double precision DEFAULT 1 NOT NULL,
	"planned_start" text NOT NULL,
	"planned_finish" text NOT NULL,
	"actual_start" text,
	"actual_finish" text,
	"planned_progress" integer DEFAULT 0 NOT NULL,
	"actual_progress" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"constraints" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_records" ADD CONSTRAINT "manpower_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_records" ADD CONSTRAINT "manpower_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_activities" ADD CONSTRAINT "planning_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_activities" ADD CONSTRAINT "planning_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_reports_project_code_uq" ON "daily_reports" USING btree ("project_id","report_code");--> statement-breakpoint
CREATE INDEX "daily_reports_project_date_idx" ON "daily_reports" USING btree ("project_id","report_date");--> statement-breakpoint
CREATE UNIQUE INDEX "manpower_project_code_uq" ON "manpower_records" USING btree ("project_id","employee_code");--> statement-breakpoint
CREATE INDEX "manpower_project_status_idx" ON "manpower_records" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_project_code_uq" ON "materials" USING btree ("project_id","material_code");--> statement-breakpoint
CREATE INDEX "materials_project_cat_idx" ON "materials" USING btree ("project_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "planning_project_code_uq" ON "planning_activities" USING btree ("project_id","activity_code");--> statement-breakpoint
CREATE INDEX "planning_project_status_idx" ON "planning_activities" USING btree ("project_id","status");