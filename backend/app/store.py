from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from .models import Project, ScheduleEntry, Assignment, ScheduleEntryOut
import datetime

class Store:
    def __init__(self) -> None:
        self.projects: Dict[str, Project] = {}
        self.schedule: Dict[str, ScheduleEntry] = {}

    def seed(self) -> None:
        # Projects (~15)
        names = [
            "九州ニチレキ", "北九州連絡橋", "松尾建設", "長崎", "鹿島道路",
            "宮崎", "ガイアートリフレッシュ", "都市高速", "防水工事A",
            "SB現場B", "リペアC", "舗装D", "WJ現場E", "夜間工事F", "人員不足G"
        ]
        for n in names:
            p = Project(name=n)
            self.projects[p.id] = p

        # Create a week schedule samples
        today = datetime.date.today()
        monday = today - datetime.timedelta(days=(today.weekday()))  # Monday
        ps = list(self.projects.values())
        def add(proj, day_offset, proc, qty, unit, night=False, req=3, lump=False, memo=None, employees=None, subcons=None):
            d = (monday + datetime.timedelta(days=day_offset)).isoformat()
            e = ScheduleEntry(
                project_id=proj.id,
                date=d,
                process_name=proc,
                quantity=qty,
                unit=unit,
                is_night=night,
                required_crew=None if lump else req,
                is_subcontract_lump_sum=lump,
                memo=memo,
            )
            # Assignments
            if employees:
                for name in employees:
                    e.assignments.append(Assignment(assignee_type="EMPLOYEE", assignee_name=name, subcon_is_lump_sum=False))
            if subcons:
                for sc in subcons:
                    e.assignments.append(Assignment(
                        assignee_type="SUBCON",
                        assignee_name=sc.get("name"),
                        subcon_is_lump_sum=sc.get("lump", False),
                        headcount=sc.get("headcount")
                    ))
            self.schedule[e.id] = e

        add(ps[0], 2, "WJ", 200, "m²", night=True, req=4, employees=["佐藤","萩尾","前山"], subcons=[{"name":"ONE4","headcount":2}])
        add(ps[1], 3, "SB", 120, "m²", night=False, req=3, employees=["佐藤","佐藤ま"])
        add(ps[2], 4, "防水", 1, "式", night=False, req=2, employees=["橋本"], memo="名古屋")
        add(ps[3], 4, "リペア", 40, "m", night=False, req=2, employees=["大迫"])
        add(ps[4], 1, "請負WJ", 300, "m²", night=False, lump=True, subcons=[{"name":"ONE4","lump":True}])  # lump: no red
        add(ps[5], 1, "WJ", 180, "m²", night=False, req=5, employees=["佐藤"])  # red: short
        add(ps[6], 2, "夜間工事", 1, "式", night=True, req=3, employees=["明","萩尾た"])
        add(ps[7], 2, "舗装", 1, "式", night=False, req=2, employees=["八尋"], subcons=[{"name":"協力A","headcount":1}])

    def list_projects(self) -> List[Project]:
        return list(self.projects.values())

    def staffing_state(self, e: ScheduleEntry) -> Tuple[int, str]:
        emp_count = sum(1 for a in e.assignments if a.assignee_type == "EMPLOYEE")
        if e.is_night:
            # night just yellow unless red applies
            pass
        # red rules: only when required_crew exists AND not lump sum
        if e.required_crew is not None and emp_count < e.required_crew:
            return emp_count, "RED"
        if e.is_night:
            return emp_count, "YELLOW"
        return emp_count, "NONE"

    def list_schedule(self, date_from: str, date_to: str, project_id: Optional[str] = None) -> List[ScheduleEntryOut]:
        out: List[ScheduleEntryOut] = []
        for e in self.schedule.values():
            if project_id and e.project_id != project_id:
                continue
            if not (date_from <= e.date <= date_to):
                continue
            emp_count, state = self.staffing_state(e)
            out.append(ScheduleEntryOut(**e.model_dump(), assigned_employee_count=emp_count, color_state=state))
        out.sort(key=lambda x: (x.date, x.project_id, x.process_name))
        return out

    def upsert_schedule(self, payload: ScheduleEntry) -> ScheduleEntry:
        # if id exists update, else create
        if payload.id in self.schedule:
            self.schedule[payload.id] = payload
        else:
            self.schedule[payload.id] = payload
        return payload

    def add_assignment(self, schedule_id: str, a: Assignment) -> ScheduleEntry:
        e = self.schedule[schedule_id]
        e.assignments.append(a)
        self.schedule[schedule_id] = e
        return e

    def delete_assignment(self, schedule_id: str, assignment_id: str) -> ScheduleEntry:
        e = self.schedule[schedule_id]
        e.assignments = [x for x in e.assignments if x.id != assignment_id]
        self.schedule[schedule_id] = e
        return e

STORE = Store()
STORE.seed()
