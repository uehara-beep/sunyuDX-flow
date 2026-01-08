
from fastapi import APIRouter, UploadFile, File
from typing import List
import uuid, datetime, csv, io
from ..db import connect

router = APIRouter(prefix="/api", tags=["estimate"])

@router.post("/estimates/import/excel")
async def import_excel(file: UploadFile = File(...)):
    # v1: CSV/XLSX simplified -> CSV only for now
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    eid = uuid.uuid4().hex
    now = datetime.datetime.utcnow().isoformat()
    with connect() as con:
        con.execute("INSERT INTO estimates(id,title,status,created_at) VALUES(?,?,?,?)",
                    (eid, file.filename, "DRAFT", now))
        for r in reader:
            iid = uuid.uuid4().hex
            con.execute("""INSERT INTO estimate_items
                (id,estimate_id,name,qty,unit,unit_price,amount)
                VALUES(?,?,?,?,?,?,?)""",
                (iid, eid, r.get("name"), r.get("qty"), r.get("unit"),
                 r.get("unit_price"), r.get("amount")))
        con.commit()
    return {"estimate_id": eid}

@router.post("/estimates/{estimate_id}/to-budget/{project_id}")
def estimate_to_budget(estimate_id: str, project_id: str):
    with connect() as con:
        rows = con.execute(
            "SELECT id,name,qty,unit,amount FROM estimate_items WHERE estimate_id=?",
            (estimate_id,)
        ).fetchall()
        for r in rows:
            bid = uuid.uuid4().hex
            con.execute("""INSERT INTO budget_lines
                (id,project_id,estimate_item_id,category,name,qty,unit,budget_amount)
                VALUES(?,?,?,?,?,?,?,?)""",
                (bid, project_id, r["id"], "MATERIAL", r["name"], r["qty"], r["unit"], r["amount"]))
        con.commit()
    return {"ok": True, "lines": len(rows)}
