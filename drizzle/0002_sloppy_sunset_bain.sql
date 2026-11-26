CREATE TABLE "insulation_works" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"work_code" text NOT NULL,
	"area" text NOT NULL,
	"work_package" text NOT NULL,
	"equipment_or_line" text NOT NULL,
	"insulation_type" text DEFAULT 'hot' NOT NULL,
	"material" text NOT NULL,
	"thickness_mm" integer NOT NULL,
	"cladding_type" text NOT NULL,
	"dimension" text,
	"quantity" double precision NOT NULL,
	"unit" text DEFAULT 'm2' NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scaffolds" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"scaffold_code" text NOT NULL,
	"area" text NOT NULL,
	"location" text NOT NULL,
	"requester" text NOT NULL,
	"purpose" text,
	"scaffold_type" text NOT NULL,
	"load_class" text NOT NULL,
	"length_m" double precision NOT NULL,
	"width_m" double precision NOT NULL,
	"height_m" double precision NOT NULL,
	"tag_status" text DEFAULT 'red' NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"required_date" text,
	"last_inspection_date" text,
	"next_inspection_date" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insulation_works" ADD CONSTRAINT "insulation_works_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insulation_works" ADD CONSTRAINT "insulation_works_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scaffolds" ADD CONSTRAINT "scaffolds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scaffolds" ADD CONSTRAINT "scaffolds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "insulation_project_code_uq" ON "insulation_works" USING btree ("project_id","work_code");--> statement-breakpoint
CREATE INDEX "insulation_project_status_idx" ON "insulation_works" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "scaffolds_project_code_uq" ON "scaffolds" USING btree ("project_id","scaffold_code");--> statement-breakpoint
CREATE INDEX "scaffolds_project_status_idx" ON "scaffolds" USING btree ("project_id","status");