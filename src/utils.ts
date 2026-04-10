import { differenceInDays, addYears, parseISO, intervalToDuration, differenceInYears } from 'date-fns';
export * from './utils/dateUtils';
import { AGE_FACTORS } from './constants';
import { EmployeeRecord, CURRENT_SCHEMA_VERSION, CaseRecord, CURRENT_CASE_SCHEMA_VERSION, CaseType, CaseChecklistItem, PdfTemplate } from './types';
import { PDFDocument, StandardFonts, PDFTextField } from 'pdf-lib';

// --- DISTRICTS & TEHSILS ---
export const KPK_DISTRICTS = [
  'Battagram', 'Mansehra', 'Abbottabad', 'Kohistan', 'Haripur', 'Shangla', 'Swat', 'Dir Upper', 'Dir Lower', 'Malakand', 
  'Peshawar', 'Mardan', 'Charsadda', 'Nowshera', 'Swabi', 'Kohat', 'Hangu', 'Karak', 'Bannu', 'Lakki Marwat', 
  'D.I. Khan', 'Tank', 'Kurram', 'Orakzai', 'Khyber', 'Mohmand', 'Bajaur', 'North Waziristan', 'South Waziristan'
];

export const DECEASED_STATUSES = ['Deceased', 'Death in Service', 'Death after Retirement'];

export const isDeceasedStatus = (status: string | undefined | null): boolean => {
  return DECEASED_STATUSES.includes(status || '');
};

export const DISTRICT_TEHSIL_MAP: Record<string, string[]> = {
  'Battagram': ['Allai', 'Battagram'],
};

// --- DOMAIN LOGIC ---

type Gender = 'M' | 'F';

export interface SchoolInfo {
  gender: 'Male' | 'Female';
  salutation: 'Sir' | 'Madam';
  authorityTitle: string;
  isFemale: boolean;
}

export const parseSchoolInfo = (schoolName: string, tehsil: string = ''): SchoolInfo => {
  const name = (schoolName || '').toUpperCase();
  
  const femaleKeywords = ['GIRLS', 'FEMALE', 'GGHS', 'GGPS', 'GGMS', 'GGHSS', 'GGMPS', 'GGMKS', 'GGCMS'];
  const isFemale = femaleKeywords.some(kw => name.includes(kw)) || name.includes('(F)');
  const gender: 'Male' | 'Female' = isFemale ? 'Female' : 'Male';
  const salutation: 'Sir' | 'Madam' = isFemale ? 'Madam' : 'Sir';

  let authorityTitle = 'District Education Officer';
  
  if (name.includes('GHSS') || name.includes('GGHSS') || name.includes('HIGHER SECONDARY')) {
    authorityTitle = 'Principal';
  } else if (name.includes('GHS') || name.includes('GGHS') || name.includes('HIGH SCHOOL')) {
    authorityTitle = isFemale ? 'Headmistress' : 'Headmaster';
  } else if (name.includes('GMS') || name.includes('GGMS') || name.includes('MIDDLE SCHOOL')) {
    authorityTitle = isFemale ? 'Headmistress' : 'Headmaster';
  } else if (name.includes('GPS') || name.includes('GGPS') || name.includes('GGMPS') || name.includes('GMPS') || name.includes('GGMKS') || name.includes('GMKS') || name.includes('GGCMS')) {
    authorityTitle = `Sub Divisional Education Officer (${isFemale ? 'Female' : 'Male'})${tehsil ? ` ${tehsil}` : ''}`;
  } else if (name.includes('PRIMARY SCHOOL')) {
    authorityTitle = `Sub Divisional Education Officer (${isFemale ? 'Female' : 'Male'})${tehsil ? ` ${tehsil}` : ''}`;
  }

  return { gender, salutation, authorityTitle, isFemale };
};

export const detectGenderFromSchoolName = (schoolName: string): Gender => {
  const info = parseSchoolInfo(schoolName);
  return info.isFemale ? 'F' : 'M';
};

export const isClassIV = (bps: unknown): boolean => {
  const b = Number(bps);
  return !isNaN(b) && b >= 1 && b <= 4;
};

export const isBpsGreaterThan4 = (bps: unknown): boolean => {
  const b = Number(bps);
  return !isNaN(b) && b > 4;
};

export const splitToChars = (
  value: string | number | undefined,
  count: number,
  opts?: { padLeft?: string; onlyDigits?: boolean } | boolean
): string[] => {
  const resolved = typeof opts === 'boolean' ? { onlyDigits: opts } : opts;
  const onlyDigits = resolved?.onlyDigits ?? true;
  if (value === undefined || value === null) return Array(count).fill('');
  let str = String(value);
  if (onlyDigits) {
    str = str.replace(/\D/g, '');
  }
  if (resolved?.padLeft) {
    str = str.padStart(count, resolved.padLeft);
  }
  const chars = str.split('');
  while (chars.length < count) chars.push('');
  return chars.slice(0, count);
};

export const getHeadOfInstitutionTitle = (employee: EmployeeRecord): string => {
  const schoolName = employee.employees.school_full_name || '';
  const tehsil = employee.employees.tehsil || '';
  const info = parseSchoolInfo(schoolName, tehsil);
  return info.authorityTitle;
};

type DepartmentKey =
  | 'education'
  | 'health'
  | 'local_government'
  | 'police'
  | 'finance'
  | 'revenue'
  | 'agriculture'
  | 'irrigation'
  | 'works'
  | 'other';

interface DepartmentTemplate {
  fullName: string;
  recipientTitle: (employee: EmployeeRecord) => string;
  signatureAlign?: 'right' | 'center' | 'left';
}

const DEPARTMENT_TEMPLATES: Record<DepartmentKey, DepartmentTemplate> = {
  education: {
    fullName: 'Department of Elementary & Secondary Education',
    recipientTitle: (employee) => {
      const gender = detectGenderFromSchoolName(employee.employees.school_full_name);
      const district = employee.employees.district || 'Battagram';
      return `The District Education Officer (${gender === 'F' ? 'Female' : 'Male'}), District ${district}.`;
    },
    signatureAlign: 'right'
  },
  health: {
    fullName: 'Health Department',
    recipientTitle: (employee) => `The District Health Officer, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  local_government: {
    fullName: 'Local Government, Elections & Rural Development Department',
    recipientTitle: (employee) => `The Chief Officer, Tehsil Municipal Administration ${employee.employees.tehsil || ''}, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  police: {
    fullName: 'Police Department',
    recipientTitle: (employee) => `The District Police Officer, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  finance: {
    fullName: 'Finance Department',
    recipientTitle: (employee) => `The District Accounts Officer, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  revenue: {
    fullName: 'Revenue Department',
    recipientTitle: (employee) => `The Deputy Commissioner, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  agriculture: {
    fullName: 'Agriculture Department',
    recipientTitle: (employee) => `The Deputy Director Agriculture, District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  irrigation: {
    fullName: 'Irrigation Department',
    recipientTitle: (employee) => `The Executive Engineer (Irrigation), District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  works: {
    fullName: 'Communication & Works Department',
    recipientTitle: (employee) => `The Executive Engineer (C&W), District ${employee.employees.district || '__________'}.`,
    signatureAlign: 'right'
  },
  other: {
    fullName: 'Government Department',
    recipientTitle: () => 'The Administrative Officer.',
    signatureAlign: 'right'
  }
};

const DEPARTMENT_KEYWORDS: Array<{ key: DepartmentKey; terms: string[] }> = [
  { key: 'education', terms: ['teacher', 'school', 'education', 'sdeo', 'deo', 'principal', 'headmaster', 'headmistress'] },
  { key: 'health', terms: ['doctor', 'nurse', 'medical', 'hospital', 'health', 'bhU', 'rhu', 'dho', 'paramedic'] },
  { key: 'local_government', terms: ['village secretary', 'secretary council', 'municipal', 'tma', 'local government', 'village council', 'union council'] },
  { key: 'police', terms: ['police', 'constable', 'asi', 'si', 'inspector', 'dpo', 'thana'] },
  { key: 'finance', terms: ['accounts', 'accountant', 'finance', 'treasury', 'audit', 'dao'] },
  { key: 'revenue', terms: ['revenue', 'patwari', 'tehsildar', 'naib tehsildar', 'land record'] },
  { key: 'agriculture', terms: ['agriculture', 'agri', 'field assistant', 'soil', 'livestock'] },
  { key: 'irrigation', terms: ['irrigation', 'canal', 'water management'] },
  { key: 'works', terms: ['c&w', 'works', 'engineering', 'sub engineer', 'xen'] }
];

const normalizeText = (v: unknown): string =>
  String(v || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectDepartmentKey = (employee: EmployeeRecord): DepartmentKey => {
  const e: any = employee?.employees || {};
  const explicitDepartment = normalizeText(
    e.department || e.department_name || e.dept || employee?.extras?.department
  );

  const designation = normalizeText(e.designation_full || e.designation);
  const office = normalizeText(e.office_name || e.school_full_name);
  const merged = `${explicitDepartment} ${designation} ${office}`.trim();

  for (const m of DEPARTMENT_KEYWORDS) {
    if (m.terms.some(t => merged.includes(normalizeText(t)))) return m.key;
  }
  return 'education';
};

export const getDepartmentProfile = (employee: EmployeeRecord) => {
  const departmentKey = detectDepartmentKey(employee);
  const template = DEPARTMENT_TEMPLATES[departmentKey];
  const district = employee?.employees?.district || 'Khyber Pakhtunkhwa';
  const designation = employee?.employees?.designation_full || employee?.employees?.designation || 'Head of Office';

  const educationHead = departmentKey === 'education' ? getHeadOfInstitutionTitle(employee) : designation;
  const officeLine = `OFFICE OF THE ${String(educationHead).toUpperCase()}`;
  const departmentLine = `${template.fullName}, ${district}`;
  const govtLine = 'Govt. of Khyber Pakhtunkhwa.';
  const recipientTitle = template.recipientTitle(employee);
  const signatureTitle = departmentKey === 'education' && !String(educationHead).toUpperCase().includes('OFFICER')
    ? `${educationHead}\n${employee.employees.school_full_name || employee.employees.office_name || ''}`
    : educationHead;

  return {
    departmentKey,
    officeLine,
    departmentLine,
    govtLine,
    recipientTitle,
    signatureTitle,
    signatureAlign: template.signatureAlign || 'right'
  };
};

export const getDEORecipientTitle = (employee: EmployeeRecord): string => {
  return getDepartmentProfile(employee).recipientTitle;
};

// --- FORMATTERS ---
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getSalutationFromSchoolName = (schoolName: string = ''): 'Sir' | 'Madam' => {
  const info = parseSchoolInfo(schoolName);
  return info.salutation;
};

export const getCoverLetterInfo = (employee: EmployeeRecord) => {
  const profile = getDepartmentProfile(employee);
  const schoolName = employee.employees.school_full_name || employee.employees.office_name || '';
  let headerTitle = profile.officeLine;
  const upperHeader = profile.officeLine.toUpperCase();
  if (
    profile.departmentKey === 'education' &&
    !upperHeader.includes('OFFICER') &&
    !upperHeader.includes('SDEO') &&
    schoolName
  ) {
    headerTitle += `\n${schoolName.toUpperCase()}`;
  }
  return {
    headerTitle,
    signatureTitle: profile.signatureTitle,
    departmentLine: profile.departmentLine,
    govtLine: profile.govtLine,
    recipientTitle: profile.recipientTitle,
    signatureAlign: profile.signatureAlign,
    departmentKey: profile.departmentKey
  };
};

export const getBeneficiaryDetails = (employee: EmployeeRecord) => {
  const ben = employee.extras?.beneficiary || {};
  if (ben.name) return ben;

  const family = employee.family_members || [];
  const heir = family.find(m => 
    m.relation.toLowerCase().includes('wife') || 
    m.relation.toLowerCase().includes('widow')
  ) || family.find(m => m.relation.toLowerCase().includes('husband'))
    || family.find(m => m.relation.toLowerCase().includes('son') || m.relation.toLowerCase().includes('daughter'));

  if (heir) {
    return {
      name: heir.relative_name,
      relation: heir.relation,
      cnic: heir.cnic,
      dob: heir.dob,
      age: heir.age,
      status: heir.status,
      bank_name: '',
      branch_name: '',
      account_no: '',
      contact: '',
      id_mark: ''
    };
  }
  return {};
};

export const getApplicantRelationTitle = (relation: string = '') => {
  const r = relation.toLowerCase();
  if (r.includes('wife') || r.includes('widow')) return 'Husband';
  if (r.includes('husband')) return 'Wife';
  if (r.includes('son') || r.includes('daughter')) return 'Father';
  return 'Father/Husband';
};

export type RetirementType = 'superannuation' | 'premature' | 'medical';

export const getRetirementType = (employee: EmployeeRecord, caseRec?: CaseRecord): RetirementType => {
  if (caseRec?.extras?.nature_of_retirement) {
    const type = caseRec.extras.nature_of_retirement.toLowerCase();
    if (type.includes('medical')) return 'medical';
    if (type.includes('premature') || type.includes('compulsory')) return 'premature';
    if (type.includes('superannuation')) return 'superannuation';
  }

  const status = employee?.employees?.status?.toLowerCase() || '';
  if (status.includes('medical')) return 'medical';
  if (status.includes('premature') || status.includes('compulsory')) return 'premature';
  if (status.includes('superannuation') || status.includes('retired') || status.includes('lpr')) return 'superannuation';

  if (employee?.employees?.dob && employee?.service_history?.date_of_retirement) {
    const dob = parseISO(employee.employees.dob);
    const dor = parseISO(employee.service_history.date_of_retirement);
    const age = differenceInYears(dor, dob);
    if (age >= 60) return 'superannuation';
  }

  return 'superannuation';
};

// --- CALCULATIONS ---

export const calculatePayroll = (financials: EmployeeRecord['financials']) => {
  const f: any = financials || {};
  
  const grossPay = 
    // Basic Pay & Core Allowances
    (f.basic_pay || 0) + 
    (f.p_pay || 0) + 
    (f.hra || 0) + 
    (f.ca || 0) + 
    (f.ma || 0) + 
    (f.uaa || 0) + 
    
    // Special Allowances
    (f.spl_allow_2021 || 0) +
    (f.teaching_allow || 0) + 
    (f.spl_allow_female || 0) + 
    (f.spl_allow_disable || 0) +
    (f.integrated_allow || 0) + 
    (f.charge_allow || 0) + 
    (f.wa || 0) + 
    (f.dress_allow || 0) + 
    
    // New Allowances
    (f.computer_allow || 0) + 
    (f.mphil_allow || 0) + 
    (f.entertainment_allow || 0) + 
    (f.science_teaching_allow || 0) + 
    (f.weather_allow || 0) +
    
    // Adhoc Reliefs
    (f.adhoc_2013 || 0) + 
    (f.adhoc_2015 || 0) +
    (f.dra_2022kp || 0) + 
    (f.adhoc_2022_ps17 || 0) +
    (f.adhoc_2023_35 || 0) + 
    (f.adhoc_2024_25 || 0) + 
    (f.adhoc_2025_10 || 0) + 
    (f.dra_2025_15 || 0) +
    
    // Dynamic Fields
    Object.values(f.arrears || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) +
    Object.values(f.allowances_extra || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);

  const totalDeduction = 
    (f.gpf || 0) + 
    (f.gpf_advance || 0) + 
    (f.bf || 0) + 
    (f.eef || 0) + 
    (f.rb_death || 0) + 
    (f.adl_g_insurance || 0) + 
    (f.group_insurance || 0) + 
    (f.income_tax || 0) + 
    (f.recovery || 0) + 
    (f.edu_rop || 0) + 
    (f.hba_loan_instal || 0) + 
    (f.gpf_loan_instal || 0) +
    Object.values(f.deductions_extra || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);

  const netPay = grossPay - totalDeduction;

  return { grossPay, totalDeduction, netPay };
};

export const calculateRetirementDate = (dob: string): string => {
  if (!dob) return '';
  const birthDate = parseISO(dob);
  if (isNaN(birthDate.getTime())) return '';
  const retirementDate = addYears(birthDate, 60);
  return retirementDate.toISOString().split('T')[0];
};

export const autoCalculateRetirementDates = (employees: EmployeeRecord[]): EmployeeRecord[] => {
  const inactiveStatuses = ['Retired', 'Deceased', 'LPR', 'Superannuation', 'Premature', 'Medical Board', 'Compulsory Retire'];

  return employees.map(emp => {
    const { dob } = emp.employees;
    const status = emp.employees.status;
    const currentRetirement = emp.service_history.date_of_retirement;
    const source = emp.extras?.retirement_date_source || (currentRetirement ? 'manual' : 'auto');

    if (inactiveStatuses.includes(status) && currentRetirement) return emp;
    if (source === 'manual' && currentRetirement) return emp;
    if (!dob) return emp;

    const calculated = calculateRetirementDate(dob);
    if (!calculated) return emp;

    if (calculated !== currentRetirement) {
      return {
        ...emp,
        service_history: { ...emp.service_history, date_of_retirement: calculated },
        extras: { ...emp.extras, retirement_date_source: 'auto' },
        updatedAt: new Date().toISOString()
      };
    }
    
    if (!emp.extras?.retirement_date_source) {
       return { 
         ...emp, 
         extras: { ...emp.extras, retirement_date_source: 'auto' } 
       };
    }

    return emp;
  });
};

// Note: Removed redundant calculatePension. Use src/lib/pension.ts instead.

export const getDefaultChecklist = (caseType: CaseType): CaseChecklistItem[] => {
  if (caseType === 'retirement') return getOfficialRetirementChecklist({} as any);
  if (caseType === 'pension') return getOfficialRetirementChecklist({} as any);
  if (caseType.startsWith('gpf')) return getOfficialGPFChecklist(caseType, {} as any);
  if (caseType === 'rbdc') return getRBDCChecklist();
  if (caseType === 'benevolent_fund') return getBenevolentFundChecklist(false);
  if (caseType === 'eef') return getEEFChecklist();
  if (caseType === 'lpr') return getLPRChecklist();
  if (caseType === 'financial_assistance') return getFinancialAssistanceChecklist();
  if (caseType === 'audit_para') return getAuditParaChecklist();
  if (caseType === 'court_case') return getCourtCaseChecklist();
  if (caseType === 'token_bill') return getTokenBillChecklist();

  const base: CaseChecklistItem[] = [
    { id: 'app', label: 'Application', done: false, required: true },
    { id: 'cnic', label: 'CNIC Copy (Attested)', done: false, required: true },
  ];
  return base;
};

// --- CHECKLISTS ---

export const getAuditParaChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'Audit Observation / Para Copy', done: false, required: true },
  { id: '2', label: 'Para-wise Comments (Draft)', done: false, required: true },
  { id: '3', label: 'Supporting Evidence (Vouchers/Orders)', done: false, required: true },
  { id: '4', label: 'Previous DAC Minutes (if any)', done: false, required: false },
  { id: '5', label: 'Annotated Reply', done: false, required: true },
];

export const getCourtCaseChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'WP / Petition Copy', done: false, required: true },
  { id: '2', label: 'Para-wise Comments / Reply', done: false, required: true },
  { id: '3', label: 'Service Record / Relevant Orders', done: false, required: true },
  { id: '4', label: 'Stay Order Copy (if applicable)', done: false, required: false },
  { id: '5', label: 'Advocate General Office Memo', done: false, required: true },
];

export const getTokenBillChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'Original Bill / Claim Form', done: false, required: true },
  { id: '2', label: 'Sanction Order', done: false, required: true },
  { id: '3', label: 'DAO Token Receipt', done: false, required: true },
  { id: '4', label: 'Expenditure Statement (M-3)', done: false, required: true },
  { id: '5', label: 'Budget Allocation Copy', done: false, required: true },
];

export const getOfficialRetirementChecklist = (employee: EmployeeRecord, caseRec?: CaseRecord): CaseChecklistItem[] => {
  const status = employee?.employees?.status || '';
  const extras = caseRec?.extras || {};
  const bps = employee?.employees?.bps || 0;

  const nature = getRetirementType(employee, caseRec);
  const retirementNature = String(extras.nature_of_retirement || '').toLowerCase();
  const isDeath = isDeceasedStatus(status) || retirementNature.includes('death');

  const items: CaseChecklistItem[] = [
    { id: '1', label: 'Personal Number', done: false, required: true },
    { id: '2', label: 'Application', done: false, required: true },
    { id: '3', label: 'CNIC', done: false, required: true },
    { id: '4', label: 'First Appointment order', done: false, required: true },
    { id: '5', label: 'Promotion Order', done: false, required: true },
    { id: '6', label: 'SSC Certificate', done: false, required: true },
    { id: '7', label: 'Last Pay Print', done: false, required: true },
    { id: '8', label: 'No Demand Certificate', done: false, required: true },
    { id: '9', label: 'Non-Involvement Certificate', done: false, required: true },
    { id: '10', label: 'Leave Not Availing Certificate Last 12 months', done: false, required: true },
    { id: '11', label: 'NOC from Bank', done: false, required: true },
    { id: '12', label: 'Clearance Certificate from School', done: false, required: true },
    { id: '13', label: 'Affidavit Qualifying Service', done: false, required: true },
    { id: '14', label: 'Original Service Book', done: false, required: true },
  ];

  if (nature === 'medical') {
    items.push({ id: '15', label: 'Medical Board Documents (In case of Medical Retirement)', done: false, required: true });
  }

  if (isDeath) {
    items.push(
      { id: '16', label: 'Legal Heir Certificate (in case of death)', done: false, required: true },
      { id: '17', label: 'Undertaking by the widow for qualifying service', done: false, required: true },
      { id: '18', label: 'Non-marriage certificate on judicial stamp paper', done: false, required: true },
      { id: '19', label: 'Single widow certificate on judicial stamp paper', done: false, required: true },
      { id: '20', label: 'Non-separation Certificate on judicial stamp paper', done: false, required: true },
      { id: '21', label: 'Death Certificate', done: false, required: true },
      { id: '22', label: 'Family Registration Certificate (FRC)', done: false, required: true }
    );
  }

  if (bps >= 16) {
    items.push(
      { id: '23', label: 'NOC from C&W, PESCO, PTCL, SNGPL (16 and above)', done: false, required: true },
      { id: '24', label: 'Leave Admissibility Certificate from DAO', done: false, required: true },
      { id: '25', label: 'Charge Report', done: false, required: true },
      { id: '26', label: 'History of Service by DAO', done: false, required: true }
    );
  }

  return items;
};

export const getOfficialGPFChecklist = (caseType: CaseType, employee: EmployeeRecord): CaseChecklistItem[] => {
  const items: CaseChecklistItem[] = [
    { id: 'gpf_1', label: 'Application by concerned', done: false, required: true },
    { id: 'gpf_2', label: 'Printed Application Form Attested by DDO', done: false, required: true },
    { id: 'gpf_3', label: 'Source - II of retired Govt. Employee duly signed by DDO', done: false, required: true },
    { id: 'gpf_4', label: 'Covering Letter from DDO', done: false, required: true },
    { id: 'gpf_5', label: 'Attested Copy of CNIC', done: false, required: true },
    { id: 'gpf_6', label: 'Payroll', done: false, required: true },
    { id: 'gpf_7', label: 'SS Certificate', done: false, required: true },
    { id: 'gpf_8', label: 'Current Balance Sheet duly verified by DAO', done: false, required: true },
  ];

  if (caseType === 'gpf_refundable') {
    items.push(
      { id: 'gpf_r_1', label: 'Source-5 Form', done: false, required: true },
      { id: 'gpf_r_2', label: 'GCVP Form', done: false, required: true },
      { id: 'gpf_r_3', label: 'TR-58 / Pay Bill', done: false, required: true },
      { id: 'gpf_r_4', label: 'Sanction Order (No & Date)', done: false, required: true },
      { id: 'gpf_r_5', label: 'Credit Memo (if Transfer Case)', done: false, required: false }
    );
  }

  if (caseType === 'gpf_non_refundable') {
    items.push(
      { id: 'gpf_nr_1', label: 'Source-6 Form', done: false, required: true },
      { id: 'gpf_nr_2', label: 'GCVP Form', done: false, required: true },
      { id: 'gpf_nr_3', label: 'TR-58 / Pay Bill', done: false, required: true },
      { id: 'gpf_nr_4', label: 'Sanction Order', done: false, required: true },
      { id: 'gpf_nr_5', label: 'Service Book 1st Page (Age Proof > 45)', done: false, required: true },
      { id: 'gpf_nr_6', label: 'Zakat Declaration (Optional)', done: false, required: false },
      { id: 'gpf_nr_7', label: '12 Months gap from last Non-Refundable', done: false, required: true }
    );
  }

  if (caseType === 'gpf_final') {
    return [
      { id: 'gpf_f_1', label: 'Form-10 (Final Payment Application)', done: false, required: true },
      { id: 'gpf_f_2', label: 'CNIC Copy', done: false, required: true },
      { id: 'gpf_f_3', label: 'Payroll showing GP deduction ceased', done: false, required: true },
      { id: 'gpf_f_4', label: 'Pay-Stoppage Certificate', done: false, required: true },
      { id: 'gpf_f_5', label: 'Original Application', done: false, required: true },
      { id: 'gpf_f_6', label: 'Credit Memo (if transfer)', done: false, required: false },
      { id: 'gpf_f_7', label: 'Nomination/Legal Heirs Docs (if Death case)', done: false, required: false }
    ];
  }

  return items;
};

export const getFamilyPensionChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'Personal Number', done: false, required: true },
  { id: '2', label: 'PPO Number', done: false, required: true },
  { id: '3', label: 'Death Certificate', done: false, required: true },
  { id: '4', label: 'Single Widow Certificate', done: false, required: true },
  { id: '5', label: 'Non Separation Certificate', done: false, required: true },
  { id: '6', label: 'Non Remarriage Certificate', done: false, required: true },
  { id: '7', label: 'Life Certificate', done: false, required: true },
  { id: '8', label: 'Bank IBAN on DCS Option Form', done: false, required: true },
  { id: '9', label: 'Indemnity Bond', done: false, required: true },
  { id: '10', label: 'List of Legal Heirs', done: false, required: true },
  { id: '11', label: 'FRC From NADRA', done: false, required: true },
  { id: '12', label: 'Photo 3', done: false, required: true },
  { id: '13', label: 'CNIC Copies 3 + 3', done: false, required: true },
  { id: '14', label: 'Descriptive Roll/Thumb Impression', done: false, required: true },
  { id: '15', label: 'Family Pension Application', done: false, required: true },
  { id: '16', label: 'Affidavit on Form – V', done: false, required: true },
  { id: '17', label: 'Department Cover Letter', done: false, required: true },
];

export const getRBDCChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: '1st Appointment Order', done: false, required: true },
  { id: '2', label: 'Attested Copy of Retirement Order', done: false, required: true },
  { id: '3', label: 'One Photograph of the beneficiary', done: false, required: true },
  { id: '4', label: 'Attested Copy of CNIC Deceased/Widow', done: false, required: true },
  { id: '5', label: 'Leave Account', done: false, required: true },
  { id: '6', label: 'Pay Print/LPC', done: false, required: true },
  { id: '7', label: 'Pay Stoppage Certificate', done: false, required: true },
  { id: '8', label: '1 & 2 pages of service book photocopy', done: false, required: true },
  { id: '9', label: 'History of Service', done: false, required: true },
  { id: '10', label: 'Cheque Copy', done: false, required: true },
  { id: '11', label: 'Application Form', done: false, required: true },
  { id: '12', label: 'List of Family Members', done: false, required: true },
  { id: '13', label: 'Specimen Signature', done: false, required: true },
  { id: '14', label: 'Single Widow Certificate', done: false, required: true },
  { id: '15', label: 'Non-Marriage Certificate', done: false, required: true },
  { id: '16', label: 'Non-Separation Certificate', done: false, required: true },
  { id: '17', label: 'Death Certificate', done: false, required: true },
  { id: '18', label: 'Copy of Family Registration Certificate (NADRA)', done: false, required: true },
];

export const getBenevolentFundChecklist = (isDeath: boolean): CaseChecklistItem[] => {
  const list: CaseChecklistItem[] = [
    { id: '1', label: 'Prescribed Retirement Grant Application Form', done: false, required: true },
    { id: '2', label: 'Attested Copy of Retirement Order', done: false, required: true },
    { id: '3', label: 'Attested Copy CNIC', done: false, required: true },
    { id: '4', label: 'Computerized pay slip', done: false, required: true },
    { id: '5', label: 'BF Contribution Certificate', done: false, required: true },
    { id: '6', label: 'Details Of Bank Account', done: false, required: true },
    { id: '7', label: 'Copy of Family Registration Certificate (NADRA)', done: false, required: true },
    { id: '8', label: 'Attested Copy of Death Certificate', done: false, required: false },
    { id: '9', label: 'Attested Copy of Pension Payment Order', done: false, required: true },
    { id: '10', label: 'C.N.I.C. OF Guarantor', done: false, required: true },
  ];

  if (isDeath) {
    list.push(
      { id: '11', label: 'Single Widow', done: false, required: true },
      { id: '12', label: 'Non-marriage/non-Separation certificate', done: false, required: true },
      { id: '13', label: 'Succession Certificate', done: false, required: true },
      { id: '14', label: 'Service Certificate', done: false, required: true },
      { id: '15', label: 'Fresh Photos', done: false, required: true },
      { id: '16', label: 'Attested Copy of Pension payment Order', done: false, required: true },
      { id: '17', label: 'CNIC Guarantee', done: false, required: true },
    );
  }
  return list;
};

export const getEEFChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: '1st Appointment Order', done: false, required: true },
  { id: '2', label: 'Attested Copy Retirement Order', done: false, required: true },
  { id: '3', label: 'Attested Copy CNIC Deceased/Widow', done: false, required: true },
  { id: '4', label: 'Attested List of Family Members', done: false, required: true },
  { id: '5', label: 'Pay Print/LPC', done: false, required: true },
  { id: '6', label: 'E.E.F Registration slip', done: false, required: true },
  { id: '7', label: 'Undertaking on Stamp paper', done: false, required: true },
  { id: '8', label: 'Prescribed Retirement Grant Application Form', done: false, required: true },
  { id: '9', label: 'Attested Copy of Family Registration Cert (NADRA)', done: false, required: true },
  { id: '10', label: 'Detail of Bank Account', done: false, required: true },
  { id: '11', label: 'Attested Copy of Death Certificate', done: false, required: false },
  { id: '12', label: 'During Service Death Certificate', done: false, required: false },
  { id: '13', label: 'Single Widow Certificate', done: false, required: false },
  { id: '14', label: 'Non-Marriage/Non-Separation Certificate', done: false, required: false },
  { id: '15', label: 'Succession Certificate', done: false, required: false },
  { id: '16', label: 'Service Certificate', done: false, required: true },
  { id: '17', label: 'Fresh Photos', done: false, required: true },
  { id: '18', label: 'Attested Copy of Pension Slip', done: false, required: true },
];

export const getLPRChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'Cover Letter/Demand Letter in the Name of ADC (F&P)', done: false, required: true },
  { id: '2', label: 'Attested Copy of Retirement/Section Order', done: false, required: true },
  { id: '3', label: 'Source – II of retired Govt. Employee duly signed by DDO', done: false, required: true },
  { id: '4', label: 'CNIC of the Concerned Govt. Employee', done: false, required: true },
  { id: '5', label: 'Last Salary Slip', done: false, required: true },
  { id: '6', label: 'Non-Payment Certificate from DAO', done: false, required: true },
  { id: '7', label: 'Affidavit duly attested by Oath commissioner', done: false, required: true },
];

export const getFinancialAssistanceChecklist = (): CaseChecklistItem[] => [
  { id: '1', label: 'Cover Letter/Demand Letter in the Name of ADC (F&P)', done: false, required: true },
  { id: '2', label: 'Application form Duly signed', done: false, required: true },
  { id: '3', label: 'Attested copy of Retirement Order/Sanction', done: false, required: true },
  { id: '4', label: 'Attested copy of CNIC of deceased', done: false, required: true },
  { id: '5', label: 'Attested copy of LPC of deceased', done: false, required: true },
  { id: '6', label: 'Attested copy of Last Pay Slip', done: false, required: true },
  { id: '7', label: 'Attested copy of Pension Slip', done: false, required: true },
  { id: '8', label: 'Attested copy of Death Certificate (NADRA)', done: false, required: true },
  { id: '9', label: 'Attested copy of Death Certificate (Village Council)', done: false, required: true },
  { id: '10', label: 'Attested copy of Death in Service certificate', done: false, required: true },
  { id: '11', label: 'Attested copy of CNIC of the applicant', done: false, required: true },
  { id: '12', label: 'Attested copy of Single Widow certificate', done: false, required: true },
  { id: '13', label: 'Attested copy of Non-Marriage Certificate', done: false, required: true },
  { id: '14', label: 'List of family members/legal Heirs', done: false, required: true },
  { id: '15', label: 'Attested copy of succession certificate', done: false, required: true },
  { id: '16', label: 'Attested copy of guardian certificate', done: false, required: true },
  { id: '17', label: 'Bank account and bank code of the applicant', done: false, required: true },
  { id: '18', label: 'Non-Payment Certificate from DAO', done: false, required: true },
  { id: '19', label: 'Affidavit duly attested by Oath commissioner', done: false, required: true },
];

export const getGPFEligibilityWarnings = (caseRec: CaseRecord, employee: EmployeeRecord): { type: 'error' | 'warning' | 'success', message: string }[] => {
  const warnings: { type: 'error' | 'warning' | 'success', message: string }[] = [];
  const extras = caseRec.extras || {};
  
  const balance = Number(extras.current_balance) || 0;
  const requested = Number(extras.amount_requested) || 0;
  
  if (balance > 0 && requested > 0) {
    if (requested > (balance * 0.8)) {
      warnings.push({ type: 'error', message: `Requested amount exceeds 80% limit (${formatCurrency(balance * 0.8)}).` });
    } else {
      warnings.push({ type: 'success', message: 'Amount is within 80% admissible limit.' });
    }
  }

  if (caseRec.case_type === 'gpf_non_refundable') {
    if (employee.employees.dob) {
      const dob = parseISO(employee.employees.dob);
      const age = differenceInYears(new Date(), dob);
      if (age < 45) {
        warnings.push({ type: 'error', message: `Employee age (${age}) is less than 45 years. Not eligible for Non-Refundable.` });
      } else {
        warnings.push({ type: 'success', message: `Age ${age} (Eligible for Non-Refundable).` });
      }
    }

    if (extras.previous_non_refundable_date) {
      const prevDate = parseISO(extras.previous_non_refundable_date);
      const monthsDiff = differenceInDays(new Date(), prevDate) / 30;
      if (monthsDiff < 12) {
        warnings.push({ type: 'error', message: 'Less than 12 months since last Non-Refundable advance.' });
      }
    }
  }

  if (caseRec.case_type === 'gpf_refundable') {
    const inst = Number(extras.installments);
    if (inst > 0 && (inst < 12 || inst > 36)) {
      warnings.push({ type: 'warning', message: 'Installments should be between 12 and 36.' });
    }
  }

  return warnings;
};

// --- IDB / BLOB STORAGE ---

const DB_NAME = 'kpk_rpms_files';
const STORE_NAME = 'files';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveFileToIDB = async (id: string, file: Blob | Uint8Array | string): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(file, id);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
};

export const getFileFromIDB = async (id: string): Promise<Blob | Uint8Array | string | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const getAllFilesFromIDB = async (): Promise<Record<string, Uint8Array>> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    const result: Record<string, Uint8Array> = {};

    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const key = cursor.key as string;
        const value = cursor.value;
        if (value instanceof Uint8Array) {
          result[key] = value;
        } else if (value instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            result[key] = new Uint8Array(reader.result as ArrayBuffer);
            cursor.continue();
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(value);
          return;
        } else if (typeof value === 'string') {
          const binaryString = window.atob(value.split(',')[1] || value);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          result[key] = bytes;
        }
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
};

export const clearCaseDocuments = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      
      req.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          const key = cursor.key as string;
          if (typeof key === 'string' && key.startsWith('doc_')) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IDB Clear Error or not supported:", e);
    return Promise.resolve();
  }
};

// --- PDF GENERATION ---

export const calculateServiceDuration = (doa: string, dor: string, lwpDays: number = 0): { text: string, years: number, months: number, days: number } => {
  if (!doa || !dor) return { text: '0 Years', years: 0, months: 0, days: 0 };
  
  const start = parseISO(doa);
  const end = parseISO(dor);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { text: 'Invalid Dates', years: 0, months: 0, days: 0 };
  
  const duration = intervalToDuration({ start, end });
  let years = duration.years || 0;
  let months = duration.months || 0;
  let days = duration.days || 0;

  let totalDays = (years * 365) + (months * 30) + days - lwpDays;
  if (totalDays < 0) totalDays = 0;

  const finalYears = Math.floor(totalDays / 365);
  const remDays = totalDays % 365;
  const finalMonths = Math.floor(remDays / 30);
  const finalDays = remDays % 30;

  return {
    text: `${finalYears} Years ${finalMonths} Months ${finalDays} Days`,
    years: finalYears,
    months: finalMonths,
    days: finalDays
  };
};

export const calculateServiceYears = (doa: string, dor: string, lwpDays: number = 0): number => {
  const dur = calculateServiceDuration(doa, dor, lwpDays);
  return dur.years;
};

export const generateFilledPdf = async (
  templateFile: Uint8Array | Blob | string,
  employee: EmployeeRecord,
  caseRec: CaseRecord
): Promise<Uint8Array> => {
  let pdfBytes: ArrayBuffer;

  if (templateFile instanceof Blob) {
    pdfBytes = await templateFile.arrayBuffer();
  } else if (typeof templateFile === 'string') {
    const binaryString = window.atob(templateFile.split(',')[1] || templateFile);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    pdfBytes = bytes.buffer;
  } else {
    pdfBytes = templateFile.buffer as ArrayBuffer;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement,
    employee.service_history.lwp_days
  );

  const context: Record<string, string> = {
    'employee.name': employee.employees.name,
    'employee.father_name': employee.employees.father_name,
    'employee.designation': employee.employees.designation,
    'employee.bps': employee.employees.bps.toString(),
    'employee.personal_no': employee.employees.personal_no,
    'employee.cnic_no': employee.employees.cnic_no,
    'employee.office_name': employee.employees.office_name,
    'employee.gpf_account_no': employee.employees.gpf_account_no,
    'employee.bank_ac_no': employee.employees.bank_ac_no,
    'employee.bank_name': employee.employees.bank_name,
    'service.date_of_appointment': employee.service_history.date_of_appointment,
    'service.date_of_retirement': employee.service_history.date_of_retirement,
    'financials.basic_pay': employee.financials.basic_pay.toString(),
    'financials.net_pay': (calculatePayroll(employee.financials).netPay).toString(),
    'office.office_title': (employee.employees.office_name || 'Department of Education'),
    'office.district_line': (employee.employees.district || 'Battagram'),
    'service_history.date_of_appointment': employee.service_history.date_of_appointment,
    'service_history.date_of_retirement': employee.service_history.date_of_retirement,
    'computed.total_service_text': service.text,
    'case.extras.nature_of_retirement': (caseRec.extras?.nature_of_retirement || employee.employees.status) as string,
    'current_date': new Date().toLocaleDateString('en-GB'),
    'date': new Date().toLocaleDateString('en-GB'),
    'school.gender': parseSchoolInfo(employee.employees.school_full_name).gender,
    'school.salutation': parseSchoolInfo(employee.employees.school_full_name).salutation,
    'school.authority_title': parseSchoolInfo(employee.employees.school_full_name, employee.employees.tehsil).authorityTitle,
  };

  const fields = form.getFields();
  const templateObj = (localStorage.getItem('kpk_rpms_templates') 
    ? JSON.parse(localStorage.getItem('kpk_rpms_templates')!).find((t: PdfTemplate) => t.document_type === caseRec.case_type || t.id === (caseRec as any).templateId)
    : null) as PdfTemplate | null;

  fields.forEach(field => {
    const fieldName = field.getName();
    
    let value = '';
    if (templateObj && templateObj.fieldMappings && templateObj.fieldMappings[fieldName]) {
      const mapping = templateObj.fieldMappings[fieldName];
      if (mapping === 'manual') {
        value = (caseRec.extras?.[`field_${fieldName}`] as string) || '';
      } else {
        value = context[mapping] || '';
      }
    } else {
      value = context[fieldName] || '';
    }

    if (value) {
      try {
        if (field instanceof PDFTextField) {
          field.setText(value);
          field.updateAppearances(helvetica);
        }
      } catch (e) {
        console.warn(`Could not set field ${fieldName}`, e);
      }
    }
  });

  form.flatten();

  return pdfDoc.save();
};

// --- MIGRATION LOGIC (EMPLOYEES) ---

const OFFICIAL_IDENTITY_KEYS = new Set([
  'name', 'designation', 'bps', 'school_full_name', 'office_name', 'status', 'staff_type',
  'mobile_no', 'personal_no', 'cnic_no', 'father_name', 'nationality', 'address', 
  'dob', 'ddo_code', 'bank_ac_no', 'bank_branch', 'account_type', 'gpf_account_no',
  'district', 'tehsil', 'bank_name', 'branch_name', 'branch_code',
  'ntn_no', 'employment_category', 'designation_full', 'gender', 'ppo_no'
]);

const OFFICIAL_SERVICE_KEYS = new Set([
  'date_of_appointment', 'date_of_entry', 'date_of_retirement', 
  'retirement_order_no', 'retirement_order_date', 'lwp_days', 'lpr_days', 
  'leave_taken_days', 'qualifying_service', 'date_of_regularization', 'date_of_death'
]);

const OFFICIAL_FIN_ALLOWANCE_KEYS = new Set([
  'basic_pay', 'p_pay', 'hra', 'ca', 'ma', 'uaa', 
  'spl_allow_2021', 'teaching_allow', 'spl_allow_female', 'spl_allow_disable', 
  'integrated_allow', 'charge_allow', 'wa', 'dress_allow',
  'computer_allow', 'mphil_allow', 'entertainment_allow',
  'science_teaching_allow', 'weather_allow',
  'adhoc_2013', 'adhoc_2015', 'dra_2022kp', 'adhoc_2022_ps17', 
  'adhoc_2023_35', 'adhoc_2024_25', 'adhoc_2025_10', 'dra_2025_15'
]);

const OFFICIAL_FIN_DEDUCTION_KEYS = new Set([
  'gpf', 'gpf_sub', 'gpf_advance', 'bf', 'eef', 
  'rb_death', 'adl_g_insurance', 'group_insurance', 'income_tax', 'recovery',
  'edu_rop', 'hba_loan_instal', 'gpf_loan_instal'
]);

export const migrateToV2 = (oldData: any[]): EmployeeRecord[] => {
  return oldData.map(old => {
    let status = old.status || old.employees?.status || 'Active';
    if (typeof status === 'string') {
      if (status.startsWith('Retired - ')) {
        status = status.replace('Retired - ', '');
      }
    }

    if (old.schemaVersion === CURRENT_SCHEMA_VERSION) {
      old.employees.status = status;
      
      if (!old.employees.staff_type) {
        old.employees.staff_type = 'teaching';
      }
      if (old.service_history && old.service_history.leave_taken_days === undefined) {
        old.service_history.leave_taken_days = 0;
      }
      if (!old.employees.bank_name) old.employees.bank_name = '';
      if (!old.employees.branch_name) {
        old.employees.branch_name = old.employees.bank_branch || '';
      }
      if (!old.employees.branch_code) old.employees.branch_code = '';
      if (!old.employees.ntn_no) old.employees.ntn_no = '';
      if (!old.employees.employment_category) old.employees.employment_category = '';
      if (!old.employees.designation_full) old.employees.designation_full = '';
      if (!old.employees.gender) old.employees.gender = 'Male';
      if (!old.employees.ppo_no) old.employees.ppo_no = '';

      // Migrate old field names to new
      if (old.financials) {
        // Migrate last_basic_pay to basic_pay
        if (old.financials.last_basic_pay && !old.financials.basic_pay) {
          old.financials.basic_pay = old.financials.last_basic_pay;
        }
        // Migrate spl_allow to spl_allow_2021
        if (old.financials.spl_allow_2021 && !old.financials.spl_allow_2021) {
          old.financials.spl_allow_2021 = old.financials.spl_allow_2021;
        }
        // Clean up deprecated fields
        delete old.financials.last_basic_pay;
        delete old.financials.last_pay_with_increment;
        delete old.financials.spl_allow;
        delete old.financials.special_allow_non_teaching;
        delete old.financials.adhoc_10pct;
        delete old.financials.adhoc_2016;
        delete old.financials.adhoc_2022;
      }

      // Fix SPST BPS-14 designation mismatches
      try {
        const bps = Number(old.employees?.bps) || 0;
        const dShort = (old.employees?.designation || '').trim().toUpperCase();
        const dFullRaw = (old.employees?.designation_full || old.employees?.designation || '').trim().toUpperCase();
        const looksLikeSPST =
          bps === 14 &&
          (
            dFullRaw === 'SENIOR PST' ||
            dFullRaw.includes('SENIOR PST') ||
            dFullRaw.startsWith('SENIOR PRIMARY SCHOOL TEA') ||
            dShort === 'SENIOR PST'
          );
        if (looksLikeSPST) {
          old.employees.designation_full = 'SENIOR PRIMARY SCHOOL TEACHER';
          old.employees.designation = 'SPST';
        } else {
          if (dFullRaw === 'SENIOR PRIMARY SCHOOL TEACHER' && dShort !== 'SPST') {
            old.employees.designation = 'SPST';
          }
          if (dShort === 'SPST' && dFullRaw.startsWith('SENIOR PRIMARY SCHOOL TEA')) {
            old.employees.designation_full = 'SENIOR PRIMARY SCHOOL TEACHER';
          }
        }
      } catch {}

      return old as EmployeeRecord;
    }

    const now = new Date().toISOString();
    
    const record: EmployeeRecord = {
      id: old.id || Date.now().toString(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      employees: {
        name: old.name || '', 
        designation: old.designation || '', 
        bps: Number(old.bps) || 0,
        school_full_name: old.school_full_name || '', 
        office_name: old.office_name || '',
        staff_type: old.staff_type || 'teaching',
        status: status, 
        mobile_no: old.mobile_no || '', 
        personal_no: old.personal_no || '',
        cnic_no: old.cnic_no || '', 
        father_name: old.father_name || '', 
        nationality: old.nationality || 'Pakistani',
        district: old.district || 'Battagram', 
        tehsil: old.tehsil || 'Allai',
        address: old.address || '', 
        dob: old.dob || '', 
        ddo_code: old.ddo_code || '',
        bank_ac_no: old.bank_ac_no || '', 
        bank_branch: old.bank_branch || '',
        bank_name: old.bank_name || '',
        branch_name: old.branch_name || old.bank_branch || '',
        branch_code: old.branch_code || '',
        account_type: old.account_type || 'PLS', 
        gpf_account_no: old.gpf_account_no || '',
        ntn_no: old.ntn_no || '',
        employment_category: old.employment_category || '',
        designation_full: old.designation_full || '',
        gender: old.gender || 'Male',
        ppo_no: old.ppo_no || ''
      },
      service_history: {
        date_of_appointment: '', 
        date_of_entry: '', 
        date_of_retirement: '',
        retirement_order_no: '', 
        retirement_order_date: '', 
        lwp_days: 0, 
        lpr_days: 365, 
        leave_taken_days: 0,
        date_of_regularization: '',
        date_of_death: ''
      },
      financials: {
        basic_pay: 0, 
        p_pay: 0, 
        hra: 0, 
        ca: 0, 
        ma: 0, 
        uaa: 0,
        spl_allow_2021: 0,
        teaching_allow: 0, 
        spl_allow_female: 0, 
        spl_allow_disable: 0,
        integrated_allow: 0, 
        charge_allow: 0, 
        wa: 0, 
        dress_allow: 0, 
        computer_allow: 0, 
        mphil_allow: 0, 
        entertainment_allow: 0,
        science_teaching_allow: 0, 
        weather_allow: 0,
        adhoc_2013: 0, 
        adhoc_2015: 0,
        dra_2022kp: 0, 
        adhoc_2022_ps17: 0,
        adhoc_2023_35: 0, 
        adhoc_2024_25: 0, 
        adhoc_2025_10: 0, 
        dra_2025_15: 0,
        arrears: {},
        gpf: 0, 
        gpf_sub: 0,
        gpf_advance: 0, 
        bf: 0, 
        eef: 0, 
        rb_death: 0, 
        adl_g_insurance: 0, 
        group_insurance: 0, 
        income_tax: 0, 
        recovery: 0, 
        edu_rop: 0,
        hba_loan_instal: 0, 
        gpf_loan_instal: 0,
        allowances_extra: {}, 
        deductions_extra: {}
      },
      family_members: Array.isArray(old.familyMembers) ? old.familyMembers : 
                      (Array.isArray(old.family_members) ? old.family_members : []),
      extras: {},
      createdAt: old.createdAt || now,
      updatedAt: now
    };

    // Migrate Service History
    const srcService = old.serviceHistory || old.service_history || {};
    if (old.date_of_appointment) srcService.date_of_appointment = old.date_of_appointment;
    
    Object.keys(srcService).forEach(key => {
      const val = srcService[key];
      if (OFFICIAL_SERVICE_KEYS.has(key)) {
        (record.service_history as any)[key] = val;
      } else {
        record.extras[`service_${key}`] = val;
      }
    });

    // Migrate Financials
    const srcFin = old.financials || {};
    Object.keys(srcFin).forEach(key => {
      const val = Number(srcFin[key]) || 0;
      
      // Map legacy field names
      if (key === 'last_basic_pay' || key === 'basic_pay') {
        record.financials.basic_pay = val;
      } else if (key === 'spl_allow_2021' || key === 'spl_allow_2021') {
        record.financials.spl_allow_2021 = val;
      } else if (key === 'gpf_deduction') {
        record.financials.gpf = val;
      } else if (key === 'gpf_advance_recovery') {
        record.financials.gpf_advance = val;
      } else if (key === 'recovery_other') {
        record.financials.recovery = val;
      }
      // Skip deprecated fields
      else if (['last_pay_with_increment', 'adhoc_10pct', 'adhoc_2016', 'adhoc_2022'].includes(key)) {
        // Skip these deprecated fields
      }
      // Official Direct Match
      else if (OFFICIAL_FIN_ALLOWANCE_KEYS.has(key)) {
        (record.financials as any)[key] = val;
      } else if (OFFICIAL_FIN_DEDUCTION_KEYS.has(key)) {
        (record.financials as any)[key] = val;
      }
      // Arrears
      else if (key.toLowerCase().startsWith('ar_') || key.toLowerCase().startsWith('dra_') || key.toLowerCase() === 'da') {
        record.financials.arrears[key] = val;
      }
      // Everything else -> Allowance Extra
      else {
        record.financials.allowances_extra[key] = val;
      }
    });

    // Migrate Root Extras
    Object.keys(old).forEach(key => {
      if (
        key === 'id' || key === 'schemaVersion' || key === 'createdAt' || key === 'updatedAt' ||
        key === 'financials' || key === 'serviceHistory' || key === 'service_history' || 
        key === 'familyMembers' || key === 'family_members'
      ) return;

      if (OFFICIAL_IDENTITY_KEYS.has(key)) return;
      if (OFFICIAL_SERVICE_KEYS.has(key)) return;

      record.extras[key] = old[key];
    });

    // Normalize SPST BPS-14
    try {
      const bps = Number(record.employees?.bps) || 0;
      const dShort = (record.employees?.designation || '').trim().toUpperCase();
      const dFullRaw = (record.employees?.designation_full || record.employees?.designation || '').trim().toUpperCase();
      const looksLikeSPST =
        bps === 14 &&
        (
          dFullRaw === 'SENIOR PST' ||
          dFullRaw.includes('SENIOR PST') ||
          dFullRaw.startsWith('SENIOR PRIMARY SCHOOL TEA') ||
          dShort === 'SENIOR PST'
        );
      if (looksLikeSPST) {
        record.employees.designation_full = 'SENIOR PRIMARY SCHOOL TEACHER';
        record.employees.designation = 'SPST';
      } else {
        if (dFullRaw === 'SENIOR PRIMARY SCHOOL TEACHER' && dShort !== 'SPST') {
          record.employees.designation = 'SPST';
        }
        if (dShort === 'SPST' && dFullRaw.startsWith('SENIOR PRIMARY SCHOOL TEA')) {
          record.employees.designation_full = 'SENIOR PRIMARY SCHOOL TEACHER';
        }
      }
    } catch {}

    return record;
  });
};

export const migrateCasesToV1 = (oldData: any[]): CaseRecord[] => {
  return oldData.map(c => {
    if (c.schemaVersion === CURRENT_CASE_SCHEMA_VERSION) return c as CaseRecord;
    
    return {
      id: c.id || Date.now().toString(),
      schemaVersion: CURRENT_CASE_SCHEMA_VERSION,
      employee_id: c.employee_id || '',
      case_type: c.case_type || 'other',
      status: c.status || 'draft',
      priority: c.priority || 'medium',
      title: c.title || 'Untitled Case',
      checklist: Array.isArray(c.checklist) ? c.checklist : [],
      notes: Array.isArray(c.notes) ? c.notes : [],
      documents: Array.isArray(c.documents) ? c.documents : [],
      auditLog: Array.isArray(c.auditLog) ? c.auditLog : [],
      extras: c.extras || {},
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString()
    };
  }) as CaseRecord[];
};

// --- DUPLICATE DETECTION ---

export interface DuplicateGroup {
  groupId: string;
  ids: string[];
  reasons: string[];
}

export const detectDuplicateGroups = (employees: EmployeeRecord[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];
  const visited = new Set<string>();

  const norm = (s: string | undefined) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  for (let i = 0; i < employees.length; i++) {
    const a = employees[i];
    if (visited.has(a.id)) continue;

    const currentGroupIds = [a.id];
    const reasons = new Set<string>();

    for (let j = i + 1; j < employees.length; j++) {
      const b = employees[j];
      if (visited.has(b.id)) continue;

      let isDup = false;

      const cnicA = norm(a.employees.cnic_no);
      const cnicB = norm(b.employees.cnic_no);
      if (cnicA && cnicB && cnicA.length > 5 && cnicA === cnicB) {
        isDup = true;
        reasons.add('Same CNIC');
      }

      const pnoA = norm(a.employees.personal_no);
      const pnoB = norm(b.employees.personal_no);
      if (pnoA && pnoB && pnoA.length > 4 && pnoA === pnoB) {
        isDup = true;
        reasons.add('Same Personnel No');
      }

      if (isDup) {
        currentGroupIds.push(b.id);
        visited.add(b.id);
      }
    }

    if (currentGroupIds.length > 1) {
      groups.push({
        groupId: `dup_${a.id}_${Date.now()}`,
        ids: currentGroupIds,
        reasons: Array.from(reasons)
      });
      visited.add(a.id); 
    }
  }

  return groups;
};
