import { EmployeeRecord, CURRENT_SCHEMA_VERSION, OfficialFamilyMember } from '../types';
import { calculateRetirementDate, KPK_DISTRICTS } from '../utils';

// --- DATE HELPERS ---

export const formatDateForCsv = (isoDate?: string): string => {
  if (!isoDate) return '';
  if (isoDate.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
    const parts = isoDate.split(/[-/]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${d}/${m}/${y}`;
  }
  
  const [y, m, d] = isoDate.split('-');
  if (y && m && d && y.length === 4) {
    return `${d}/${m}/${y}`;
  }
  return isoDate;
};

export const parseDateFromCsv = (csvDate?: string): string => {
  if (!csvDate) return '';
  const clean = csvDate.trim();
  
  const ddmmyyyy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  const yyyymmdd = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = yyyymmdd[2].padStart(2, '0');
    const d = yyyymmdd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return clean;
};

export const CSV_HEADERS = [
  'name', 'designation', 'bps', 'school_full_name', 'office_name', 'staff_type', 'status',
  'cnic_no', 'personal_no', 'mobile_no', 'father_name', 
  'dob', 'nationality', 'address', 'district', 'tehsil', 'ddo_code',
  'bank_ac_no', 'bank_name', 'branch_name', 'branch_code', 'account_type', 'gpf_account_no', 'ppo_no',
  'ntn_no', 'employment_category', 'designation_full',
  'gender',
  'date_of_appointment', 'date_of_entry', 'date_of_retirement', 
  'retirement_order_no', 'retirement_order_date', 
  'lwp_days', 'lpr_days', 'leave_taken_days',
  'date_of_regularization', 'date_of_death',
  'basic_pay', 'p_pay', 'hra', 'ca', 'ma', 'uaa',
  'spl_allow_2021', 'teaching_allow', 'spl_allow_female', 'spl_allow_disable', 
  'integrated_allow', 'charge_allow', 'wa', 'dress_allow',
  'computer_allow', 'mphil_allow', 'entertainment_allow', 'science_teaching_allow', 'weather_allow', 'special_allow_non_teaching',
  'adhoc_2013', 'adhoc_2015', 'adhoc_2022_ps17', 'dra_2022kp', 'adhoc_2023_35', 'adhoc_2024_25', 'adhoc_2025_10', 'dra_2025_15',
  'gpf', 'gpf_sub', 'gpf_advance', 'bf', 'eef', 'rb_death', 'adl_g_insurance', 'group_insurance', 'income_tax', 'income_tax_ded', 'recovery',
  'edu_rop', 'hba_loan_instal', 'gpf_loan_instal',
  'family_1_name', 'family_1_relation', 'family_1_age', 'family_1_cnic',
  'family_2_name', 'family_2_relation', 'family_2_age', 'family_2_cnic',
  'family_3_name', 'family_3_relation', 'family_3_age', 'family_3_cnic',
  'family_4_name', 'family_4_relation', 'family_4_age', 'family_4_cnic',
  'family_5_name', 'family_5_relation', 'family_5_age', 'family_5_cnic',
  'family_6_name', 'family_6_relation', 'family_6_age', 'family_6_cnic',
  'commutation_portion', 'retirement_date_source',
  'beneficiary_name', 'beneficiary_relation', 'beneficiary_age', 'beneficiary_cnic',
  'beneficiary_bank_name', 'beneficiary_branch_name', 'beneficiary_account_no',
  'bank_branch',
];

export const flattenEmployee = (emp: EmployeeRecord): Record<string, any> => {
  const flat: Record<string, any> = {};

  Object.assign(flat, emp.employees);
  if (emp.employees.dob) flat.dob = formatDateForCsv(emp.employees.dob);

  Object.assign(flat, emp.service_history);
  if (emp.service_history.date_of_appointment) flat.date_of_appointment = formatDateForCsv(emp.service_history.date_of_appointment);
  if (emp.service_history.date_of_entry) flat.date_of_entry = formatDateForCsv(emp.service_history.date_of_entry);
  if (emp.service_history.date_of_retirement) flat.date_of_retirement = formatDateForCsv(emp.service_history.date_of_retirement);
  if (emp.service_history.retirement_order_date) flat.retirement_order_date = formatDateForCsv(emp.service_history.retirement_order_date);
  if (emp.service_history.date_of_regularization) flat.date_of_regularization = formatDateForCsv(emp.service_history.date_of_regularization);
  if ((emp.service_history as any).date_of_death) flat.date_of_death = formatDateForCsv((emp.service_history as any).date_of_death);

  Object.assign(flat, emp.financials);

  (emp.family_members || []).slice(0, 6).forEach((fm, idx) => {
    const prefix = `family_${idx + 1}`;
    flat[`${prefix}_name`] = fm.relative_name;
    flat[`${prefix}_relation`] = fm.relation;
    flat[`${prefix}_age`] = fm.age;
    flat[`${prefix}_cnic`] = fm.cnic;
  });

  if (emp.extras) {
    if (typeof emp.extras.commutation_portion !== 'undefined') {
      flat.commutation_portion = emp.extras.commutation_portion;
    }
    if (typeof (emp.extras as any).retirement_date_source !== 'undefined') {
      flat.retirement_date_source = (emp.extras as any).retirement_date_source;
    }
    const ben = (emp.extras as any).beneficiary;
    if (ben) {
      flat.beneficiary_name = ben.name || '';
      flat.beneficiary_relation = ben.relation || '';
      flat.beneficiary_age = ben.age || '';
      flat.beneficiary_cnic = ben.cnic || '';
      flat.beneficiary_bank_name = ben.bank_name || '';
      flat.beneficiary_branch_name = ben.branch_name || '';
      flat.beneficiary_account_no = ben.account_no || '';
    }
  }
  
  if ((emp.employees as any).gender) flat.gender = (emp.employees as any).gender;

  return flat;
};

export const deriveGender = (cnic: string, existingGender?: string, csvGender?: string): 'Male' | 'Female' => {
  const normalizeGender = (g?: string): 'Female' | 'Male' | undefined => {
    if (!g) return undefined;
    const v = g.toLowerCase().trim();
    if (v === 'female' || v === 'f') return 'Female';
    if (v === 'male' || v === 'm') return 'Male';
    return undefined;
  };

  const gCsv = normalizeGender(csvGender);
  if (gCsv) return gCsv;

  const gExist = normalizeGender(existingGender);
  if (gExist) return gExist;

  const cnicDigits = cnic.replace(/[^0-9]/g, '');
  if (cnicDigits.length > 0) {
    const lastCnicDigit = cnicDigits[cnicDigits.length - 1];
    const isEven = ['0', '2', '4', '6', '8'].includes(lastCnicDigit);
    return isEven ? 'Female' : 'Male';
  }

  return 'Male';
};

export const deriveStaffType = (csvStaffType?: string, existingStaffType?: string): 'teaching' | 'non_teaching' => {
  const normalize = (val?: string): 'teaching' | 'non_teaching' | undefined => {
    if (!val) return undefined;
    const v = val.toLowerCase().replace(/[-_\s]/g, '').trim();
    if (v === 'nonteaching') return 'non_teaching';
    if (v === 'teaching') return 'teaching';
    return undefined;
  };

  const csvNorm = normalize(csvStaffType);
  if (csvNorm) return csvNorm;

  const existNorm = normalize(existingStaffType);
  if (existNorm) return existNorm;

  return 'teaching';
};

/**
 * Normalizes a district name to match KPK_DISTRICTS list.
 * Handles case differences like "BATTAGRAM" → "Battagram",
 * "D.I. KHAN" → "D.I. Khan", etc.
 *
 * @returns The matched district name from KPK_DISTRICTS, or the
 *          original trimmed value if no match found, or empty string.
 */
const normalizeDistrict = (rawDistrict: string, districtsList: string[] = KPK_DISTRICTS): string => {
  if (!rawDistrict) return '';
  const trimmed = rawDistrict.trim();
  if (!trimmed) return '';

  // 1. Exact match
  const exact = districtsList.find(d => d === trimmed);
  if (exact) return exact;

  // 2. Case-insensitive match
  const lower = trimmed.toLowerCase();
  const caseMatch = districtsList.find(d => d.toLowerCase() === lower);
  if (caseMatch) return caseMatch;

  // 3. Normalized match (remove dots, spaces, dashes)
  const normalize = (s: string) => s.toLowerCase().replace(/[.\s-]/g, '');
  const normalizedInput = normalize(trimmed);
  const normalizedMatch = districtsList.find(d => normalize(d) === normalizedInput);
  if (normalizedMatch) return normalizedMatch;

  // 4. Partial / contains match (e.g., "Chitral" matches "Chitral Lower" or "Chitral Upper")
  // Only use this if the input is long enough to avoid false positives
  if (trimmed.length >= 4) {
    const partialMatch = districtsList.find(d =>
      d.toLowerCase().includes(lower) || lower.includes(d.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }

  // 5. No match found — return as-is (title case)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Normalizes a tehsil name — title case conversion.
 */
const normalizeTehsil = (rawTehsil: string): string => {
  if (!rawTehsil) return '';
  const trimmed = rawTehsil.trim();
  if (!trimmed) return '';

  // Title case: "BATTAGRAM" → "Battagram", "allai" → "Allai"
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const unflattenEmployee = (
  row: Record<string, string>, 
  existing?: EmployeeRecord
): EmployeeRecord => {
  const now = new Date().toISOString();
  
  const num = (key: string) => {
    const val = row[key];
    if (val === undefined || val === null || val === '') return undefined;
    const clean = val.replace(/,/g, '');
    return isNaN(Number(clean)) ? 0 : Number(clean);
  };

  const str = (key: string) => row[key] ? row[key].trim() : '';

  const date = (key: string) => parseDateFromCsv(row[key]);

  const dobVal = date('dob') || existing?.employees.dob || '';
  const doaVal = date('date_of_appointment') || existing?.service_history.date_of_appointment || '';
  const cnicSource = str('cnic_no') || existing?.employees.cnic_no || '';

  const staffType = deriveStaffType(str('staff_type'), existing?.employees.staff_type);

  const genderCsvRaw = str('gender') || undefined;
  const existingGenderRaw = (existing as any)?.employees?.gender as string | undefined;
  const genderVal = deriveGender(cnicSource, existingGenderRaw, genderCsvRaw);
  
  let dorVal = date('date_of_retirement') || existing?.service_history.date_of_retirement || '';
  if (!dorVal && dobVal) {
    dorVal = calculateRetirementDate(dobVal);
  }

  // ── FIXED: District & Tehsil with proper normalization ──────────────
  // Priority: CSV value → existing value → empty string (no hardcoded default)
  // Normalize case: "BATTAGRAM" → "Battagram" to match KPK_DISTRICTS list
  const rawDistrict = str('district');
  const rawTehsil = str('tehsil');

  const districtVal = rawDistrict
    ? normalizeDistrict(rawDistrict)
    : (existing?.employees.district || '');

  const tehsilVal = rawTehsil
    ? normalizeTehsil(rawTehsil)
    : (existing?.employees.tehsil || '');

  // DEBUG: Log district resolution (remove after confirming fix)
  if (rawDistrict) {
    console.log(`[District Import] Raw: "${rawDistrict}" → Normalized: "${districtVal}"`);
  }

  const newRecord: EmployeeRecord = {
    id: existing?.id || Date.now().toString() + Math.floor(Math.random() * 1000),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    
    extras: existing?.extras || {},
    
    employees: {
      ...existing?.employees,
      name: str('name') || existing?.employees.name || '',
      designation: str('designation') || existing?.employees.designation || '',
      designation_full: str('designation_full') || existing?.employees.designation_full || '',
      bps: num('bps') ?? existing?.employees.bps ?? 0,
      school_full_name: str('school_full_name') || existing?.employees.school_full_name || '',
      office_name: str('office_name') || existing?.employees.office_name || '',
      staff_type: staffType,
      status: str('status') as any || existing?.employees.status || 'Active',
      gender: genderVal,
      
      cnic_no: str('cnic_no') || existing?.employees.cnic_no || '',
      personal_no: str('personal_no') || existing?.employees.personal_no || '',
      ntn_no: str('ntn_no') || existing?.employees.ntn_no || '',
      
      mobile_no: str('mobile_no') || existing?.employees.mobile_no || '',
      father_name: str('father_name') || existing?.employees.father_name || '',
      dob: dobVal,
      nationality: str('nationality') || existing?.employees.nationality || 'Pakistani',
      address: str('address') || existing?.employees.address || '',
      
      // ── FIXED: Uses normalized values, no hardcoded defaults ────────
      district: districtVal,
      tehsil: tehsilVal,
      
      ddo_code: str('ddo_code') || existing?.employees.ddo_code || '',
      
      bank_ac_no: str('bank_ac_no') || existing?.employees.bank_ac_no || '',
      bank_name: str('bank_name') || existing?.employees.bank_name || '',
      branch_name: str('branch_name') || existing?.employees.branch_name || '',
      branch_code: str('branch_code') || existing?.employees.branch_code || '',
      bank_branch: str('bank_branch') || str('branch_name') || existing?.employees.bank_branch || '',
      
      account_type: str('account_type') || existing?.employees.account_type || 'PLS',
      gpf_account_no: str('gpf_account_no') || existing?.employees.gpf_account_no || '',
      ppo_no: str('ppo_no') || existing?.employees.ppo_no || '',
      employment_category: str('employment_category') || existing?.employees.employment_category || 'Permanent',
    },

    service_history: {
      ...existing?.service_history,
      date_of_appointment: doaVal,
      date_of_entry: date('date_of_entry') || existing?.service_history.date_of_entry || '',
      date_of_retirement: dorVal,
      retirement_order_no: str('retirement_order_no') || existing?.service_history.retirement_order_no || '',
      retirement_order_date: date('retirement_order_date') || existing?.service_history.retirement_order_date || '',
      lwp_days: num('lwp_days') ?? existing?.service_history.lwp_days ?? 0,
      lpr_days: num('lpr_days') ?? existing?.service_history.lpr_days ?? 365,
      leave_taken_days: num('leave_taken_days') ?? existing?.service_history.leave_taken_days ?? 0,
      date_of_regularization: date('date_of_regularization') || (existing as any)?.service_history?.date_of_regularization || '',
      date_of_death: date('date_of_death') || (existing as any)?.service_history?.date_of_death || '',
    },

    financials: {
      ...existing?.financials,
      basic_pay: num('basic_pay') ?? existing?.financials.basic_pay ?? existing?.financials.last_basic_pay ?? 0,
      last_basic_pay: num('last_basic_pay') ?? existing?.financials.last_basic_pay ?? 0,
      last_pay_with_increment: num('last_pay_with_increment') ?? existing?.financials.last_pay_with_increment ?? 0,
      p_pay: num('p_pay') ?? existing?.financials.p_pay ?? 0,
      hra: num('hra') ?? existing?.financials.hra ?? 0,
      ca: num('ca') ?? existing?.financials.ca ?? 0,
      ma: num('ma') ?? existing?.financials.ma ?? 0,
      uaa: num('uaa') ?? existing?.financials.uaa ?? 0,
      spl_allow_2021: num('spl_allow_2021') ?? existing?.financials.spl_allow_2021 ?? 0,
      teaching_allow: num('teaching_allow') ?? existing?.financials.teaching_allow ?? 0,
      spl_allow_female: num('spl_allow_female') ?? existing?.financials.spl_allow_female ?? 0,
      spl_allow_disable: num('spl_allow_disable') ?? existing?.financials.spl_allow_disable ?? 0,
      integrated_allow: num('integrated_allow') ?? existing?.financials.integrated_allow ?? 0,
      charge_allow: num('charge_allow') ?? existing?.financials.charge_allow ?? 0,
      wa: num('wa') ?? existing?.financials.wa ?? 0,
      dress_allow: num('dress_allow') ?? existing?.financials.dress_allow ?? 0,
      computer_allow: num('computer_allow') ?? existing?.financials.computer_allow ?? 0,
      mphil_allow: num('mphil_allow') ?? existing?.financials.mphil_allow ?? 0,
      entertainment_allow: num('entertainment_allow') ?? existing?.financials.entertainment_allow ?? 0,
      science_teaching_allow: num('science_teaching_allow') ?? existing?.financials.science_teaching_allow ?? 0,
      weather_allow: num('weather_allow') ?? existing?.financials.weather_allow ?? 0,
      special_allow_non_teaching: num('special_allow_non_teaching') ?? existing?.financials.special_allow_non_teaching ?? 0,
      
      adhoc_2013: num('adhoc_2013') ?? existing?.financials.adhoc_2013 ?? 0,
      adhoc_2015: num('adhoc_2015') ?? existing?.financials.adhoc_2015 ?? 0,
      adhoc_2022_ps17: num('adhoc_2022_ps17') ?? existing?.financials.adhoc_2022_ps17 ?? 0,
      dra_2022kp: num('dra_2022kp') ?? existing?.financials.dra_2022kp ?? 0,
      adhoc_2023_35: num('adhoc_2023_35') ?? existing?.financials.adhoc_2023_35 ?? 0,
      adhoc_2024_25: num('adhoc_2024_25') ?? existing?.financials.adhoc_2024_25 ?? 0,
      adhoc_2025_10: num('adhoc_2025_10') ?? existing?.financials.adhoc_2025_10 ?? 0,
      dra_2025_15: num('dra_2025_15') ?? existing?.financials.dra_2025_15 ?? 0,

      gpf: (() => {
        const a = num('gpf');
        const b = num('gpf_sub');
        const base = existing?.financials.gpf ?? 0;
        if (a !== undefined) return a;
        if (b !== undefined) return b;
        return base;
      })(),
      gpf_sub: num('gpf_sub') ?? existing?.financials.gpf_sub ?? undefined,
      gpf_advance: num('gpf_advance') ?? existing?.financials.gpf_advance ?? 0,
      bf: num('bf') ?? existing?.financials.bf ?? 0,
      eef: num('eef') ?? existing?.financials.eef ?? 0,
      rb_death: num('rb_death') ?? existing?.financials.rb_death ?? 0,
      adl_g_insurance: num('adl_g_insurance') ?? existing?.financials.adl_g_insurance ?? 0,
      group_insurance: num('group_insurance') ?? existing?.financials.group_insurance ?? 0,
      income_tax: num('income_tax') ?? num('income_tax_ded') ?? existing?.financials.income_tax ?? 0,
      recovery: num('recovery') ?? existing?.financials.recovery ?? 0,
      
      edu_rop: num('edu_rop') ?? existing?.financials.edu_rop ?? 0,
      hba_loan_instal: num('hba_loan_instal') ?? existing?.financials.hba_loan_instal ?? 0,
      gpf_loan_instal: num('gpf_loan_instal') ?? existing?.financials.gpf_loan_instal ?? 0,
    },

    family_members: existing?.family_members || [],
  };

  try {
    const json = str('deductions_extra_json');
    if (json) {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        newRecord.financials.deductions_extra = parsed;
      }
    }
  } catch {}

  if (!newRecord.extras) newRecord.extras = {};
  const comm = num('commutation_portion');
  if (comm !== undefined) newRecord.extras.commutation_portion = comm;
  const rds = str('retirement_date_source');
  if (rds) (newRecord.extras as any).retirement_date_source = rds;
  
  const ben = {
    name: str('beneficiary_name'),
    relation: str('beneficiary_relation'),
    age: str('beneficiary_age'),
    cnic: str('beneficiary_cnic'),
    bank_name: str('beneficiary_bank_name'),
    branch_name: str('beneficiary_branch_name'),
    account_no: str('beneficiary_account_no')
  };
  if (Object.values(ben).some(v => v)) {
    (newRecord.extras as any).beneficiary = ben;
  }

  if (str('family_1_name')) {
    const family: OfficialFamilyMember[] = [];
    for (let i = 1; i <= 6; i++) {
      const name = str(`family_${i}_name`);
      if (name) {
        family.push({
          id: `fam_${i}_${Date.now()}_${Math.floor(Math.random() * 100)}`,
          relative_name: name,
          relation: str(`family_${i}_relation`),
          age: num(`family_${i}_age`) || '',
          cnic: str(`family_${i}_cnic`)
        });
      }
    }
    newRecord.family_members = family;
  }

  return newRecord;
};