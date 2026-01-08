from fastapi import APIRouter, HTTPException
from typing import Optional, List
from ..models import ScheduleEntryOut, Assignment, ScheduleEntry
from .. import repo

router = APIRouter(prefix="/api", tags=["schedule"])

@router.get("/projects")
def projects():
    return repo.list_projects()

@router.get("/schedule", response_model=List[ScheduleEntryOut])
def list_schedule(date_from: str, date_to: str, project_id: Optional[str] = None):
    return repo.list_schedule(date_from, date_to, project_id)

@router.post("/schedule", response_model=ScheduleEntry)
def upsert_schedule(payload: ScheduleEntry):
    # v1: upsert is not wired (kept for future). DB upsert can be added once edit UI is needed.
    return payload

@router.post("/schedule/{schedule_id}/assign")
def add_assignment(schedule_id: str, payload: Assignment):
    try:
        repo.add_assignment(schedule_id, payload)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/schedule/{schedule_id}/assign/{assignment_id}")
def del_assignment(schedule_id: str, assignment_id: str):
    try:
        repo.delete_assignment(schedule_id, assignment_id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
