-- sunyuDX-flow DB Schema (v1)

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  work_date DATE NOT NULL,
  process_name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  is_night BOOLEAN DEFAULT 0,
  required_crew INTEGER,
  is_subcontract_lump_sum BOOLEAN DEFAULT 0,
  memo TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  assignee_type TEXT CHECK(assignee_type IN ('EMPLOYEE','SUBCON')),
  assignee_name TEXT NOT NULL,
  headcount INTEGER,
  is_lump_sum BOOLEAN DEFAULT 0,
  FOREIGN KEY(schedule_id) REFERENCES schedules(id)
);

CREATE TABLE budget_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT,
  name TEXT,
  quantity REAL,
  unit TEXT,
  budget_amount REAL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE cost_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT,
  quantity REAL,
  amount REAL,
  source TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE subcontract_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  process_name TEXT,
  quantity REAL,
  unit TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  vendor TEXT,
  quantity REAL,
  amount REAL,
  status TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
