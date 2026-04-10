import React, { useMemo, useState, useEffect } from 'react';
import { EmployeeRecord } from '../../types';
import { loadBm2Edits, saveBm2Edits, appendBm2Audit } from './storage';

type BudgetEstimatesFormProps = {
  officeName: string;
  ddoCode: string;
  fiscalYearLabel: string;
  employees: EmployeeRecord[];
  currentMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>;
  previousMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>;
};

type DesignationGroup = {
  designation: string;
  bps: number | string;
  count: number;
  isOfficer: boolean;
};

const OBJECT_CODE_DESCRIPTIONS: Record<string, string> = {
  A01: 'TOTAL ER EXPENCES',
  A011: 'TOTAL PAY',
  A01101: 'TOTAL PAY OF OFFICER',
  A01102: 'PERSONAL PAY OF OFFICERS',
  A01151: 'TOTAL PAY OF OTHER STAFF',
  A01152: 'PERSONAL PAY OF OTHER STAFF',
  A012: 'TOTAL ALLOWANCES',
  'A012-1': 'TOTAL REGULAR ALLOWANCES',
  A01202: 'HOUSE RENT ALLOWANCE',
  A01203: 'CONVEYANCE ALLOWANCE',
  A01207: 'WASHING ALLOWANCE',
  A01208: 'DRESS ALLOWANCE',
  A0120D: 'INTEGRATED ALLOWANCE',
  A01217: 'MEDICAL ALLOWANCE',
  A0121T: 'ADHOC RELIEF ALLOWANCE 2013',
  A0122C: 'ADHOC RELIEF ALLOWANCE 2015',
  A0122N: 'SPECIAL CONVEYANCE ALLOWANCE TO DISBAL',
  A01233: 'UNATTRACTIVE AREA ALLOWANCE',
  A01239: 'SPECIAL ALLOWANCE',
  A0124H: 'SPECIAL ALLOWANCE 2021',
  A01270: 'M.Phil Allowance',
  A0124L: 'WEATHER ALLOWANCE',
  A0124N: 'DISPARITY REDUCTION ALLOWANCE 2022- 15',
  A0124R: 'ADHOC RELIEF ALLOWANCE 2022',
  A0124X: 'ADHOC RELIEF ALLOWANCE 2023 30%',
  A0125E: 'ADHOC RELIEF ALLOWANCE 2024 25%',
  A0125P: 'ADHOC RELIEF ALLOWANCE 2025 10%',
  A0125Q: 'DISPARITY REDUCTION ALLOWANCE 2025',
  A01253: 'SCIENCE TEACHING ALLOWANCE',
  A01238: 'CHARGE ALLOWANCE',
  A01226: 'Computer Allowance',
  A01289: 'TEACHING ALLOWANCE',
  'A012-2': 'TOTAL OTHER ALLOW;',
  A01274: 'MEDICAL CHARGES',
  A01278: 'LEAVE SALARY',
  A03201: 'Postage & Telegraph',
  A03202: 'Telephone and Trunk Call',
  A03303: 'Electricity',
  A03305: 'POL for Generator',
  A03807: 'POL for Vehicles',
  A03402: 'Rent for office building',
  A03805: 'Travelling Allowance',
  A03901: 'Stationery',
  A03902: 'Printing & Publication',
  A03905: 'Newspapers Periodicals & Books',
  A03970: '001- Others',
  A04114: 'Superannation Encashment LPR',
  A05216: 'Financial Assis; to the family',
  A09203: 'IT-Equipments',
  A09601: 'Purchase of Plant & Machinery',
  A09701: 'Purchase of Furniture & Fixture',
  A09404: 'Medical & Laboratory Equipments',
  A09201: 'Computer Equipment',
  A13101: 'Machinery & equipment',
  A13201: 'Furniture & Fixture',
  A09501: 'Purchase of Transport',
  A13801: 'Maintenance of Gardens',
};

type Bm2Row = {
  code: string;
  desc: string;
  bps: string | number | '';
  post1: number | string | '';
  post2: number | string | '';
  acct: number;
  est25: number;
  rev25: number;
  est26: number;
  actualCurr5?: number;
  anticipated?: number;
  isRed?: boolean;
  isBold?: boolean;
};

const ALLOWANCE_CODES: string[] = [
  'A01202', 'A01203', 'A01207', 'A01208', 'A0120D', 'A01217', 'A0121T', 'A0122C',
  'A0122N', 'A01233', 'A01239', 'A0124H', 'A0124L', 'A0124N', 'A0124R', 'A0124X',
  'A0125E', 'A0125P', 'A0125Q', 'A01253', 'A01238', 'A01289',
];

const NON_SALARY_CODES: string[] = [
  'A03201', 'A03805', 'A03901', 'A03970', 'A09203', 'A03303', 'A13201', 'A009', 'A04114',
];

const sumMonths = (months: Record<string, number>, keys: string[]) => {
  return keys.reduce((sum, key) => sum + (months[key] || 0), 0);
};

export const normalizeDesignation = (raw: string, bps: number | string): string => {
  const s = (raw || '').trim().toUpperCase();
  const b = Number(bps) || 0;

  if (b === 14) {
    if (s === 'PSHT' || s.startsWith('PRIMARY SCHOOL HEAD TEACHER') || s.startsWith('PRIMARY SCHOOL HEAD TEACH') ||
        s.startsWith('PRIMARY SCHOOL TEACHER') || s.startsWith('SENIOR PRIMARY SCHOOL TEACHER') || s.startsWith('SENIOR PRIMARY SCHOOL TEA')) {
      return 'SENIOR PRIMARY SCHOOL TEACHER';
    }
  }
  if (s === 'PSHT' || s.startsWith('PRIMARY SCHOOL HEAD TEACHER') || s.startsWith('PRIMARY SCHOOL HEAD TEACH')) {
    return 'PRIMARY SCHOOL HEAD TEACHER';
  }
  if (s === 'SPST' || s.startsWith('SENIOR PRIMARY SCHOOL TEACHER') || s.startsWith('SENIOR PRIMARY SCHOOL TEA')) {
    return 'SENIOR PRIMARY SCHOOL TEACHER';
  }
  if (s === 'PST' || s === 'PST PRIMARY SCHOOL TEACHER' || s.startsWith('PRIMARY SCHOOL TEACHER') || s.startsWith('PRIMARY SCHOOL TEACH')) {
    return 'PRIMARY SCHOOL TEACHER';
  }
  if (s.startsWith('CHOWKIDAR')) {
    return 'CHOWKIDAR';
  }
  return s;
};

export const normalizeBpsForBudget = (designation: string, bps: number): number => {
  const s = (designation || '').trim().toUpperCase();
  if (s === 'PRIMARY SCHOOL TEACHER') return 12;
  if (s === 'CHOWKIDAR') return 3;
  return bps;
};

const DESIGNATION_SHORT: Record<string, string> = {
  'PRIMARY SCHOOL HEAD TEACHER': 'PSHT',
  'PRIMARY SCHOOL HEADTEACHER': 'PSHT',
  'PRIMARY SCHOOL HEAD TEACH': 'PSHT',
  'SENIOR PRIMARY SCHOOL TEACHER': 'SPST',
  'SR PRIMARY SCHOOL TEACHER': 'SPST',
  'SENIOR PST': 'SPST',
  'PRIMARY SCHOOL TEACHER': 'PST',
  'SECONDARY SCHOOL TEACHER': 'SST',
  'SENIOR CERTIFIED TEACHER': 'SCT',
  'CERTIFIED TEACHER': 'CT',
  'CERTIFICATED TEACHER': 'CT',
  'CERTIFIED TEACHER IT': 'CT-IT',
  'PHYSICAL EDUCATION TEACHER': 'PET',
  'PHYSICAL EDUCATION TEACHE': 'PET',
  'SENIOR PHYSICAL EDUCATION TEACHER': 'SPET',
  'SENIOR PHYSICAL EDUCATION': 'SPET',
  'SENIOR DRAWING MASTER': 'SDM',
  'DRAWING MASTER': 'DM',
  'SENIOR QARI': 'S-QARI',
  'QARI': 'QARI',
  'ARABIC TEACHER': 'AT',
  'SENIOR THEOLOGY TEACHER': 'STT',
  'THEOLOGY TEACHER': 'TT',
  'HEAD MASTER': 'HM',
  'HEAD MISTRESS': 'HM',
  'HEADMASTER': 'HM',
  'HEADMISTRESS': 'HM',
  'PRINCIPAL': 'PRINCIPAL',
  'VICE PRINCIPAL': 'VP',
  LECTURER: 'LECTURER',
  'SUBJECT SPECIALIST': 'SS',
  'SUPERINTENDENT': 'SUPRNT',
  'ASSISTANT SUB DIVISIONAL EDUCATION': 'ASDEO',
  'ASSISTANT SUB DIVISIONAL': 'ASDEO',
  'SUB DIVISIONAL EDUCATION': 'SDEO',
  'SUB DIVISIONAL EDUCATION OFFICER': 'SDEO',
  'DISTRICT EDUCATION': 'DEO',
  ASSISTANT: 'ASSISTANT',
  'COMPUTER OPERATOR': 'CO',
  'JUNIOR CLERK': 'JC',
  'SENIOR CLERK': 'SC',
  STENOGRAPHER: 'STENO',
  DRIVER: 'DRIVER',
  'NAIB QASID': 'NQ',
  CHOWKIDAR: 'CHOW',
  SWEEPER: 'SWEEPER',
  'WATER CARRIER': 'WC',
  PEON: 'PEON',
  MALI: 'MALI',
  'LAB ATTENDANT': 'LA',
  'LABORATORY ATTENDANT': 'LA',
  'LAB ASSISTANT': 'LA',
  'LIBRARY ASSISTANT': 'LIB ASST',
  LIBRARIAN: 'LIBRARIAN',
};

export const toShortDesignation = (normalized: string): string => {
  const key = (normalized || '').trim().toUpperCase();
  return DESIGNATION_SHORT[key] || normalized;
};

const buildDesignationGroups = (employees: EmployeeRecord[], ddoCode: string): DesignationGroup[] => {
  const filtered = employees.filter(
    e => (e.employees.ddo_code || '').trim().toUpperCase() === ddoCode.trim().toUpperCase()
  );
  const designationMap = new Map<string, DesignationGroup>();
  filtered.forEach(e => {
    const rawDesignation = e.employees.designation_full || e.employees.designation || '';
    const bpsRaw = Number(e.employees.bps) || 0;
    const normalizedDesignation = normalizeDesignation(rawDesignation, bpsRaw);
    const bpsValue = normalizeBpsForBudget(normalizedDesignation, bpsRaw);
    const key = `${normalizedDesignation}|${bpsValue}`;
    const existing = designationMap.get(key);
    const isOfficer = bpsValue >= 16;
    if (existing) {
      existing.count += 1;
    } else {
      designationMap.set(key, { designation: normalizedDesignation, bps: bpsValue || '', count: 1, isOfficer });
    }
  });
  return Array.from(designationMap.values()).sort((a, b) => {
    const bpsA = Number(a.bps) || 0;
    const bpsB = Number(b.bps) || 0;
    if (bpsA !== bpsB) return bpsB - bpsA;
    return a.designation.localeCompare(b.designation);
  });
};

const buildMonthlySumByCode = (employees: EmployeeRecord[], ddoCode: string): Record<string, number> => {
  const result: Record<string, number> = {};
  const filtered = employees.filter(
    e => (e.employees.ddo_code || '').trim().toUpperCase() === ddoCode.trim().toUpperCase() &&
         (e.employees.status || '').toLowerCase() === 'active'
  );
  filtered.forEach(e => {
    const f: any = e.financials || {};
    const bps = Number(e.employees.bps) || 0;
    const isGazetted = bps >= 16;
    
    const basicMonthly = Number(f.last_pay_with_increment) || Number(f.last_basic_pay) || 0;
    const personalMonthly = Number(f.p_pay) || 0;
    
    if (isGazetted) {
      result['A01101'] = (result['A01101'] || 0) + basicMonthly;
      result['A01102'] = (result['A01102'] || 0) + personalMonthly;
    } else {
      result['A01151'] = (result['A01151'] || 0) + basicMonthly;
      result['A01152'] = (result['A01152'] || 0) + personalMonthly;
    }
    
    const allowMonthly: Record<string, number> = {
      A01202: Number(f.hra) || 0,
      A01203: Number(f.ca) || 0,
      A01217: Number(f.ma) || 0,
      A0120D: Number(f.integrated_allow) || 0,
      A01207: Number(f.wa) || 0,
      A01208: Number(f.dress_allow) || 0,
      A0124H: Number(f.spl_allow) || 0,
      A01233: Number(f.uaa) || 0,
      A0121T: Number(f.adhoc_2013) || 0,
      A0122C: Math.max(Number(f.adhoc_2015) || 0, Number(f.adhoc_10pct) || 0),
      A0124R: Math.max(Number(f.adhoc_2022) || 0, Number(f.adhoc_2022_ps17) || 0),
      A0124X: Number(f.adhoc_2023_35) || 0,
      A0125E: Number(f.adhoc_2024_25) || 0,
      A0125P: Number(f.adhoc_2025_10) || 0,
      A0124N: Number(f.dra_2022kp) || 0,
      A0125Q: Number(f.dra_2025_15) || 0,
      A01253: Number(f.science_teaching_allow) || 0,
      A01289: Number(f.teaching_allow) || 0,
      A01239: Number(f.spl_allow_female) || 0,
      A01238: Number(f.charge_allow) || 0,
      A0122N: Number(f.spl_allow_disable) || 0,
      A01226: Number(f.computer_allow) || 0,
      A01270: Number(f.mphil_allow) || 0,
      A0124: Number(f.entertainment_allow) || 0,
    };
    
    Object.entries(allowMonthly).forEach(([code, val]) => {
      if (!val) return;
      result[code] = (result[code] || 0) + val;
    });
  });
  return result;
};

const buildPayrollGroupMap = (employees: EmployeeRecord[], ddoCode: string): Record<string, number> => {
  const result: Record<string, number> = {};
  const filtered = employees.filter(
    e => (e.employees.ddo_code || '').trim().toUpperCase() === ddoCode.trim().toUpperCase() &&
         (e.employees.status || '').toLowerCase() === 'active'
  );
  filtered.forEach(e => {
    const bpsRaw = Number(e.employees.bps) || 0;
    const rawDesignation = e.employees.designation_full || e.employees.designation || '';
    const designation = normalizeDesignation(rawDesignation, bpsRaw);
    const bps = normalizeBpsForBudget(designation, bpsRaw);
    const key = `${designation}|${bps}`;
    const basic = e.financials?.last_basic_pay || 0;
    if (!basic) return;
    result[key] = (result[key] || 0) + basic * 7;
  });
  return result;
};

const calcBm2Amounts = (
  code: string,
  currentMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>,
  previousMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>,
  monthlySumByCode?: Record<string, number>,
  projections?: Record<string, number>,
  weatherAnnualTotal?: number
) => {
  const current = currentMap[code];
  const previous = previousMap[code];
  const original = current?.budget || 0;
  const acctTotal = sumMonths(previous?.months || {}, ['JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR','APR','MAY','JUN']);
  const actualCurr5 = sumMonths(current?.months || {}, ['JUL', 'AUG', 'SEP', 'OCT', 'NOV']);
  const isSalaryCode = code.startsWith('A011') || code.startsWith('A012');
  
  let anticipated: number;
  if (code === 'A0124L' && weatherAnnualTotal !== undefined) {
    anticipated = weatherAnnualTotal;
  } else if (isSalaryCode && monthlySumByCode) {
    const monthly = monthlySumByCode[code] || 0;
    anticipated = Math.round(monthly * 7);
  } else if (!isSalaryCode) {
    anticipated = Math.max(0, original - actualCurr5);
  } else {
    anticipated = current?.modified || 0;
  }
  
  const rev25 = actualCurr5 + anticipated;
  
  const est26FromBm6 = projections && Object.prototype.hasOwnProperty.call(projections, code) ? projections[code] : undefined;
  const est26 = est26FromBm6 !== undefined ? est26FromBm6 : current?.anticipated || 0;
  
  return { acct: acctTotal, est25: original, rev25, est26, actualCurr5, anticipated };
};

export const BudgetEstimatesForm: React.FC<BudgetEstimatesFormProps> = ({
  officeName, ddoCode, fiscalYearLabel, employees, currentMap, previousMap,
}) => {
  const parsedYearMatch = (fiscalYearLabel || '').match(/20\d{2}/);
  const fiscalStartYear = parsedYearMatch ? Number(parsedYearMatch[0]) : new Date().getFullYear();
  const postsYear1Label = `${fiscalStartYear}-${String(fiscalStartYear + 1).slice(-2)}`;
  const postsYear2Label = `${fiscalStartYear + 1}-${String(fiscalStartYear + 2).slice(-2)}`;
  const accountYearLabel = `${fiscalStartYear - 1}-${String(fiscalStartYear).slice(-2)}`;

  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, { rev25?: number; est26?: number }>>({});
  const [inputValues, setInputValues] = useState<Record<string, { rev25?: string; est26?: string }>>({});

  useEffect(() => {
    const data = loadBm2Edits(ddoCode || '');
    setEdits(data || {});
  }, [ddoCode]);

  useEffect(() => {
    if (!isEditing) {
      setInputValues({});
    }
  }, [isEditing]);

  const getActualCurr5 = (code: string): number => {
    const current = currentMap[code];
    return sumMonths(current?.months || {}, ['JUL', 'AUG', 'SEP', 'OCT', 'NOV']);
  };

  const parseNumberInput = (value: string) => {
    const cleaned = String(value || '').replace(/,/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleInputChange = (code: string, field: 'rev25' | 'est26', rawValue: string) => {
    setInputValues(prev => ({
      ...prev,
      [code]: { ...prev[code], [field]: rawValue }
    }));
  };

  const handleInputBlur = (code: string, field: 'rev25' | 'est26', baseValue: number) => {
    const inputVal = inputValues[code]?.[field];
    if (inputVal === undefined) return;
    
    let displayValue = parseNumberInput(inputVal);
    if (!Number.isFinite(displayValue)) displayValue = 0;
    
    // For rev25 edits, ALWAYS convert display value (totalExpend) to anticipated
    // This ensures BM-20 gets the correct anticipated amount for both salary and non-salary
    let valueToStore = displayValue;
    if (field === 'rev25') {
      const actualCurr5 = getActualCurr5(code);
      // Store anticipated = totalExpend - actualCurr5
      // Allow negative for salary codes (in case user wants to reduce)
      valueToStore = displayValue - actualCurr5;
    }
    
    setEdits(prev => {
      const prevForCode = prev[code] || {};
      const prevRaw = prevForCode[field];
      const prevValue = typeof prevRaw === 'number' ? Number(prevRaw) : baseValue;
      
      if (prevValue === valueToStore) {
        setInputValues(p => {
          const next = { ...p };
          if (next[code]) {
            delete next[code][field];
            if (Object.keys(next[code]).length === 0) delete next[code];
          }
          return next;
        });
        return prev;
      }
      
      appendBm2Audit(ddoCode || '', { ts: new Date().toISOString(), code, field, oldValue: prevValue, newValue: valueToStore });
      const nextEdits = { ...prev, [code]: { ...prevForCode, [field]: valueToStore } };
      saveBm2Edits(ddoCode || '', nextEdits || {});
      
      setInputValues(p => {
        const next = { ...p };
        if (next[code]) {
          delete next[code][field];
          if (Object.keys(next[code]).length === 0) delete next[code];
        }
        return next;
      });
      
      return nextEdits;
    });
  };

  const getEditDisplayValue = (code: string, field: 'rev25' | 'est26', fallback: number): number => {
    const e = edits[code];
    const storedValue = e && typeof e[field] === 'number' ? Number(e[field]) : undefined;
    if (storedValue === undefined) return fallback;
    
    // For rev25, stored value is ALWAYS anticipated, add actualCurr5 to get display value (totalExpend)
    if (field === 'rev25') {
      const actualCurr5 = getActualCurr5(code);
      return actualCurr5 + storedValue;
    }
    
    return storedValue;
  };

  const getInputValue = (code: string, field: 'rev25' | 'est26', fallback: number): string => {
    const tempVal = inputValues[code]?.[field];
    if (tempVal !== undefined) return tempVal;
    
    const displayValue = getEditDisplayValue(code, field, fallback);
    return displayValue ? String(displayValue) : '';
  };

  const hasEdit = (code: string, field: 'rev25' | 'est26'): boolean => {
    const e = edits[code];
    return e && typeof e[field] === 'number';
  };

  const isRowEditable = (row: Bm2Row) => {
    const descUpper = (row.desc || '').toUpperCase();
    const hasFormula = descUpper.includes('TOTAL') || descUpper.includes('GRAND') || descUpper.includes('NON SALARY') ||
                       descUpper.includes('REGULAR ALLOWANCES') || descUpper.includes('OTHER ALLOW');
    return Boolean(row.code) && !hasFormula;
  };

  const groups = useMemo(() => buildDesignationGroups(employees, ddoCode), [employees, ddoCode]);
  const monthlySumByCode = useMemo(() => buildMonthlySumByCode(employees, ddoCode), [employees, ddoCode]);
  const payrollGroups = useMemo(() => buildPayrollGroupMap(employees, ddoCode), [employees, ddoCode]);

  const personalPayCounts = useMemo(() => {
    const targetDdo = (ddoCode || '').trim().toUpperCase();
    const filtered = (employees || []).filter(e => {
      const empDdo = (e.employees.ddo_code || '').trim().toUpperCase();
      const status = (e.employees.status || '').toLowerCase();
      return (!targetDdo || empDdo === targetDdo) && status === 'active';
    });
    let officers = 0, staff = 0;
    filtered.forEach(e => {
      const bps = Number(e.employees.bps) || 0;
      const p = Number(e.financials?.p_pay) || 0;
      if (p > 0) { if (bps >= 16) officers += 1; else staff += 1; }
    });
    return { officers, staff };
  }, [employees, ddoCode]);

  const weatherAnnualTotal = useMemo(() => {
    const targetDdo = (ddoCode || '').trim().toUpperCase();
    const filtered = (employees || []).filter(e => {
      const empDdo = (e.employees.ddo_code || '').trim().toUpperCase();
      const status = (e.employees.status || '').toLowerCase();
      return (!targetDdo || empDdo === targetDdo) && status === 'active';
    });
    let total = 0;
    filtered.forEach(e => {
      const bps = Number(e.employees.bps) || 0;
      if (bps > 0 && bps < 7) {
        total += 9200;
      }
    });
    return total;
  }, [employees, ddoCode]);

  const bm6Projections = useMemo(() => {
    try {
      const key = `budgeting/bm6/projections/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const raw = localStorage.getItem(key);
      if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') return parsed as Record<string, number>; }
    } catch {}
    return {} as Record<string, number>;
  }, [ddoCode]);

  const bm6GroupBasicByKey = useMemo(() => {
    try {
      const key = `budgeting/bm6/groupBasic/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const raw = localStorage.getItem(key);
      if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') return parsed as Record<string, number>; }
    } catch {}
    return {} as Record<string, number>;
  }, [ddoCode]);

  const sanctionedByKey = useMemo(() => {
    try {
      const key = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const aggregated: Record<string, number> = {};
          Object.entries(parsed as Record<string, number>).forEach(([rawKey, rawVal]) => {
            const parts = String(rawKey).split('|');
            const rawDesignation = parts[0] || '';
            const bpsRaw = Number(parts[1]) || 0;
            const normalizedDesignation = normalizeDesignation(rawDesignation, bpsRaw);
            const bps = normalizeBpsForBudget(normalizedDesignation, bpsRaw);
            const normalizedKey = `${normalizedDesignation}|${bps}`;
            const cnt = typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0;
            aggregated[normalizedKey] = (aggregated[normalizedKey] || 0) + cnt;
          });
          return aggregated;
        }
      }
    } catch {}
    return {} as Record<string, number>;
  }, [ddoCode]);

  const allCodes = useMemo(() => {
    const set = new Set<string>();
    Object.keys(currentMap || {}).forEach(c => set.add(c));
    Object.keys(previousMap || {}).forEach(c => set.add(c));
    return Array.from(set).sort();
  }, [currentMap, previousMap]);

  const allowanceCodes = useMemo(() => {
    const dynamic = allCodes.filter(code => code.startsWith('A012'));
    const combined = new Set<string>([...ALLOWANCE_CODES, ...dynamic]);
    combined.delete('A01274');
    combined.delete('A01278');
    return Array.from(combined).sort();
  }, [allCodes]);

  const nonSalaryCodes = useMemo(() => {
    const dynamic = allCodes.filter(code => !code.startsWith('A011') && !code.startsWith('A012'));
    return Array.from(new Set<string>([...NON_SALARY_CODES, ...dynamic])).sort();
  }, [allCodes]);

  const officerGroups = groups.filter(g => g.isOfficer);
  const otherStaffGroups = groups.filter(g => !g.isOfficer);

  const officerTotals = useMemo(() => {
    const sanctionedTotal = Object.entries(sanctionedByKey).reduce((sum, [key, cnt]) => {
      const bps = Number(key.split('|')[1]) || 0;
      return bps >= 16 ? sum + (typeof cnt === 'number' ? cnt : Number(cnt) || 0) : sum;
    }, 0);
    return sanctionedTotal || officerGroups.reduce((sum, g) => sum + g.count, 0);
  }, [sanctionedByKey, officerGroups]);

  const otherStaffTotals = useMemo(() => {
    const sanctionedTotal = Object.entries(sanctionedByKey).reduce((sum, [key, cnt]) => {
      const bps = Number(key.split('|')[1]) || 0;
      return bps > 0 && bps < 16 ? sum + (typeof cnt === 'number' ? cnt : Number(cnt) || 0) : sum;
    }, 0);
    return sanctionedTotal || otherStaffGroups.reduce((sum, g) => sum + g.count, 0);
  }, [sanctionedByKey, otherStaffGroups]);

  const a01101Amounts = calcBm2Amounts('A01101', currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
  const a01151Amounts = calcBm2Amounts('A01151', currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
  const a01102Amounts = calcBm2Amounts('A01102', currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
  const a01152Amounts = calcBm2Amounts('A01152', currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);

  const a01101RevUsed = getEditDisplayValue('A01101', 'rev25', a01101Amounts.rev25);
  const a01101EstUsed = getEditDisplayValue('A01101', 'est26', a01101Amounts.est26);
  const a01102RevUsed = getEditDisplayValue('A01102', 'rev25', a01102Amounts.rev25);
  const a01102EstUsed = getEditDisplayValue('A01102', 'est26', a01102Amounts.est26);
  const a01151RevUsed = getEditDisplayValue('A01151', 'rev25', a01151Amounts.rev25);
  const a01151EstUsed = getEditDisplayValue('A01151', 'est26', a01151Amounts.est26);
  const a01152RevUsed = getEditDisplayValue('A01152', 'rev25', a01152Amounts.rev25);
  const a01152EstUsed = getEditDisplayValue('A01152', 'est26', a01152Amounts.est26);

  const rows: Bm2Row[] = [];

  const hasOfficerPosts = officerGroups.length > 0 || Object.keys(sanctionedByKey).some(k => Number(k.split('|')[1]) >= 16);

  const hasOtherStaffPosts = otherStaffGroups.length > 0 || Object.keys(sanctionedByKey).some(k => {
    const bps = Number(k.split('|')[1]) || 0;
    return bps > 0 && bps < 16;
  });

  if (hasOfficerPosts) {
    rows.push({ 
      code: 'A01101', 
      desc: OBJECT_CODE_DESCRIPTIONS['A01101'], 
      bps: '', 
      post1: officerTotals || '', 
      post2: officerTotals || '', 
      acct: a01101Amounts.acct, 
      est25: a01101Amounts.est25, 
      rev25: a01101RevUsed, 
      est26: a01101EstUsed,
      actualCurr5: a01101Amounts.actualCurr5,
      anticipated: a01101Amounts.anticipated,
      isRed: true, 
      isBold: true 
    });

    if (a01102Amounts.acct || a01102Amounts.est25 || a01102Amounts.rev25 || a01102Amounts.est26 || personalPayCounts.officers > 0) {
      rows.push({ 
        code: 'A01102', 
        desc: OBJECT_CODE_DESCRIPTIONS['A01102'], 
        bps: '', 
        post1: personalPayCounts.officers || '', 
        post2: personalPayCounts.officers || '', 
        acct: a01102Amounts.acct, 
        est25: a01102Amounts.est25, 
        rev25: a01102RevUsed, 
        est26: a01102EstUsed,
        actualCurr5: a01102Amounts.actualCurr5,
        anticipated: a01102Amounts.anticipated,
        isBold: true 
      });
    }

    const officerPostsMap = new Map<string, { designation: string; bps: number | string; count: number; rev25: number; est26: number }>();

    Object.entries(sanctionedByKey).forEach(([key, cnt]) => {
      const [designation, bpsStr] = key.split('|');
      const bps = Number(bpsStr) || 0;
      if (bps >= 16) {
        officerPostsMap.set(key, {
          designation,
          bps,
          count: typeof cnt === 'number' ? cnt : Number(cnt) || 0,
          rev25: payrollGroups[key] || 0,
          est26: bm6GroupBasicByKey[key] || 0
        });
      }
    });

    officerGroups.forEach(g => {
      const key = `${g.designation}|${g.bps}`;
      const existing = officerPostsMap.get(key);
      if (existing) {
        existing.rev25 = payrollGroups[key] || existing.rev25;
        existing.est26 = bm6GroupBasicByKey[key] || existing.est26;
      } else {
        officerPostsMap.set(key, {
          designation: g.designation,
          bps: g.bps,
          count: g.count,
          rev25: payrollGroups[key] || 0,
          est26: bm6GroupBasicByKey[key] || 0
        });
      }
    });

    Array.from(officerPostsMap.entries())
      .sort((a, b) => {
        const bpsA = Number(a[1].bps) || 0;
        const bpsB = Number(b[1].bps) || 0;
        if (bpsA !== bpsB) return bpsB - bpsA;
        return a[1].designation.localeCompare(b[1].designation);
      })
      .forEach(([, data]) => {
        rows.push({ 
          code: '', 
          desc: data.designation, 
          bps: data.bps, 
          post1: data.count, 
          post2: data.count, 
          acct: 0, 
          est25: 0, 
          rev25: data.rev25, 
          est26: data.est26 
        });
      });
  }

  if (hasOtherStaffPosts) {
    rows.push({ 
      code: 'A01151', 
      desc: OBJECT_CODE_DESCRIPTIONS['A01151'], 
      bps: '', 
      post1: otherStaffTotals || '', 
      post2: otherStaffTotals || '', 
      acct: a01151Amounts.acct, 
      est25: a01151Amounts.est25, 
      rev25: a01151RevUsed, 
      est26: a01151EstUsed,
      actualCurr5: a01151Amounts.actualCurr5,
      anticipated: a01151Amounts.anticipated,
      isRed: true, 
      isBold: true 
    });

    if (a01152Amounts.acct || a01152Amounts.est25 || a01152Amounts.rev25 || a01152Amounts.est26 || personalPayCounts.staff > 0) {
      rows.push({ 
        code: 'A01152', 
        desc: OBJECT_CODE_DESCRIPTIONS['A01152'], 
        bps: '', 
        post1: personalPayCounts.staff || '', 
        post2: personalPayCounts.staff || '', 
        acct: a01152Amounts.acct, 
        est25: a01152Amounts.est25, 
        rev25: a01152RevUsed, 
        est26: a01152EstUsed,
        actualCurr5: a01152Amounts.actualCurr5,
        anticipated: a01152Amounts.anticipated,
        isBold: true 
      });
    }

    const staffPostsMap = new Map<string, { designation: string; bps: number | string; count: number; rev25: number; est26: number }>();

    Object.entries(sanctionedByKey).forEach(([key, cnt]) => {
      const [designation, bpsStr] = key.split('|');
      const bps = Number(bpsStr) || 0;
      if (bps > 0 && bps < 16) {
        staffPostsMap.set(key, {
          designation,
          bps,
          count: typeof cnt === 'number' ? cnt : Number(cnt) || 0,
          rev25: payrollGroups[key] || 0,
          est26: bm6GroupBasicByKey[key] || 0
        });
      }
    });

    otherStaffGroups.forEach(g => {
      const key = `${g.designation}|${g.bps}`;
      const existing = staffPostsMap.get(key);
      if (existing) {
        existing.rev25 = payrollGroups[key] || existing.rev25;
        existing.est26 = bm6GroupBasicByKey[key] || existing.est26;
      } else {
        staffPostsMap.set(key, {
          designation: g.designation,
          bps: g.bps,
          count: g.count,
          rev25: payrollGroups[key] || 0,
          est26: bm6GroupBasicByKey[key] || 0
        });
      }
    });

    Array.from(staffPostsMap.entries())
      .sort((a, b) => {
        const bpsA = Number(a[1].bps) || 0;
        const bpsB = Number(b[1].bps) || 0;
        if (bpsA !== bpsB) return bpsB - bpsA;
        return a[1].designation.localeCompare(b[1].designation);
      })
      .forEach(([, data]) => {
        rows.push({ 
          code: '', 
          desc: data.designation, 
          bps: data.bps, 
          post1: data.count, 
          post2: data.count, 
          acct: 0, 
          est25: 0, 
          rev25: data.rev25, 
          est26: data.est26 
        });
      });
  }

  let allowanceAcct = 0, allowanceEst25 = 0, allowanceRev25 = 0, allowanceEst26 = 0;
  allowanceCodes.forEach(code => {
    const amounts = calcBm2Amounts(code, currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
    if (!amounts.acct && !amounts.est25 && !amounts.rev25 && !amounts.est26) return;
    const desc = OBJECT_CODE_DESCRIPTIONS[code] || currentMap[code]?.desc || previousMap[code]?.desc || code;
    const rev25Base = getEditDisplayValue(code, 'rev25', amounts.rev25);
    const est26Base = getEditDisplayValue(code, 'est26', amounts.est26);
    rows.push({ 
      code, 
      desc, 
      bps: '', 
      post1: '', 
      post2: '', 
      acct: amounts.acct, 
      est25: amounts.est25, 
      rev25: rev25Base, 
      est26: est26Base,
      actualCurr5: amounts.actualCurr5,
      anticipated: amounts.anticipated
    });
    allowanceAcct += amounts.acct; 
    allowanceEst25 += amounts.est25; 
    allowanceRev25 += rev25Base; 
    allowanceEst26 += est26Base;
  });

  let otherAllowAcct = 0, otherAllowEst25 = 0, otherAllowRev25 = 0, otherAllowEst26 = 0;
  if (allowanceAcct || allowanceEst25 || allowanceRev25 || allowanceEst26) {
    rows.push({ 
      code: '', 
      desc: 'TOTAL ALLOWANCES', 
      bps: '', 
      post1: '', 
      post2: '', 
      acct: allowanceAcct, 
      est25: allowanceEst25, 
      rev25: allowanceRev25, 
      est26: allowanceEst26, 
      isRed: true, 
      isBold: true 
    });

    ['A01274', 'A01278'].forEach(code => {
      const amounts = calcBm2Amounts(code, currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
      if (!amounts.acct && !amounts.est25 && !amounts.rev25 && !amounts.est26) return;
      const rev25Used = getEditDisplayValue(code, 'rev25', amounts.rev25);
      const est26Used = getEditDisplayValue(code, 'est26', amounts.est26);
      rows.push({ 
        code, 
        desc: OBJECT_CODE_DESCRIPTIONS[code] || code, 
        bps: '', 
        post1: '', 
        post2: '', 
        acct: amounts.acct, 
        est25: amounts.est25, 
        rev25: rev25Used, 
        est26: est26Used,
        actualCurr5: amounts.actualCurr5,
        anticipated: amounts.anticipated
      });
      otherAllowAcct += amounts.acct; 
      otherAllowEst25 += amounts.est25; 
      otherAllowRev25 += rev25Used; 
      otherAllowEst26 += est26Used;
    });

    if (otherAllowAcct || otherAllowEst25 || otherAllowRev25 || otherAllowEst26) {
      rows.push({ 
        code: 'A01253', 
        desc: 'TOTAL OTHER ALLOW;', 
        bps: '', 
        post1: '0', 
        post2: '0', 
        acct: otherAllowAcct, 
        est25: otherAllowEst25, 
        rev25: otherAllowRev25, 
        est26: otherAllowEst26, 
        isRed: true, 
        isBold: true 
      });
      rows.push({ 
        code: 'A012-1', 
        desc: 'TOTAL REGULAR ALLOWANCES', 
        bps: '', 
        post1: '', 
        post2: '', 
        acct: allowanceAcct + otherAllowAcct, 
        est25: allowanceEst25 + otherAllowEst25, 
        rev25: allowanceRev25 + otherAllowRev25, 
        est26: allowanceEst26 + otherAllowEst26, 
        isRed: true, 
        isBold: true 
      });
    }
  }

  let nonSalaryAcct = 0, nonSalaryEst25 = 0, nonSalaryRev25 = 0, nonSalaryEst26 = 0;
  const nonSalaryRows: Bm2Row[] = [];
  nonSalaryCodes.forEach(code => {
    const amounts = calcBm2Amounts(code, currentMap, previousMap, monthlySumByCode, bm6Projections, weatherAnnualTotal);
    if (!amounts.acct && !amounts.est25 && !amounts.rev25 && !amounts.est26) return;
    const desc = OBJECT_CODE_DESCRIPTIONS[code] || currentMap[code]?.desc || previousMap[code]?.desc || code;
    const rev25Used = getEditDisplayValue(code, 'rev25', amounts.rev25);
    const est26Used = getEditDisplayValue(code, 'est26', amounts.est26);
    nonSalaryRows.push({ 
      code, 
      desc, 
      bps: '', 
      post1: '', 
      post2: '', 
      acct: amounts.acct, 
      est25: amounts.est25, 
      rev25: rev25Used, 
      est26: est26Used,
      actualCurr5: amounts.actualCurr5,
      anticipated: amounts.anticipated
    });
    nonSalaryAcct += amounts.acct; 
    nonSalaryEst25 += amounts.est25; 
    nonSalaryRev25 += rev25Used; 
    nonSalaryEst26 += est26Used;
  });

  if (nonSalaryAcct || nonSalaryEst25 || nonSalaryRev25 || nonSalaryEst26) {
    rows.push({ 
      code: '', 
      desc: 'Non Salary', 
      bps: '', 
      post1: '0', 
      post2: '0', 
      acct: nonSalaryAcct, 
      est25: nonSalaryEst25, 
      rev25: nonSalaryRev25, 
      est26: nonSalaryEst26, 
      isRed: true, 
      isBold: true 
    });
    nonSalaryRows.forEach(r => rows.push(r));
    rows.push({ 
      code: '', 
      desc: 'Total Non Salary', 
      bps: '', 
      post1: '', 
      post2: '', 
      acct: nonSalaryAcct, 
      est25: nonSalaryEst25, 
      rev25: nonSalaryRev25, 
      est26: nonSalaryEst26, 
      isRed: true, 
      isBold: true 
    });

    const payAcct = a01101Amounts.acct + a01151Amounts.acct + a01102Amounts.acct + a01152Amounts.acct;
    const payEst25 = a01101Amounts.est25 + a01151Amounts.est25 + a01102Amounts.est25 + a01152Amounts.est25;
    const payRev25 = a01101RevUsed + a01151RevUsed + a01102RevUsed + a01152RevUsed;
    const payEst26 = a01101EstUsed + a01151EstUsed + a01102EstUsed + a01152EstUsed;
    const salaryAcct = payAcct + allowanceAcct + otherAllowAcct;
    const salaryEst25 = payEst25 + allowanceEst25 + otherAllowEst25;
    const salaryRev25 = payRev25 + allowanceRev25 + otherAllowRev25;
    const salaryEst26 = payEst26 + allowanceEst26 + otherAllowEst26;
    const grandAcct = salaryAcct + nonSalaryAcct;
    const grandEst25 = salaryEst25 + nonSalaryEst25;
    const grandRev25 = salaryRev25 + nonSalaryRev25;
    const grandEst26 = salaryEst26 + nonSalaryEst26;
    const totalPosts = officerTotals + otherStaffTotals;

    rows.unshift(
      { 
        code: 'A01', 
        desc: 'TOTAL EMPLOYEE RELATED EXPENCES', 
        bps: '', 
        post1: totalPosts || '', 
        post2: totalPosts || '', 
        acct: salaryAcct, 
        est25: salaryEst25, 
        rev25: salaryRev25, 
        est26: salaryEst26, 
        isRed: true, 
        isBold: true 
      },
      { 
        code: 'A011', 
        desc: 'TOTAL PAY', 
        bps: '', 
        post1: totalPosts || '', 
        post2: totalPosts || '', 
        acct: payAcct, 
        est25: payEst25, 
        rev25: payRev25, 
        est26: payEst26, 
        isRed: true, 
        isBold: true 
      }
    );

    rows.push({ 
      code: '', 
      desc: 'GRAND TOTAL SALARY AND NON SALARY', 
      bps: '', 
      post1: totalPosts || '', 
      post2: totalPosts || '', 
      acct: grandAcct, 
      est25: grandEst25, 
      rev25: grandRev25, 
      est26: grandEst26, 
      isRed: true, 
      isBold: true 
    });
  }

  const formatNum = (n: number) => n ? n.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '';

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 10mm;
          }
          
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: visible;
          }
          
          .no-print { 
            display: none !important; 
            visibility: hidden !important;
          }
          
          .bm2-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .bm2-root * {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
        
        .bm2-root {
          font-family: Arial, sans-serif;
          font-size: 9px;
          background: white;
          color: black;
          padding: 16px;
          border: none;
          box-shadow: none;
          border-radius: 0;
        }
        
        .bm2-header {
          text-align: center;
          margin-bottom: 10px;
        }
        
        .bm2-header h1,
        .bm2-header h2,
        .bm2-header h3 {
          margin: 0;
          padding: 0;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1.3;
          color: black;
        }
        
        .bm2-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          background: white;
          border: none;
          border-radius: 0;
        }
        
        .bm2-table th,
        .bm2-table td {
          border: 1px solid black;
          padding: 3px 4px;
          vertical-align: middle;
          background: white;
          border-radius: 0;
          box-shadow: none;
        }
        
        .bm2-table thead th {
          background-color: black !important;
          color: white !important;
          font-weight: 700;
          text-align: center;
          padding: 8px 4px;
        }
        
        .bm2-table tbody td {
          background: white;
        }
        
        .text-red { color: #D00000; }
        .font-bold { font-weight: 700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .uppercase { text-transform: uppercase; }
        
        .edit-input {
          width: 100%;
          text-align: right;
          border: 1px solid #999;
          padding: 2px 4px;
          font-size: 9px;
          font-family: Arial, sans-serif;
          background: white;
          border-radius: 0;
          box-shadow: none;
          outline: none;
        }
        
        .edit-input.modified {
          background: #fef08a;
        }
        
        @media print {
          .edit-input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
        
        .btn-edit {
          padding: 6px 16px;
          border: 1px solid #ccc;
          background: #f3f4f6;
          cursor: pointer;
          font-size: 12px;
          border-radius: 4px;
        }
        
        .btn-edit.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
      `}</style>
      
      <div className="bm2-root">
        <div className="bm2-header">
          <h1>OFFICE OF THE {officeName || 'MINISTRY NAME'} ({ddoCode || 'DDO'})</h1>
          <h2>PROPOSED BUDGET ESTIMATES FOR THE FINANCIAL YEAR {postsYear2Label || '2026-27'}</h2>
          <h3>BUDGET FORM BM-2</h3>
        </div>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            className={`btn-edit ${isEditing ? 'active' : ''}`}
            onClick={() => {
              setIsEditing(v => {
                const next = !v;
                if (!next) saveBm2Edits(ddoCode || '', edits || {});
                return next;
              });
            }}
          >
            {isEditing ? 'Done Editing' : 'Edit Figures'}
          </button>
        </div>

        <table className="bm2-table">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name of<br/>Entity</th>
              <th>FUNCTIONAL CUM OBJECT CLASSIFICATION<br/>AND PARTICULARS OF THE SCHEME</th>
              <th>BPS</th>
              <th>{postsYear1Label}</th>
              <th>{postsYear2Label}</th>
              <th>Account<br/>Financial year just<br/>closed ({accountYearLabel})</th>
              <th>BUDGET ESTIMATE<br/>{postsYear1Label}</th>
              <th>REVISED ESTIMATES<br/>{postsYear1Label}</th>
              <th>BUDGET ESTIMATES<br/>{postsYear2Label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const colorCls = row.isRed ? 'text-red' : '';
              const boldCls = row.isBold ? 'font-bold' : '';
              const cls = `${colorCls} ${boldCls}`.trim();
              const editable = isRowEditable(row);
              
              return (
                <tr key={idx}>
                  <td className={`text-left ${cls}`}>{row.code}</td>
                  <td className={`text-left uppercase ${cls}`}>{row.desc}</td>
                  <td className={`text-center ${cls}`}>{row.bps}</td>
                  <td className={`text-center ${cls}`}>{row.post1}</td>
                  <td className={`text-center ${cls}`}>{row.post2}</td>
                  <td className={`text-right ${cls}`}>{formatNum(row.acct)}</td>
                  <td className={`text-right ${cls}`}>{formatNum(row.est25)}</td>
                  <td className={`text-right ${cls}`}>
                    {isEditing && editable ? (
                      <input
                        type="text"
                        className={`edit-input ${hasEdit(row.code, 'rev25') ? 'modified' : ''}`}
                        value={getInputValue(row.code, 'rev25', row.rev25)}
                        onChange={e => handleInputChange(row.code, 'rev25', e.target.value)}
                        onBlur={() => handleInputBlur(row.code, 'rev25', row.rev25 || 0)}
                      />
                    ) : (
                      row.rev25 ? `${formatNum(row.rev25)}${hasEdit(row.code, 'rev25') ? '*' : ''}` : ''
                    )}
                  </td>
                  <td className={`text-right ${cls}`}>
                    {isEditing && editable ? (
                      <input
                        type="text"
                        className={`edit-input ${hasEdit(row.code, 'est26') ? 'modified' : ''}`}
                        value={getInputValue(row.code, 'est26', row.est26)}
                        onChange={e => handleInputChange(row.code, 'est26', e.target.value)}
                        onBlur={() => handleInputBlur(row.code, 'est26', row.est26 || 0)}
                      />
                    ) : (
                      row.est26 ? `${formatNum(row.est26)}${hasEdit(row.code, 'est26') ? '*' : ''}` : ''
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};