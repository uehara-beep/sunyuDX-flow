from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api", tags=["notify"])

class NotifyReq(BaseModel):
    message: str
    webhook_url: Optional[str] = None  # LINE WORKS webhook (if provided, backend can be extended)

@router.post("/notify/staffing")
def notify_staffing(req: NotifyReq):
    # v1: stub. Extend to call LINE WORKS webhook if provided.
    return {"ok": True, "sent": False, "reason": "stub", "message": req.message}
