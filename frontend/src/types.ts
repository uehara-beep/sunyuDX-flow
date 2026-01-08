export type Project = { id: string; name: string; location_text?: string | null }

export type Assignment = {
  id: string;
  assignee_type: 'EMPLOYEE' | 'SUBCON';
  assignee_name: string;
  employee_user_id?: string | null;
  subcon_is_lump_sum: boolean;
  headcount?: number | null;
}

export type Schedule = {
  id: string;
  project_id: string;
  date: string;
  process_name: string;
  quantity: number | null;
  unit: string | null;
  is_night: boolean;
  is_subcontract_lump_sum: boolean;
  required_crew: number | null;
  memo: string | null;

  assigned_employee_count: number;
  color_state: 'RED' | 'YELLOW' | 'NONE';
  assignments: Assignment[];
}
