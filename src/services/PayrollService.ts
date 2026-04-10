
import { PrEmployee, PrDDO, PrPosting, PrBankAccount, PrPeriod, PrPayroll, PrAllowance, PrDeduction, PrLoan, PrPayrollCode, PayrollCodeType } from '../types';
import { PAY_ALLOWANCE_CODES, DEDUCTION_CODES, LOAN_CODES } from '../data/payrollCodes';
import { deriveGender, deriveStaffType } from '../utils/employeeAdapter';

// Storage Keys
const KEYS = {
  EMPLOYEES: 'pr_employees',
  DDOS: 'pr_ddo_offices',
  POSTINGS: 'pr_employee_posting',
  BANKS: 'pr_bank_accounts',
  PERIODS: 'pr_payroll_periods',
  PAYROLL: 'pr_payroll',
  ALLOWANCES: 'pr_payroll_allowances',
  DEDUCTIONS: 'pr_payroll_deductions',
  LOANS: 'pr_payroll_loans',
  CODES: 'pr_payroll_codes' // New key for codes
};

// Helper to generate IDs
const genId = () => Date.now().toString() + Math.floor(Math.random() * 1000);

// Helper to load/save
const load = <T>(key: string): T[] => {
  const s = localStorage.getItem(key);
  return s ? JSON.parse(s) : [];
};
const save = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// Seeder for Codes
const seedCodes = () => {
  const existing = load<PrPayrollCode>(KEYS.CODES);
  if (existing.length === 0) {
    const seeded: PrPayrollCode[] = [
      ...PAY_ALLOWANCE_CODES.map((c, i) => ({ id: `seed_allow_${i}`, ...c, type: 'allowance' as PayrollCodeType })),
      ...DEDUCTION_CODES.map((c, i) => ({ id: `seed_ded_${i}`, ...c, type: 'deduction' as PayrollCodeType })),
      ...LOAN_CODES.map((c, i) => ({ id: `seed_loan_${i}`, ...c, type: 'loan' as PayrollCodeType })),
    ];
    save(KEYS.CODES, seeded);
    return seeded;
  }
  return existing;
};

// Initialize codes
seedCodes();

export const PayrollService = {
  // --- EMPLOYEES ---
  getEmployees: () => load<PrEmployee>(KEYS.EMPLOYEES),
  saveEmployee: (emp: PrEmployee) => {
    const list = load<PrEmployee>(KEYS.EMPLOYEES);
    // Unique Check
    if (list.some(e => (e.cnic_no === emp.cnic_no || e.personnel_no === emp.personnel_no) && e.employee_id !== emp.employee_id)) {
      throw new Error("CNIC or Personnel Number must be unique");
    }
    
    if (emp.employee_id) {
      const idx = list.findIndex(e => e.employee_id === emp.employee_id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...emp, updated_at: new Date().toISOString() };
      }
    } else {
      emp.employee_id = genId();
      emp.created_at = new Date().toISOString();
      list.push(emp);
    }
    save(KEYS.EMPLOYEES, list);
    return emp;
  },
  deleteEmployee: (id: string) => {
    let list = load<PrEmployee>(KEYS.EMPLOYEES);
    list = list.filter(e => e.employee_id !== id);
    save(KEYS.EMPLOYEES, list);
  },

  // --- BULK UPDATES ---
  applyRulesToAllEmployees: () => {
    const list = load<PrEmployee>(KEYS.EMPLOYEES);
    let updatedCount = 0;
    
    const newList = list.map(emp => {
      const oldGender = emp.gender;
      const newGender = deriveGender(emp.cnic_no, emp.gender);
      
      const oldStaffType = emp.staff_type;
      // Check designation from multiple fields as fallback
      const designation = emp.designation || emp.designation_short || emp.designation_full || '';
      const newStaffType = deriveStaffType(designation, emp.staff_type);

      if (oldGender !== newGender || oldStaffType !== newStaffType) {
        updatedCount++;
        return {
          ...emp,
          gender: newGender,
          staff_type: newStaffType,
          updated_at: new Date().toISOString()
        };
      }
      return emp;
    });

    if (updatedCount > 0) {
      save(KEYS.EMPLOYEES, newList);
    }
    return updatedCount;
  },

  // --- EMPLOYEE POSTINGS ---
  getPostings: (employeeId: string) => {
    const list = load<PrPosting>(KEYS.POSTINGS);
    return list.filter(p => p.employee_id === employeeId);
  },
  savePosting: (p: PrPosting) => {
    const list = load<PrPosting>(KEYS.POSTINGS);
    if (p.posting_id) {
      const idx = list.findIndex(x => x.posting_id === p.posting_id);
      if (idx !== -1) list[idx] = p;
    } else {
      p.posting_id = genId();
      list.push(p);
    }
    save(KEYS.POSTINGS, list);
  },
  deletePosting: (id: string) => {
    const list = load<PrPosting>(KEYS.POSTINGS).filter(p => p.posting_id !== id);
    save(KEYS.POSTINGS, list);
  },

  // --- BANK ACCOUNTS ---
  getBankAccounts: (employeeId: string) => {
    const list = load<PrBankAccount>(KEYS.BANKS);
    return list.filter(b => b.employee_id === employeeId);
  },
  saveBankAccount: (b: PrBankAccount) => {
    const list = load<PrBankAccount>(KEYS.BANKS);
    if (b.is_primary) {
      list.forEach(x => {
        if (x.employee_id === b.employee_id) x.is_primary = false;
      });
    }
    if (b.bank_account_id) {
      const idx = list.findIndex(x => x.bank_account_id === b.bank_account_id);
      if (idx !== -1) list[idx] = b;
    } else {
      b.bank_account_id = genId();
      list.push(b);
    }
    save(KEYS.BANKS, list);
  },
  deleteBankAccount: (id: string) => {
    const list = load<PrBankAccount>(KEYS.BANKS).filter(b => b.bank_account_id !== id);
    save(KEYS.BANKS, list);
  },

  // --- DDOs ---
  getDDOs: () => load<PrDDO>(KEYS.DDOS),
  saveDDO: (ddo: PrDDO) => {
    const list = load<PrDDO>(KEYS.DDOS);
    const idx = list.findIndex(d => d.ddo_code === ddo.ddo_code);
    if (idx !== -1) list[idx] = ddo;
    else list.push(ddo);
    save(KEYS.DDOS, list);
  },
  deleteDDO: (code: string) => {
    let list = load<PrDDO>(KEYS.DDOS);
    list = list.filter(d => d.ddo_code !== code);
    save(KEYS.DDOS, list);
  },

  // --- PERIODS ---
  getPeriods: () => load<PrPeriod>(KEYS.PERIODS),
  savePeriod: (p: PrPeriod) => {
    const list = load<PrPeriod>(KEYS.PERIODS);
    const exists = list.find(x => x.ddo_code === p.ddo_code && x.period_year === p.period_year && x.period_month === p.period_month && x.period_id !== p.period_id);
    if (exists) throw new Error("Period already exists for this DDO");

    if (p.period_id) {
      const idx = list.findIndex(x => x.period_id === p.period_id);
      if (idx !== -1) list[idx] = p;
    } else {
      p.period_id = genId();
      list.push(p);
    }
    save(KEYS.PERIODS, list);
    return p;
  },

  // --- PAYROLL MASTER ---
  getPayrollByPeriod: (periodId: string) => {
    const pay = load<PrPayroll>(KEYS.PAYROLL);
    const emp = load<PrEmployee>(KEYS.EMPLOYEES);
    return pay.filter(p => p.period_id === periodId).map(p => {
      const e = emp.find(x => x.employee_id === p.employee_id);
      return { ...p, employee_name: e?.name, personnel_no: e?.personnel_no };
    });
  },
  savePayroll: (p: PrPayroll) => {
    const list = load<PrPayroll>(KEYS.PAYROLL);
    if (p.payroll_id) {
      const idx = list.findIndex(x => x.payroll_id === p.payroll_id);
      if (idx !== -1) list[idx] = p;
    } else {
      p.payroll_id = genId();
      list.push(p);
    }
    save(KEYS.PAYROLL, list);
    return p;
  },
  deletePayroll: (id: string) => {
    let list = load<PrPayroll>(KEYS.PAYROLL);
    list = list.filter(x => x.payroll_id !== id);
    save(KEYS.PAYROLL, list);
  },

  // --- PAYROLL DETAILS (Allowances/Deductions/Loans) ---
  getItems: (payrollId: string, type: 'allowances' | 'deductions' | 'loans') => {
    const key = type === 'allowances' ? KEYS.ALLOWANCES : type === 'deductions' ? KEYS.DEDUCTIONS : KEYS.LOANS;
    const list = load<any>(key);
    return list.filter((x: any) => x.payroll_id === payrollId);
  },
  saveItem: (item: any, type: 'allowances' | 'deductions' | 'loans') => {
    const key = type === 'allowances' ? KEYS.ALLOWANCES : type === 'deductions' ? KEYS.DEDUCTIONS : KEYS.LOANS;
    const idKey = type === 'allowances' ? 'allow_id' : type === 'deductions' ? 'ded_id' : 'loan_id';
    
    const list = load<any>(key);
    if (item[idKey]) {
      const idx = list.findIndex((x: any) => x[idKey] === item[idKey]);
      if (idx !== -1) list[idx] = item;
    } else {
      item[idKey] = genId();
      list.push(item);
    }
    save(key, list);
    PayrollService.recalcTotals(item.payroll_id);
  },
  deleteItem: (id: string, type: 'allowances' | 'deductions' | 'loans') => {
    const key = type === 'allowances' ? KEYS.ALLOWANCES : type === 'deductions' ? KEYS.DEDUCTIONS : KEYS.LOANS;
    const idKey = type === 'allowances' ? 'allow_id' : type === 'deductions' ? 'ded_id' : 'loan_id';
    
    let list = load<any>(key);
    const item = list.find((x: any) => x[idKey] === id);
    if (!item) return;
    
    list = list.filter((x: any) => x[idKey] !== id);
    save(key, list);
    PayrollService.recalcTotals(item.payroll_id);
  },

  recalcTotals: (payrollId: string) => {
    const allows = load<PrAllowance>(KEYS.ALLOWANCES).filter(x => x.payroll_id === payrollId);
    const deds = load<PrDeduction>(KEYS.DEDUCTIONS).filter(x => x.payroll_id === payrollId);
    
    const gross = allows.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const deductions = deds.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    
    const payrollList = load<PrPayroll>(KEYS.PAYROLL);
    const idx = payrollList.findIndex(p => p.payroll_id === payrollId);
    if (idx !== -1) {
      payrollList[idx].gross_pay = gross;
      payrollList[idx].total_deductions = deductions;
      payrollList[idx].net_pay = gross - deductions;
      save(KEYS.PAYROLL, payrollList);
    }
  },

  // --- CODES MANAGEMENT ---
  getCodes: (type?: PayrollCodeType) => {
    const all = load<PrPayrollCode>(KEYS.CODES);
    if (type) return all.filter(c => c.type === type);
    return all;
  },
  saveCode: (code: PrPayrollCode) => {
    const list = load<PrPayrollCode>(KEYS.CODES);
    if (code.id) {
      const idx = list.findIndex(c => c.id === code.id);
      if (idx !== -1) list[idx] = code;
    } else {
      code.id = genId();
      list.push(code);
    }
    save(KEYS.CODES, list);
  },
  deleteCode: (id: string) => {
    const list = load<PrPayrollCode>(KEYS.CODES).filter(c => c.id !== id);
    save(KEYS.CODES, list);
  }
};
