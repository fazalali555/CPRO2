export interface Institution {
  ddo_code: string;
  name: string;
  type: 'School' | 'Office' | 'College' | 'Other';
  head_name?: string;
  head_designation?: string;
  address?: string;
  tehsil?: string;
  district?: string;
}

export interface SeniorityListConfig {
  institution: Institution;
  designation?: string;
  bps?: number;
  asOnDate: string;
  listType: 'Provisional' | 'Final';
}

export interface SeniorityEntry {
  seniority_no: number;
  employee_id: string;
  name: string;
  father_name: string;
  designation: string;
  bps: number;
  date_of_birth: string;
  date_of_appointment: string;
  date_of_regularization?: string;
  date_of_entry_in_current_post?: string;
  personal_no: string;
  qualification?: string;
  remarks?: string;
}
