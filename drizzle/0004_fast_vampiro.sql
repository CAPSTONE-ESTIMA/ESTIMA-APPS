CREATE TABLE "punch_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"punch_code" text NOT NULL,
	"area" text NOT NULL,
	"reference_code" text NOT NULL,
	"category" text DEFAULT 'cat_a' NOT NULL,
	"priority" text DEFAULT 'high' NOT NULL,
	"description" text NOT NULL,
	"pic_name" text NOT NULL,
	"due_date" text NOT NULL,
	"corrective_action" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"inspection_code" text NOT NULL,
	"record_type" text DEFAULT 'inspection' NOT NULL,
	"discipline" text DEFAULT 'scaffolding' NOT NULL,
	"reference_code" text NOT NULL,
	"area" text NOT NULL,
	"title" text NOT NULL,
	"inspector_name" text NOT NULL,
	"inspection_date" text NOT NULL,
	"result" text DEFAULT 'pending' NOT NULL,
	"client_approval" text DEFAULT 'pending' NOT NULL,
	"findings" text,
	"corrective_action" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "punch_items" ADD CONSTRAINT "punch_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punch_items" ADD CONSTRAINT "punch_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_inspections" ADD CONSTRAINT "qa_inspections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_inspections" ADD CONSTRAINT "qa_inspections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "punch_project_code_uq" ON "punch_items" USING btree ("project_id","punch_code");--> statement-breakpoint
CREATE INDEX "punch_project_status_idx" ON "punch_items" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "qa_project_code_uq" ON "qa_inspections" USING btree ("project_id","inspection_code");--> statement-breakpoint
CREATE INDEX "qa_project_result_idx" ON "qa_inspections" USING btree ("project_id","result");