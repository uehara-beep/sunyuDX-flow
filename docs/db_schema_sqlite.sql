-- sunyuDX-flow schema (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location_text TEXT
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                -- YYYY-MM-DD
  process_name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  is_night INTEGER NOT NULL DEFAULT 0,
  is_subcontract_lump_sum INTEGER NOT NULL DEFAULT 0,
  required_crew INTEGER,             -- NULL if lump sum
  memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_project_date ON schedule_entries(project_id, date);

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('EMPLOYEE','SUBCON')),
  assignee_name TEXT NOT NULL,
  employee_user_id TEXT,
  subcon_is_lump_sum INTEGER NOT NULL DEFAULT 0,
  headcount INTEGER
);

CREATE INDEX IF NOT EXISTS idx_assign_schedule ON schedule_assignments(schedule_id);

-- ====== v1.0 future tables (stubs) ======
CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  estimate_no TEXT,
  customer_name TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT/ORDERED
  created_at TEXT NOT NULL,
  ordered_at TEXT
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  unit_price REAL,
  amount REAL
);

CREATE TABLE IF NOT EXISTS budget_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  estimate_item_id TEXT REFERENCES estimate_items(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('LABOR','SUBCON','MATERIAL','MACHINE','EXPENSE')),
  name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  budget_amount REAL
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date TEXT NOT NULL,
  reporter_name TEXT,
  work_summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cost_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_date TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('LABOR','SUBCON','MATERIAL','MACHINE','EXPENSE')),
  name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  amount REAL NOT NULL,
  source_type TEXT,  -- DAILY_REPORT/INVOICE/MANUAL
  source_id TEXT
);

CREATE TABLE IF NOT EXISTS subcontract_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT' -- SENT/REVISED/CLOSED
);

CREATE TABLE IF NOT EXISTS subcontract_order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES subcontract_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  unit_price REAL,
  amount REAL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  vendor_name TEXT,
  invoice_date TEXT,
  total_amount REAL,
  ocr_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING/OK/FAILED
  raw_file_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  unit_price REAL,
  amount REAL
);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  measure_date TEXT NOT NULL,
  process_name TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  evidence_path TEXT,
  memo TEXT
);

CREATE TABLE IF NOT EXISTS quality_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  record_date TEXT NOT NULL,
  process_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('OK','NG')),
  evidence_path TEXT,
  memo TEXT
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  min_qty REAL DEFAULT 0,
  current_qty REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  delta_qty REAL NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  memo TEXT
);
