from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date
import uuid

def uid() -> str:
    return uuid.uuid4().hex

class Project(BaseModel):
    id: str = Field(default_factory=uid)
    name: str
    location_text: Optional[str] = None

class Assignment(BaseModel):
    id: str = Field(default_factory=uid)
    assignee_type: Literal["EMPLOYEE", "SUBCON"]
    assignee_name: str
    employee_user_id: Optional[str] = None
    subcon_is_lump_sum: bool = False
    headcount: Optional[int] = None  # 常用のみ

class ScheduleEntry(BaseModel):
    id: str = Field(default_factory=uid)
    project_id: str
    date: str  # ISO YYYY-MM-DD
    process_name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    is_night: bool = False
    is_subcontract_lump_sum: bool = False
    required_crew: Optional[int] = None   # 請負は None 固定
    memo: Optional[str] = None

    # denorm
    assignments: List[Assignment] = Field(default_factory=list)

class ScheduleEntryOut(ScheduleEntry):
    assigned_employee_count: int
    color_state: Literal["RED", "YELLOW", "NONE"]
