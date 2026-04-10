
export const CURRENT_SCHEMA_VERSION = 2;
export const CURRENT_CASE_SCHEMA_VERSION = 1;

export interface OfficialFamilyMember {
  id: string;
  relative_name: string;
  relation: string;
  age: number | string;
  cnic: string;
  marital_status?: string;
  dob?: string; // ISO Date string
  status?: string; // Alive / Deceased
  profession?: string;
}

export interface EmployeeRecord {
  id: string;
  schemaVersion: number;
  employees: {
    name: string;
    designation: string; // Acts as designation_short
    designation_full?: string; // New
    bps: number;
    school_full_name: string;
    office_name: string;
    staff_type: 'teaching' | 'non_teaching' | string;
    status: string;
    employment_category?: string; // New: Active Temporary/Permanent
    mobile_no: string;
    personal_no: string;
    cnic_no: string;
    ntn_no?: string; // New
    father_name: string;
    nationality: string;
    district: string;
    tehsil: string;
    address: string;
    dob: string;
    ddo_code: string;
    bank_ac_no: string;
    bank_name: string;
    branch_name: string;
    branch_code: string;
    bank_branch?: string; // Legacy
    account_type: string;
    gpf_account_no: string;
    ppo_no?: string;
    gender?: 'Male' | 'Female';
  };
  service_history: {
    date_of_appointment: string;
    date_of_entry: string;
    date_of_retirement: string;
    date_of_death?: string;
    retirement_order_no: string;
    retirement_order_date: string;
    lwp_days: number;
    lpr_days: number;
    leave_taken_days: number;
    date_of_regularization: string; // New: For seniority logic
    qualifying_service?: string;
  };
  financials: {
    last_basic_pay: number;
    last_pay_with_increment: number;
    p_pay: number;
    hra: number;
    ca: number;
    ma: number;
    uaa: number; // A01233
    spl_allow: number;
    teaching_allow: number;
    spl_allow_female: number;
    spl_allow_disable: number;
    integrated_allow: number;
    charge_allow: number;
    wa: number; // Washing Allowance
    dress_allow: number; // A01208
    
    // Explicit Adhoc Reliefs
    adhoc_2013: number; // A0121T
    adhoc_2015: number; // A0122C
    adhoc_2016: number; // 
    adhoc_2022: number; // A0124R
    adhoc_10pct: number; // Deprecated?
    dra_2022kp: number; // A0124N
    adhoc_2022_ps17: number; // Deprecated?
    adhoc_2023_35: number; // A0124X
    adhoc_2024_25: number; // A0125E
    adhoc_2025_10: number; // A0125P
    dra_2025_15: number; // A0125Q

    // New Allowances
    computer_allow: number; // A01226
    mphil_allow: number; // A01270
    entertainment_allow: number; // A0124
    science_teaching_allow: number; // A01253
    weather_allow: number; // A0124L
    special_allow_non_teaching: number; // A0124H

    other: number;
    arrears: Record<string, number>; // Stores Legacy Arrears
    
    // Deductions
    gpf: number;
    gpf_advance: number; // Legacy alias for gpf_loan_instal
    bf: number;
    eef: number;
    rb_death: number;
    income_tax: number;
    edu_rop: number; // New
    
    // Loans
    hba_loan_instal: number;
    gpf_loan_instal: number;

    adl_g_insurance: number;
    group_insurance: number;
    recovery: number;
    allowances_extra: Record<string, number>;
    deductions_extra: Record<string, number>;
    [key: string]: any;
  };
  family_members: OfficialFamilyMember[];
  extras: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type CaseType =
  | 'retirement'
  | 'pension'
  | 'gpf_refundable'
  | 'gpf_non_refundable'
  | 'gpf_final'
  | 'lpr'
  | 'benevolent_fund'
  | 'rbdc'
  | 'rbdc_budget'
  | 'budget_form'
  | 'eef'
  | 'financial_assistance'
  | 'court_case'
  | 'audit_para'
  | 'transfer_posting'
  | 'medical_reimbursement'
  | 'hba_loan'
  | 'vehicle_loan'
  | 'payroll'
  | 'token_bill'
  | 'sanctioned_post'
  | 'other';

export interface BudgetHead {
  id: string;
  code: string; // e.g., A01101
  name: string; // e.g., Basic Pay
  source_type: 'Source-I' | 'Source-II' | 'Source-III';
  allocation: number;
  utilized: number;
  year: string;
}

export interface ExpenditureRecord {
  id: string;
  head_id: string;
  amount: number;
  date: string;
  description: string;
  voucher_no?: string;
}

export interface BudgetProposal {
  id: string;
  year: string;
  type: 'Revised' | 'Proposed';
  items: {
    head_id: string;
    current_allocation: number;
    proposed_amount: number;
    justification: string;
  }[];
  status: 'Draft' | 'Submitted' | 'Approved';
  createdAt: string;
}

export type ParaStatus = 'Pending' | 'Settled' | 'DAC Level';
export type ParaCategory = 'Internal' | 'External';

export interface AuditParaRecord {
  id: string;
  audit_year: string;
  category: ParaCategory;
  para_no: string;
  description: string;
  amount_involved: number;
  status: ParaStatus;
  deadline?: string; // For submission of Para-wise Comments
  school_name?: string; // Added for gender/authority parsing
  replies: { date: string; content: string }[];
  documents: CaseDocument[];
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus = 'draft' | 'in_progress' | 'submitted' | 'returned' | 'completed';

export interface CaseChecklistItem {
  id: string;
  label: string;
  done: boolean;
  required?: boolean;
}

export interface CaseDocument {
  id: string;
  name: string;
  kind: 'uploaded' | 'generated';
  createdAt: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  fileId?: string;
  version: number;
  previousVersionId?: string;
  status: 'draft' | 'final' | 'signed';
  signature?: {
    signedBy: string;
    signedAt: string;
    data: string; // Base64 signature
  };
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  resourceId?: string;
}

export type UserRole = 'admin' | 'clerk' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  office: string;
}

export interface CaseRecord {
  id: string;
  schemaVersion: number;
  employee_id: string;
  case_type: CaseType;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  reminderDate?: string;
  assignedTo?: string;
  title: string;
  checklist: CaseChecklistItem[];
  documents: CaseDocument[];
  notes: { id: string; at: string; text: string }[];
  auditLog: AuditEntry[];
  extras: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Note: Removed redundant PensionCalculationResult

export interface PdfTemplate {
  id: string;
  name: string;
  case_type: CaseType;
  document_type: string;
  active: boolean;
  fieldMappings: Record<string, string>;
  fileId: string;
  createdAt: string;
}

export interface OfficeProfile {
  office_title: string;
  district_line: string;
  govt_line: string;
  tel: string;
  web: string;
  email: string;
  recipient_title: string;
  recipient_city: string;
  signatory_title: string;
}

export interface SanctionedPost {
  id: string;
  designation: string;
  bps: number;
  sanctioned: number;
  filled: number;
  vacant: number; // sanctioned - filled
  remarks?: string;
}

export interface TokenBillRecord {
  id: string;
  token_no: string;
  submission_date: string;
  amount: number;
  description: string;
  objection_codes?: string[]; // e.g., ['OBJ001', 'OBJ002']
  status: 'Submitted' | 'Objected' | 'Encashed';
  encashment_date?: string;
  reconciliation_status: 'Matched' | 'Unmatched';
}

export interface CourtCaseRecord {
  id: string;
  wp_number: string; // WP Number
  title: string; // Case Title
  court_name: 'Peshawar High Court' | 'KP Service Tribunal' | string;
  petitioner: string;
  respondents: string[]; // [DEO, Director, Secretary, etc.]
  next_hearing: string;
  comments_deadline?: string; // Date for filing Comments
  school_name?: string; // Added for gender/authority parsing
  status: 'Pending' | 'Decided' | 'Stay Order';
  compliance_status: string;
  documents: CaseDocument[];
  updates: { date: string; summary: string }[];
}

export interface SeniorityEntry {
  employee_id: string;
  designation: string;
  seniority_no: number;
  date_of_joining_cadre: string;
  remarks?: string;
}

export interface SeniorityList {
  id: string;
  designation: string;
  cadre: string;
  last_updated: string;
  entries: SeniorityEntry[];
}

export const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'sample-001',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    employees: {
      name: 'FAZAL ALI',
      designation: 'SST (G)',
      designation_full: 'Senior Secondary Teacher (General)',
      bps: 17,
      school_full_name: 'GHS ALLAI BATTAGRAM',
      office_name: 'DEO (E&SE) BATTAGRAM',
      staff_type: 'teaching',
      status: 'Active',
      employment_category: 'Permanent',
      mobile_no: '0300-1234567',
      personal_no: '12345678',
      cnic_no: '13101-1234567-1',
      ntn_no: '1234567-8',
      father_name: 'ABDUL QAYYUM',
      nationality: 'PAKISTANI',
      district: 'BATTAGRAM',
      tehsil: 'ALLAI',
      address: 'VILLAGE ALLAI, BATTAGRAM',
      dob: '1985-06-15',
      ddo_code: 'BT4567',
      bank_ac_no: '0123456789012345',
      bank_name: 'NATIONAL BANK OF PAKISTAN',
      branch_name: 'BATTAGRAM MAIN',
      branch_code: '0123',
      account_type: 'PLS',
      gpf_account_no: 'BT/EDU/12345',
      gender: 'male',
      domicile: 'BATTAGRAM',
      birth_place: 'BATTAGRAM',
      marital_status: 'Married'
    } as any,
    service_history: {
      date_of_appointment: '2010-03-01',
      date_of_entry: '2010-03-01',
      date_of_retirement: '2045-06-14',
      retirement_order_no: '',
      retirement_order_date: '',
      lwp_days: 0,
      lpr_days: 365,
      leave_taken_days: 0,
      date_of_regularization: '2010-03-01',
      qualifying_service: '14 Years'
    },
    financials: {
      last_basic_pay: 65000,
      last_pay_with_increment: 67000,
      p_pay: 0,
      hra: 5000,
      ca: 2000,
      ma: 1500,
      uaa: 0,
      spl_allow: 0,
      teaching_allow: 3000,
      spl_allow_female: 0,
      spl_allow_disable: 0,
      integrated_allow: 0,
      charge_allow: 0,
      wa: 0,
      dress_allow: 0,
      adhoc_2015: 0,
      adhoc_2016: 0,
      adhoc_2022: 0,
      adhoc_2013: 0,
      adhoc_10pct: 0,
      dra_2022kp: 0,
      adhoc_2022_ps17: 12000,
      adhoc_2023_35: 22750,
      adhoc_2024_25: 0,
      adhoc_2025_10: 0,
      dra_2025_15: 0,
      computer_allow: 0,
      mphil_allow: 0,
      entertainment_allow: 0,
      science_teaching_allow: 0,
      weather_allow: 0,
      special_allow_non_teaching: 0,
      other: 0,
      arrears: {},
      gpf: 5000,
      gpf_advance: 0,
      bf: 1000,
      eef: 500,
      rb_death: 200,
      income_tax: 1500,
      edu_rop: 0,
      hba_loan_instal: 0,
      gpf_loan_instal: 0,
      adl_g_insurance: 0,
      group_insurance: 500,
      recovery: 0,
      allowances_extra: {},
      deductions_extra: {}
    },
    family_members: [
      {
        id: 'fam-001',
        relative_name: 'ZAINAB BIBI',
        relation: 'Spouse',
        age: 35,
        cnic: '13101-7654321-2'
      }
    ],
    extras: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_CASES: CaseRecord[] = [
  {
    id: 'case-001',
    schemaVersion: CURRENT_CASE_SCHEMA_VERSION,
    employee_id: 'sample-001',
    case_type: 'payroll',
    status: 'in_progress',
    priority: 'medium',
    title: 'Master File Creation - FAZAL ALI',
    checklist: [],
    documents: [],
    notes: [],
    auditLog: [],
    extras: {
      amendments: [],
      payroll_entries: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// --- PAYROLL DATABASE TYPES ---

export interface PrEmployee {
  employee_id: string; // BIGINT PK
  personnel_no: string; // UNIQUE
  cnic_no: string; // UNIQUE
  ntn_no?: string; // NEW
  name: string;
  father_name?: string;
  dob?: string; // DD.MM.YYYY
  nationality?: string; // NEW
  employment_category?: string; // NEW
  designation_short?: string;
  designation_full?: string; // NEW
  designation?: string; // Alias or Legacy
  bps?: string;
  staff_type?: 'teaching' | 'non_teaching' | string;
  gender?: 'Male' | 'Female' | string;
  date_of_entry?: string; // DD.MM.YYYY
  created_at: string;
  updated_at?: string;
}

export interface PrDDO {
  ddo_code: string;
  office_name: string;
  payroll_section?: string;
  gpf_section?: string;
  cash_center?: string;
}

export interface PrPosting {
  posting_id: string;
  employee_id: string;
  ddo_code: string;
  school_full_name?: string;
  office_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface PrBankAccount {
  bank_account_id: string;
  employee_id: string;
  payee_name?: string;
  bank_ac_no?: string;
  bank_name?: string;
  branch_code?: string;
  branch_name?: string;
  is_primary: boolean; // TINYINT(1)
}

export interface PrPeriod {
  period_id: string;
  ddo_code: string;
  period_month: string;
  period_year: number;
  statement_label: string;
  run_datetime?: string;
}

export interface PrPayroll {
  payroll_id: string;
  period_id: string;
  employee_id: string;
  employee_name?: string; // Derived
  personnel_no?: string; // Derived
  pay_scale_type?: string;
  pay_stage?: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  gpf_account_no?: string;
  gpf_balance?: number;
  gpf_interest_applied?: string;
  vendor_number?: string;
}

export interface PrAllowance {
  allow_id: string;
  payroll_id: string;
  wage_code: string;
  wage_name: string;
  db_short: string;
  amount: number;
}

export interface PrDeduction {
  ded_id: string;
  payroll_id: string;
  ded_code: string;
  ded_name: string;
  db_short: string;
  amount: number;
}

export interface PrLoan {
  loan_id: string;
  payroll_id: string;
  loan_code?: string;
  loan_name: string;
  db_short: string;
  principal_amount?: number;
  deduction_amount?: number;
  balance_amount?: number;
}

// Configuration Types
export type PayrollCodeType = 'allowance' | 'deduction' | 'loan';

export interface PrPayrollCode {
  id: string;
  code: string;
  label: string;
  db_short: string;
  type: PayrollCodeType;
  object_code_high?: string;
  object_code_low?: string;
  change_code?: string;
}
