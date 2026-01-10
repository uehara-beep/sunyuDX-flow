def init_db() -> None:
    from pathlib import Path
    schema_path = Path(__file__).resolve().parent.parent / "docs" / "db_schema_sqlite.sql"
    
    # ファイルが存在する場合のみ読み込む
    if schema_path.exists():
        sql = schema_path.read_text(encoding="utf-8")
    else:
        # ファイルが無い場合は基本的なテーブルだけ作成
        sql = """
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location_text TEXT
        );
        CREATE TABLE IF NOT EXISTS schedule_entries (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            date TEXT NOT NULL,
            process_name TEXT,
            quantity REAL,
            unit TEXT,
            is_night INTEGER DEFAULT 0,
            is_subcontract_lump_sum INTEGER DEFAULT 0,
            required_crew INTEGER,
            memo TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );
        CREATE TABLE IF NOT EXISTS schedule_assignments (
            id TEXT PRIMARY KEY,
            schedule_id TEXT NOT NULL,
            assignee_type TEXT,
            assignee_name TEXT,
            employee_user_id TEXT,
            subcon_is_lump_sum INTEGER DEFAULT 0,
            headcount INTEGER,
            FOREIGN KEY (schedule_id) REFERENCES schedule_entries(id)
        );
        """
    
    with connect() as con:
        con.executescript(sql)
        