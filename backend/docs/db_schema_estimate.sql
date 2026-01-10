-- ==========================================
-- 見積・予算・請求管理システム
-- データベーススキーマ
-- ==========================================

-- 会社マスタテーブル
CREATE TABLE IF NOT EXISTS company_master (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,           -- 会社名
    postal_code TEXT,                     -- 郵便番号
    address TEXT,                         -- 住所
    tel TEXT,                             -- 電話番号
    fax TEXT,                             -- FAX番号
    representative TEXT,                  -- 代表者名
    bank_name TEXT,                       -- 銀行名
    bank_branch TEXT,                     -- 支店名
    bank_account_type TEXT,               -- 口座種別
    bank_account_number TEXT,             -- 口座番号
    bank_account_name TEXT,               -- 口座名義
    registration_number TEXT,             -- 登録番号（インボイス）
    logo_path TEXT,                       -- ロゴ画像パス
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 見積テーブル
CREATE TABLE IF NOT EXISTS estimates (
    id TEXT PRIMARY KEY,                  -- 見積ID (SYT-20260109-001)
    estimate_number TEXT UNIQUE NOT NULL, -- 見積番号
    estimate_date TEXT NOT NULL,          -- 見積日付
    customer_name TEXT NOT NULL,          -- 顧客名
    project_name TEXT NOT NULL,           -- 工事名
    project_location TEXT,                -- 工事場所
    project_period_from TEXT,             -- 工期（自）
    project_period_to TEXT,               -- 工期（至）
    valid_period TEXT,                    -- 有効期限
    payment_terms TEXT,                   -- 支払条件
    waste_notice TEXT,                    -- 産廃特記事項
    special_notes TEXT,                   -- 特記事項
    staff_name TEXT,                      -- 担当者名
    subtotal REAL NOT NULL,               -- 小計
    tax_rate REAL DEFAULT 0.1,            -- 消費税率
    tax_amount REAL NOT NULL,             -- 消費税額
    total_amount REAL NOT NULL,           -- 合計金額
    status TEXT DEFAULT 'draft',          -- ステータス (draft/sent/approved/rejected)
    source_file_path TEXT,                -- 元ファイルパス
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 見積明細テーブル
CREATE TABLE IF NOT EXISTS estimate_items (
    id TEXT PRIMARY KEY,
    estimate_id TEXT NOT NULL,            -- 見積ID
    item_number INTEGER NOT NULL,         -- 項番
    item_name TEXT NOT NULL,              -- 名称
    specification TEXT,                   -- 仕様・規格
    quantity REAL NOT NULL,               -- 数量
    unit TEXT NOT NULL,                   -- 単位
    unit_price REAL NOT NULL,             -- 単価
    amount REAL NOT NULL,                 -- 金額
    remarks TEXT,                         -- 備考
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- 内訳明細テーブル
CREATE TABLE IF NOT EXISTS estimate_details (
    id TEXT PRIMARY KEY,
    estimate_id TEXT NOT NULL,            -- 見積ID
    category TEXT NOT NULL,               -- カテゴリ（景観舗装工事等）
    item_name TEXT NOT NULL,              -- 名称
    specification TEXT,                   -- 規格
    quantity REAL NOT NULL,               -- 数量
    unit TEXT NOT NULL,                   -- 単位
    unit_price REAL NOT NULL,             -- 単価
    amount REAL NOT NULL,                 -- 金額
    remarks TEXT,                         -- 備考
    item_order INTEGER,                   -- 表示順
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- 予算テーブル
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,                  -- 予算ID
    estimate_id TEXT NOT NULL,            -- 見積ID（参照）
    budget_number TEXT UNIQUE NOT NULL,   -- 予算番号
    budget_date TEXT NOT NULL,            -- 予算日付
    project_id TEXT,                      -- 工事ID（projectsテーブル連携）
    budget_amount REAL NOT NULL,          -- 予算金額
    initial_contract_amount REAL,         -- 初期契約金額
    change_amount REAL DEFAULT 0,         -- 増減金額
    contract_amount REAL,                 -- 契約金額
    expected_profit REAL,                 -- 予定粗利
    expected_profit_rate REAL,            -- 予定粗利率
    status TEXT DEFAULT 'draft',          -- ステータス
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- 予算明細テーブル
CREATE TABLE IF NOT EXISTS budget_items (
    id TEXT PRIMARY KEY,
    budget_id TEXT NOT NULL,              -- 予算ID
    cost_category TEXT NOT NULL,          -- 費用分類（労務費/材料費/外注費/経費）
    item_name TEXT NOT NULL,              -- 名称
    specification TEXT,                   -- 仕様
    quantity REAL,                        -- 数量
    unit TEXT,                            -- 単位
    unit_price REAL,                      -- 単価
    amount REAL NOT NULL,                 -- 金額
    vendor_name TEXT,                     -- 業者名
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
);

-- 請求テーブル
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,                  -- 請求ID
    estimate_id TEXT,                     -- 見積ID（参照）
    budget_id TEXT,                       -- 予算ID（参照）
    invoice_number TEXT UNIQUE NOT NULL,  -- 請求番号
    invoice_date TEXT NOT NULL,           -- 請求日
    customer_name TEXT NOT NULL,          -- 請求先
    project_name TEXT NOT NULL,           -- 工事名
    project_location TEXT,                -- 工事場所
    payment_due_date TEXT,                -- 支払期限
    subtotal REAL NOT NULL,               -- 小計
    tax_amount REAL NOT NULL,             -- 消費税
    total_amount REAL NOT NULL,           -- 合計金額
    payment_status TEXT DEFAULT 'unpaid', -- 支払状況（unpaid/partial/paid）
    paid_amount REAL DEFAULT 0,           -- 入金済金額
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE SET NULL,
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL
);

-- 請求明細テーブル
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,             -- 請求ID
    item_name TEXT NOT NULL,              -- 名称
    specification TEXT,                   -- 仕様
    quantity REAL NOT NULL,               -- 数量
    unit TEXT NOT NULL,                   -- 単位
    unit_price REAL NOT NULL,             -- 単価
    amount REAL NOT NULL,                 -- 金額
    tax_category TEXT DEFAULT 'standard', -- 税区分
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_estimates_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_date ON estimates(estimate_date);
CREATE INDEX IF NOT EXISTS idx_estimates_customer ON estimates(customer_name);
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_budgets_number ON budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- 初期データ：会社マスタ
INSERT OR IGNORE INTO company_master (
    id,
    company_name,
    postal_code,
    address,
    tel,
    fax,
    representative,
    bank_name,
    bank_branch,
    bank_account_type,
    bank_account_number,
    bank_account_name,
    registration_number
) VALUES (
    'company_001',
    '株式会社 サンユウテック',
    '816-0912',
    '福岡県大野城市御笠川6丁目2-5',
    '092-555-9211',
    '092-555-9217',
    '上原 拓',
    '福岡銀行',
    '大野城支店',
    '普通',
    '1234567',
    '株式会社サンユウテック',
    'T1234567890123'
);
