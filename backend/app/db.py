from __future__ import annotations
import os, sqlite3
from pathlib import Path

DB_PATH = os.getenv("SUNYUDX_DB_PATH", str(Path(__file__).resolve().parent.parent / "sunyuDX.db"))

def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON;")
    return con

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
def seed_if_empty() -> None:
    import uuid, datetime
    with connect() as con:
        cur = con.execute("SELECT COUNT(*) as c FROM projects")
        if cur.fetchone()["c"] > 0:
            return
        names = [
            "九州ニチレキ", "北九州連絡橋", "松尾建設", "長崎", "鹿島道路",
            "宮崎", "ガイアートリフレッシュ", "都市高速", "防水工事A",
            "SB現場B", "リペアC", "舗装D", "WJ現場E", "夜間工事F", "人員不足G"
        ]
        projects = []
        for n in names:
            pid = uuid.uuid4().hex
            projects.append(pid)
            con.execute("INSERT INTO projects(id,name,location_text) VALUES(?,?,?)", (pid, n, None))

        # sample schedule entries in current week (Mon start)
        today = datetime.date.today()
        monday = today - datetime.timedelta(days=today.weekday())
        def add(pidx, day_offset, proc, qty, unit, night=False, req=3, lump=False, memo=None, employees=None, subcons=None):
            sid = uuid.uuid4().hex
            d = (monday + datetime.timedelta(days=day_offset)).isoformat()
            con.execute(
                """INSERT INTO schedule_entries
                   (id,project_id,date,process_name,quantity,unit,is_night,is_subcontract_lump_sum,required_crew,memo)
                   VALUES(?,?,?,?,?,?,?,?,?,?)""",
                (sid, projects[pidx], d, proc, qty, unit, 1 if night else 0, 1 if lump else 0, None if lump else req, memo)
            )
            if employees:
                for name in employees:
                    con.execute(
                        """INSERT INTO schedule_assignments
                           (id,schedule_id,assignee_type,assignee_name,employee_user_id,subcon_is_lump_sum,headcount)
                           VALUES(?,?,?,?,?,?,?)""",
                        (uuid.uuid4().hex, sid, "EMPLOYEE", name, None, 0, None)
                    )
            if subcons:
                for sc in subcons:
                    con.execute(
                        """INSERT INTO schedule_assignments
                           (id,schedule_id,assignee_type,assignee_name,employee_user_id,subcon_is_lump_sum,headcount)
                           VALUES(?,?,?,?,?,?,?)""",
                        (uuid.uuid4().hex, sid, "SUBCON", sc["name"], None, 1 if sc.get("lump", False) else 0, sc.get("headcount"))
                    )

        add(0, 2, "WJ", 200, "m²", night=True, req=4, employees=["佐藤","萩尾","前山"], subcons=[{"name":"ONE4","headcount":2}])
        add(1, 3, "SB", 120, "m²", night=False, req=3, employees=["佐藤","佐藤ま"])
        add(2, 4, "防水", 1, "式", night=False, req=2, employees=["橋本"], memo="名古屋")
        add(4, 1, "請負WJ", 300, "m²", night=False, lump=True, subcons=[{"name":"ONE4","lump":True}])
        add(5, 1, "WJ", 180, "m²", night=False, req=5, employees=["佐藤"])  # red
        add(6, 2, "夜間工事", 1, "式", night=True, req=3, employees=["明","萩尾た"])
        con.commit()
