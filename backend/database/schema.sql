-- =============================================================================
-- sunyuDX-flow Database Schema
-- PostgreSQL 16+
-- =============================================================================

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. companies（会社）
-- =============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. users（ユーザー）
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    company_id VARCHAR(36) REFERENCES companies(id),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- =============================================================================
-- 3. projects（プロジェクト）
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    contract_amount FLOAT DEFAULT 0,
    budget_amount FLOAT DEFAULT 0,
    actual_cost FLOAT DEFAULT 0,
    profit_rate FLOAT DEFAULT 0,
    progress FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    company_id VARCHAR(36) REFERENCES companies(id),
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =============================================================================
-- 4. estimates（見積書）
-- =============================================================================
CREATE TABLE IF NOT EXISTS estimates (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(36) REFERENCES projects(id),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    total_amount FLOAT DEFAULT 0,
    breakdown_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);

-- =============================================================================
-- 5. budgets（実行予算）
-- =============================================================================
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(36) REFERENCES projects(id),
    material_total FLOAT DEFAULT 0,
    labor_total FLOAT DEFAULT 0,
    equipment_total FLOAT DEFAULT 0,
    subcontract_total FLOAT DEFAULT 0,
    expense_total FLOAT DEFAULT 0,
    budget_total FLOAT DEFAULT 0,
    profit_rate FLOAT DEFAULT 0,
    profit_amount FLOAT DEFAULT 0,
    estimate_amount FLOAT DEFAULT 0,
    items_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);

-- =============================================================================
-- 6. cost_records（原価記録）
-- =============================================================================
CREATE TABLE IF NOT EXISTS cost_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    budget_id VARCHAR(36) REFERENCES budgets(id),
    project_id VARCHAR(36) REFERENCES projects(id),
    category VARCHAR(50),
    item_name VARCHAR(255),
    quantity FLOAT DEFAULT 0,
    unit VARCHAR(50),
    unit_price FLOAT DEFAULT 0,
    amount FLOAT DEFAULT 0,
    invoice_number VARCHAR(100),
    invoice_date TIMESTAMP,
    vendor_name VARCHAR(255),
    receipt_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_records_budget ON cost_records(budget_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_project ON cost_records(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_category ON cost_records(category);

-- =============================================================================
-- 7. daily_reports（日報）
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(36) REFERENCES projects(id),
    user_id VARCHAR(36) REFERENCES users(id),
    report_date TIMESTAMP NOT NULL,
    work_type VARCHAR(100),
    work_hours FLOAT DEFAULT 8.0,
    workers_count INTEGER DEFAULT 1,
    progress_description TEXT,
    weather VARCHAR(50),
    status VARCHAR(50) DEFAULT '順調',
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

-- =============================================================================
-- 8. file_uploads（ファイルアップロード）
-- =============================================================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(36) REFERENCES projects(id),
    file_type VARCHAR(50),
    original_name VARCHAR(255),
    stored_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_project ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(file_type);

-- =============================================================================
-- 9. meetings（商談記録）
-- =============================================================================
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(36) REFERENCES projects(id),
    user_id VARCHAR(36) REFERENCES users(id),
    meeting_date TIMESTAMP NOT NULL,
    customer_name VARCHAR(255),
    attendees JSONB,
    content TEXT,
    next_action TEXT,
    next_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'new',
    probability INTEGER DEFAULT 50,
    expected_amount FLOAT DEFAULT 0,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- =============================================================================
-- 10. approvals（承認ワークフロー）
-- =============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    budget_id VARCHAR(36) REFERENCES budgets(id),
    project_id VARCHAR(36) REFERENCES projects(id),
    requested_by VARCHAR(36) REFERENCES users(id),
    approved_by VARCHAR(36) REFERENCES users(id),
    approval_stage VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    comment TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approvals_budget ON approvals(budget_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- =============================================================================
-- 初期データ投入
-- =============================================================================

-- デフォルト会社
INSERT INTO companies (id, name, address, phone) VALUES
('company-001', '寸優テック株式会社', '東京都渋谷区1-2-3', '03-1234-5678')
ON CONFLICT (id) DO NOTHING;

-- 管理者ユーザー（パスワード: admin123）
INSERT INTO users (id, email, hashed_password, name, role, company_id) VALUES
('user-001', 'admin@sunyutech.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.K5.2xYwKIl.1Wy', '管理者', 'admin', 'company-001')
ON CONFLICT (id) DO NOTHING;

-- サンプルプロジェクト
INSERT INTO projects (id, name, client_name, contract_amount, budget_amount, status, company_id, created_by) VALUES
('project-001', '東京タワー改修工事', '東京タワー株式会社', 150000000, 125000000, 'active', 'company-001', 'user-001'),
('project-002', '大阪城外壁塗装', '大阪市建設局', 85000000, 72000000, 'active', 'company-001', 'user-001'),
('project-003', '名古屋駅前ビル新築', '名古屋開発株式会社', 2500000000, 2100000000, 'active', 'company-001', 'user-001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ sunyuDX-flow スキーマ作成完了（10テーブル）';
END $$;
