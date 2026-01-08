-- sunyuDX-flow schema (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_text text
);

CREATE TABLE schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  process_name text NOT NULL,
  quantity numeric,
  unit text,
  is_night boolean NOT NULL DEFAULT false,
  is_subcontract_lump_sum boolean NOT NULL DEFAULT false,
  required_crew integer,
  memo text
);

CREATE INDEX idx_schedule_date ON schedule_entries(date);
CREATE INDEX idx_schedule_project_date ON schedule_entries(project_id, date);

CREATE TABLE schedule_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  assignee_type text NOT NULL CHECK (assignee_type IN ('EMPLOYEE','SUBCON')),
  assignee_name text NOT NULL,
  employee_user_id uuid,
  subcon_is_lump_sum boolean NOT NULL DEFAULT false,
  headcount integer
);

CREATE INDEX idx_assign_schedule ON schedule_assignments(schedule_id);

-- Future tables mirror the SQLite stubs (omitted here for brevity in PG file if needed).
