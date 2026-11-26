CREATE TABLE "commercial_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"item_code" text NOT NULL,
	"item_type" text DEFAULT 'boq' NOT NULL,
	"title" text NOT NULL,
	"work_package" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit_rate_idr" double precision DEFAULT 0 NOT NULL,
	"billed_percent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hse_records" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"record_code" text NOT NULL,
	"record_type" text DEFAULT 'tbt' NOT NULL,
	"record_date" text NOT NULL,
	"area" text NOT NULL,
	"title" text NOT NULL,
	"pic_name" text NOT NULL,
	"attendees_count" integer DEFAULT 0 NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"details" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"doc_number" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'drawing' NOT NULL,
	"discipline" text NOT NULL,
	"revision" text DEFAULT 'Rev 0' NOT NULL,
	"author_name" text NOT NULL,
	"issue_date" text NOT NULL,
	"file_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commercial_items" ADD CONSTRAINT "commercial_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_items" ADD CONSTRAINT "commercial_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_records" ADD CONSTRAINT "hse_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hse_records" ADD CONSTRAINT "hse_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_project_code_uq" ON "commercial_items" USING btree ("project_id","item_code");--> statement-breakpoint
CREATE INDEX "commercial_project_type_idx" ON "commercial_items" USING btree ("project_id","item_type");--> statement-breakpoint
CREATE UNIQUE INDEX "hse_project_code_uq" ON "hse_records" USING btree ("project_id","record_code");--> statement-breakpoint
CREATE INDEX "hse_project_date_idx" ON "hse_records" USING btree ("project_id","record_date");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_project_code_uq" ON "project_documents" USING btree ("project_id","doc_number");--> statement-breakpoint
CREATE INDEX "documents_project_cat_idx" ON "project_documents" USING btree ("project_id","category");