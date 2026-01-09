from __future__ import annotations
from typing import List, Optional, Tuple
import sqlite3
from .db import connect
from .models import Project, ScheduleEntry, Assignment, ScheduleEntryOut

def list_projects() -> List[Project]:
    with connect() as con:
        rows = con.execute("SELECT id,name,location_text FROM projects ORDER BY name").fetchall()
        return [Project(**dict(r)) for r in rows]

def _staffing_state(is_night: int, required_crew: Optional[int], assigned_employee_count: int) -> str:
    # red: only when required_crew exists and shortage
    if required_crew is not None and assigned_employee_count < required_crew:
        return "RED"
    if is_night:
        return "YELLOW"
    return "NONE"

def list_schedule(date_from: str, date_to: str, project_id: Optional[str] = None) -> List[ScheduleEntryOut]:
    params = [date_from, date_to]
    where = "WHERE date BETWEEN ? AND ?"
    if project_id:
        where += " AND project_id = ?"
        params.append(project_id)
    with connect() as con:
        entries = con.execute(f"""
            SELECT id,project_id,date,process_name,quantity,unit,is_night,is_subcontract_lump_sum,required_crew,memo
            FROM schedule_entries
            {where}
            ORDER BY date, project_id, process_name
        """, params).fetchall()

        out: List[ScheduleEntryOut] = []
        for e in entries:
            assigns = con.execute("""
                SELECT id, schedule_id, assignee_type, assignee_name, employee_user_id, subcon_is_lump_sum, headcount
                FROM schedule_assignments
                WHERE schedule_id = ?
                ORDER BY assignee_type, assignee_name
            """, (e["id"],)).fetchall()
            aobjs = [Assignment(**{
                "id": a["id"],
                "assignee_type": a["assignee_type"],
                "assignee_name": a["assignee_name"],
                "employee_user_id": a["employee_user_id"],
                "subcon_is_lump_sum": bool(a["subcon_is_lump_sum"]),
                "headcount": a["headcount"],
            }) for a in assigns]
            emp_count = sum(1 for a in aobjs if a.assignee_type == "EMPLOYEE")
            state = _staffing_state(int(e["is_night"]), e["required_crew"], emp_count)
            out.append(ScheduleEntryOut(
                id=e["id"],
                project_id=e["project_id"],
                date=e["date"],
                process_name=e["process_name"],
                quantity=e["quantity"],
                unit=e["unit"],
                is_night=bool(e["is_night"]),
                is_subcontract_lump_sum=bool(e["is_subcontract_lump_sum"]),
                required_crew=e["required_crew"],
                memo=e["memo"],
                assignments=aobjs,
                assigned_employee_count=emp_count,
                color_state=state,
            ))
        return out

def add_assignment(schedule_id: str, a: Assignment) -> None:
    with connect() as con:
        con.execute("""
          INSERT INTO schedule_assignments
          (id,schedule_id,assignee_type,assignee_name,employee_user_id,subcon_is_lump_sum,headcount)
          VALUES(?,?,?,?,?,?,?)
        """, (a.id, schedule_id, a.assignee_type, a.assignee_name, a.employee_user_id, 1 if a.subcon_is_lump_sum else 0, a.headcount))
        con.commit()

def delete_assignment(schedule_id: str, assignment_id: str) -> None:
    with connect() as con:
        con.execute("DELETE FROM schedule_assignments WHERE schedule_id=? AND id=?", (schedule_id, assignment_id))
        con.commit()

# =========================
# Estimate -> Budget Import
# =========================
from typing import Dict
try:
    from pydantic import BaseModel
except Exception:
    BaseModel = object

def ensure_estimate_tables():
    con = connect()
    cur = con.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS estimate_imports (
        id TEXT PRIMARY KEY,
        source_filename TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS estimate_items (
        id TEXT PRIMARY KEY,
        import_id TEXT NOT NULL,
        row_no INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT,
        unit_price REAL NOT NULL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        vendor TEXT,
        note TEXT,
        FOREIGN KEY(import_id) REFERENCES estimate_imports(id)
    )
    """)
    con.commit()

def calc_budget_summary(rows: List) -> Dict[str, float]:
    totals = {"労務": 0.0, "外注": 0.0, "材料": 0.0, "機械": 0.0, "経費": 0.0, "grand_total": 0.0}
    for r in rows:
        cat = getattr(r, "category", "材料") or "材料"
        amt = float(getattr(r, "amount", 0.0) or 0.0)
        if cat not in totals:
            totals[cat] = 0.0
        totals[cat] += amt
        totals["grand_total"] += amt
    return totals

def save_estimate_import(source_filename: str, rows: List) -> str:
    import uuid, datetime
    ensure_estimate_tables()
    con = connect()
    cur = con.cursor()
    import_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()

    cur.execute("INSERT INTO estimate_imports (id, source_filename, created_at) VALUES (?, ?, ?)",
                (import_id, source_filename, now))

    for r in rows:
        item_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO estimate_items
            (id, import_id, row_no, name, category, quantity, unit, unit_price, amount, vendor, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item_id,
            import_id,
            int(getattr(r, "row_no", 0) or 0),
            str(getattr(r, "name", "") or ""),
            str(getattr(r, "category", "") or "材料"),
            float(getattr(r, "quantity", 0.0) or 0.0),
            str(getattr(r, "unit", "") or ""),
            float(getattr(r, "unit_price", 0.0) or 0.0),
            float(getattr(r, "amount", 0.0) or 0.0),
            getattr(r, "vendor", None),
            getattr(r, "note", None),
        ))
    con.commit()
    return import_id
