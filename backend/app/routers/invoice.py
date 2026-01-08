
from fastapi import APIRouter, UploadFile, File
import uuid, datetime
from ..db import connect

router = APIRouter(prefix="/api", tags=["invoice"])

@router.post("/invoices/upload")
async def upload_invoice(file: UploadFile = File(...)):
    iid = uuid.uuid4().hex
    now = datetime.datetime.utcnow().isoformat()
    with connect() as con:
        con.execute("""INSERT INTO invoices
            (id,ocr_status,raw_file_path,created_at)
            VALUES(?,?,?,?)""",
            (iid, "PENDING", file.filename, now))
        con.commit()
    return {"invoice_id": iid, "ocr_status": "PENDING"}

@router.post("/invoices/{invoice_id}/ocr")
def ocr_stub(invoice_id: str):
    # Stub: mark as FAILED to force escape UI
    with connect() as con:
        con.execute("UPDATE invoices SET ocr_status='FAILED' WHERE id=?", (invoice_id,))
        con.commit()
    return {"invoice_id": invoice_id, "ocr_status": "FAILED"}

@router.post("/invoices/{invoice_id}/escape")
def escape_minimum(invoice_id: str, project_id: str, name: str, qty: float, amount: float):
    with connect() as con:
        con.execute("UPDATE invoices SET project_id=?, total_amount=?, ocr_status='OK' WHERE id=?",
                    (project_id, amount, invoice_id))
        con.execute("""INSERT INTO cost_entries
            (id,project_id,category,name,qty,amount,source_type,source_id)
            VALUES(?,?,?,?,?,?,?,?)""",
            (uuid.uuid4().hex, project_id, "MATERIAL", name, qty, amount, "INVOICE", invoice_id))
        con.commit()
    return {"ok": True}
