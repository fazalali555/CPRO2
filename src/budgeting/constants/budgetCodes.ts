// ============================================================
// CENTRALIZED BUDGET CODES & DESCRIPTIONS
// Single source of truth for all budget-related components
// ============================================================

// ------------------------------------------------------------
// TYPE DEFINITIONS
// ------------------------------------------------------------

export type BudgetCodeCategory = 'PAY' | 'ALLOWANCE' | 'NON_SALARY';

export interface BudgetCodeInfo {
  code: string;
  description: string;
  shortDesc?: string;
  category: BudgetCodeCategory;
}

export interface ExpenditureCalc {
  budget: number;
  expMonth: number;
  prevExp: number;
  totalExp: number;
  balance: number;
  excess: number;
}

export interface BudgetRowData extends ExpenditureCalc {
  head: string;
  code?: string;
  isYellow?: boolean;
  isBold?: boolean;
  isRed?: boolean;
}

export interface Bm20CalcResult {
  original: number;
  modified: number;
  actualPrev7: number;
  actualCurr5: number;
  totalColumns: number;
  anticipated: number;
  totalExpend: number;
  surrender: number;
  excess: number;
}

// ------------------------------------------------------------
// PAY CODES (A011xx)
// ------------------------------------------------------------

export const PAY_CODES: BudgetCodeInfo[] = [
  { code: 'A01101', description: 'Basic Pay of Officers', shortDesc: 'Basic Pay Officers', category: 'PAY' },
  { code: 'A01102', description: 'Personal Pay of Officers', shortDesc: 'Personal Pay Officers', category: 'PAY' },
  { code: 'A01151', description: 'Basic Pay of Other Staff', shortDesc: 'Basic Pay Staff', category: 'PAY' },
  { code: 'A01152', description: 'Personal Pay of Other Staff', shortDesc: 'Personal Pay Staff', category: 'PAY' },
];

// ------------------------------------------------------------
// ALLOWANCE CODES (A012xx)
// ------------------------------------------------------------

export const ALLOWANCE_CODES: BudgetCodeInfo[] = [
  { code: 'A01202', description: 'House Rent Allowance 45%', shortDesc: 'HRA', category: 'ALLOWANCE' },
  { code: 'A01203', description: 'Convey Allowance 2005', shortDesc: 'CA', category: 'ALLOWANCE' },
  { code: 'A01207', description: 'Washing Allowance', shortDesc: 'WA', category: 'ALLOWANCE' },
  { code: 'A01208', description: 'Dress Allowance', shortDesc: 'Dress', category: 'ALLOWANCE' },
  { code: 'A0120D', description: 'Integrated Allowance', shortDesc: 'Integrated', category: 'ALLOWANCE' },
  { code: 'A01217', description: 'Medical Allowance', shortDesc: 'MA', category: 'ALLOWANCE' },
  { code: 'A0121T', description: 'Adhoc Relief Allowance 2013', shortDesc: 'ARA-13', category: 'ALLOWANCE' },
  { code: 'A0122C', description: 'Adhoc Relief Allowance 2015', shortDesc: 'ARA-15', category: 'ALLOWANCE' },
  { code: 'A0124R', description: 'Adhoc Relief Allowance 2022', shortDesc: 'ARA-22', category: 'ALLOWANCE' },
  { code: 'A0124X', description: 'Adhoc Relief Allowance 2023', shortDesc: 'ARA-23', category: 'ALLOWANCE' },
  { code: 'A0125E', description: 'Adhoc Relief All 2024 25%', shortDesc: 'ARA-24', category: 'ALLOWANCE' },
  { code: 'A0125P', description: 'Adhoc Relief 2025 (10%)', shortDesc: 'ARA-25', category: 'ALLOWANCE' },
  { code: 'A0124N', description: 'Disperity Reduction Allowance 2022', shortDesc: 'DRA-22', category: 'ALLOWANCE' },
  { code: 'A0125Q', description: 'Dispar. Red. All-15%-2025', shortDesc: 'DRA-25', category: 'ALLOWANCE' },
  { code: 'A01233', description: 'UAA', shortDesc: 'UAA', category: 'ALLOWANCE' },
  { code: 'A01238', description: 'Charge Allowance', shortDesc: 'Charge', category: 'ALLOWANCE' },
  { code: 'A01226', description: 'Computer Allowance', shortDesc: 'Computer', category: 'ALLOWANCE' },
  { code: 'A01270', description: 'M.Phil Allowance', shortDesc: 'MPhil', category: 'ALLOWANCE' },
  { code: 'A0124H', description: 'Special Allowance', shortDesc: 'Special', category: 'ALLOWANCE' },
  { code: 'A0122N', description: 'Special Allowance for Disable', shortDesc: 'Disable', category: 'ALLOWANCE' },
  { code: 'A0124L', description: 'Weather Allowance', shortDesc: 'Weather', category: 'ALLOWANCE' },
  { code: 'A01239', description: 'Special Allowance', shortDesc: 'Special-2', category: 'ALLOWANCE' },
  { code: 'A0124', description: 'Entertainment Allowance', shortDesc: 'Entertainment', category: 'ALLOWANCE' },
  { code: 'A01253', description: 'Science Teaching Allowance', shortDesc: 'Science', category: 'ALLOWANCE' },
  { code: 'A01289', description: 'Teaching Allowance', shortDesc: 'Teaching', category: 'ALLOWANCE' },
  { code: 'A01274', description: 'Medical Charges', shortDesc: 'Med Charges', category: 'ALLOWANCE' },
  { code: 'A01278', description: 'Leave Salary', shortDesc: 'Leave Sal', category: 'ALLOWANCE' },
];

// ------------------------------------------------------------
// NON-SALARY CODES (A03xxx, A04xxx, A05xxx, A09xxx, A13xxx)
// ------------------------------------------------------------

export const NON_SALARY_CODES: BudgetCodeInfo[] = [
  { code: 'A03201', description: 'Postage & Telegraph', shortDesc: 'Postage', category: 'NON_SALARY' },
  { code: 'A03202', description: 'Telephone and Trunk Call', shortDesc: 'Telephone', category: 'NON_SALARY' },
  { code: 'A03303', description: 'Electricity', shortDesc: 'Electricity', category: 'NON_SALARY' },
  { code: 'A03305', description: 'POL for Generator', shortDesc: 'POL Gen', category: 'NON_SALARY' },
  { code: 'A03402', description: 'Rent for office building', shortDesc: 'Rent', category: 'NON_SALARY' },
  { code: 'A03805', description: 'Travelling Allowance', shortDesc: 'TA', category: 'NON_SALARY' },
  { code: 'A03807', description: 'POL for Vehicles', shortDesc: 'POL Veh', category: 'NON_SALARY' },
  { code: 'A03901', description: 'Stationery', shortDesc: 'Stationery', category: 'NON_SALARY' },
  { code: 'A03902', description: 'Printing & Publication', shortDesc: 'Printing', category: 'NON_SALARY' },
  { code: 'A03905', description: 'Newspapers Periodicals & Books', shortDesc: 'News/Books', category: 'NON_SALARY' },
  { code: 'A03970', description: '001- Others', shortDesc: 'Others', category: 'NON_SALARY' },
  { code: 'A04114', description: 'Superannation Encashment LPR', shortDesc: 'LPR', category: 'NON_SALARY' },
  { code: 'A05216', description: 'Financial Assistance to the Family', shortDesc: 'Fin Assist', category: 'NON_SALARY' },
  { code: 'A09201', description: 'Computer Equipment', shortDesc: 'Computer Eq', category: 'NON_SALARY' },
  { code: 'A09203', description: 'IT-Equipments', shortDesc: 'IT Equip', category: 'NON_SALARY' },
  { code: 'A09404', description: 'Medical & Laboratory Equipments', shortDesc: 'Lab Equip', category: 'NON_SALARY' },
  { code: 'A09501', description: 'Purchase of Transport', shortDesc: 'Transport', category: 'NON_SALARY' },
  { code: 'A09601', description: 'Purchase of Plant & Machinery', shortDesc: 'Plant/Mach', category: 'NON_SALARY' },
  { code: 'A09701', description: 'Purchase of Furniture & Fixture', shortDesc: 'Furniture', category: 'NON_SALARY' },
  { code: 'A13101', description: 'Machinery & equipment', shortDesc: 'Machinery', category: 'NON_SALARY' },
  { code: 'A13201', description: 'Furniture & Fixture', shortDesc: 'Furn/Fix', category: 'NON_SALARY' },
  { code: 'A13801', description: 'Maintenance of Gardens', shortDesc: 'Gardens', category: 'NON_SALARY' },
];

// ------------------------------------------------------------
// COMBINED EXPORTS
// ------------------------------------------------------------

export const ALL_BUDGET_CODES: BudgetCodeInfo[] = [
  ...PAY_CODES,
  ...ALLOWANCE_CODES,
  ...NON_SALARY_CODES,
];

// Quick lookup arrays (just the code strings)
export const PAY_CODE_LIST: string[] = PAY_CODES.map(c => c.code);
export const ALLOWANCE_CODE_LIST: string[] = ALLOWANCE_CODES.map(c => c.code);
export const NON_SALARY_CODE_LIST: string[] = NON_SALARY_CODES.map(c => c.code);
export const ALL_CODE_LIST: string[] = ALL_BUDGET_CODES.map(c => c.code);

// Description lookup map
export const CODE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  ALL_BUDGET_CODES.map(c => [c.code, c.description])
);

// ------------------------------------------------------------
// TOTAL ROW KEYWORDS (for highlighting)
// ------------------------------------------------------------

export const TOTAL_KEYWORDS: string[] = [
  'TOTAL PAY',
  'TOTAL ALLOWANCES',
  'TOTAL ALLOWANCE',
  'TOTAL SALARY',
  'TOTAL NON SALARY',
  'TOTAL NON-SALARY',
  'TOTAL EMPLOYEE',
  'GRAND TOTAL',
  'NON SALARY',
  'NON-SALARY',
];

// ------------------------------------------------------------
// MONTH KEYS
// ------------------------------------------------------------

export const MONTH_KEYS = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'] as const;
export const FULL_MONTH_NAMES = ['JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE'] as const;

export const MONTH_OPTIONS = [
  { key: 'JUL', label: 'July' },
  { key: 'AUG', label: 'August' },
  { key: 'SEP', label: 'September' },
  { key: 'OCT', label: 'October' },
  { key: 'NOV', label: 'November' },
  { key: 'DEC', label: 'December' },
  { key: 'JAN', label: 'January' },
  { key: 'FEB', label: 'February' },
  { key: 'MAR', label: 'March' },
  { key: 'APR', label: 'April' },
  { key: 'MAY', label: 'May' },
  { key: 'JUN', label: 'June' },
];

// ------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------

/**
 * Extract budget code from a string (e.g., "A01101-Basic Pay" -> "A01101")
 */
export const extractCode = (value: string): string => {
  if (!value) return '';
  const match = value.match(/A\d{4}[A-Z0-9]{1,2}/i) ||
                value.match(/A\d{5}/i) ||
                value.match(/A\d{4}/i);
  return match ? match[0].toUpperCase() : '';
};

/**
 * Check if a code is valid
 */
export const isValidCode = (code: string): boolean => {
  return ALL_CODE_LIST.includes(code.toUpperCase());
};

/**
 * Get description for a code
 */
export const getCodeDescription = (code: string): string => {
  return CODE_DESCRIPTIONS[code.toUpperCase()] || code;
};

/**
 * Check if a code is a salary code (PAY or ALLOWANCE)
 */
export const isSalaryCode = (code: string): boolean => {
  const upper = code.toUpperCase();
  return upper.startsWith('A011') || upper.startsWith('A012');
};

/**
 * Check if a head string is a total row
 */
export const isTotalRow = (head: string): boolean => {
  const upper = (head || '').toUpperCase();
  return TOTAL_KEYWORDS.some(keyword => upper.includes(keyword));
};

/**
 * Build a row head string (e.g., "A01101-Basic Pay of Officers")
 */
export const buildRowHead = (code: string): string => {
  const desc = getCodeDescription(code);
  return desc !== code ? `${code}-${desc}` : code;
};

/**
 * Parse number from various formats
 */
export const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, '');
  const neg = cleaned.startsWith('(') && cleaned.endsWith(')');
  const num = Number(cleaned.replace(/[()]/g, ''));
  if (isNaN(num)) return 0;
  return neg ? -num : num;
};

/**
 * Format number for display
 */
export const formatNumber = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseNumber(value);
  if (num === 0) return '';
  return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};

/**
 * Normalize header for matching
 */
export const normalizeHeader = (value: unknown): string => {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Calculate balance and excess from budget and total expenditure
 */
export const calcBalanceExcess = (budget: number, totalExp: number): { balance: number; excess: number } => {
  const diff = budget - totalExp;
  return {
    balance: diff >= 0 ? diff : 0,
    excess: diff < 0 ? Math.abs(diff) : 0,
  };
};

/**
 * Sum expenditure calculations
 */
export const sumExpenditureCalcs = (calcs: ExpenditureCalc[]): ExpenditureCalc => {
  const sum = calcs.reduce(
    (acc, c) => ({
      budget: acc.budget + c.budget,
      expMonth: acc.expMonth + c.expMonth,
      prevExp: acc.prevExp + c.prevExp,
      totalExp: acc.totalExp + c.totalExp,
      balance: 0,
      excess: 0,
    }),
    { budget: 0, expMonth: 0, prevExp: 0, totalExp: 0, balance: 0, excess: 0 }
  );

  const { balance, excess } = calcBalanceExcess(sum.budget, sum.totalExp);
  return { ...sum, balance, excess };
};

/**
 * Sum BM20 calculations
 */
export const sumBm20Calcs = (calcs: Bm20CalcResult[]): Bm20CalcResult => {
  return calcs.reduce(
    (acc, c) => ({
      original: acc.original + c.original,
      modified: acc.modified + c.modified,
      actualPrev7: acc.actualPrev7 + c.actualPrev7,
      actualCurr5: acc.actualCurr5 + c.actualCurr5,
      totalColumns: acc.totalColumns + c.totalColumns,
      anticipated: acc.anticipated + c.anticipated,
      totalExpend: acc.totalExpend + c.totalExpend,
      surrender: acc.surrender + c.surrender,
      excess: acc.excess + c.excess,
    }),
    { original: 0, modified: 0, actualPrev7: 0, actualCurr5: 0, totalColumns: 0, anticipated: 0, totalExpend: 0, surrender: 0, excess: 0 }
  );
};

/**
 * Sum months from a record
 */
export const sumMonths = (months: Record<string, number>, keys: string[]): number => {
  return keys.reduce((sum, key) => sum + (months[key] || 0), 0);
};

/**
 * Build office name and DDO from ministry text
 */
export const buildOfficeAndDdo = (ministryText: string): { office: string; ddo: string } => {
  const ddoMatch = ministryText.match(/[A-Z]{2}\s*\d{4}/);
  const ddoRaw = ddoMatch ? ddoMatch[0] : '';
  const ddo = ddoRaw ? ddoRaw.replace(/\s+/g, '') : '';
  const cleanedMinistry = ministryText
    .replace(/OFFICE\s*OF\s*THE/ig, '')
    .replace(/MINISTRY\s*NAME/ig, '')
    .replace(/MINISTRY/ig, '')
    .replace(/DDO\s*CODE/ig, '')
    .replace(/DDO/ig, '')
    .replace(/CODE/ig, '')
    .replace(/DETAIL\s*OBJECT\s*DESC/ig, '')
    .replace(/\bAND\b/ig, '')
    .replace(ddo, '')
    .replace(/^\s*[-–]\s*/g, '')
    .replace(/[-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const upperMinistry = cleanedMinistry.toUpperCase();
  const isGovtGirlsHigh = upperMinistry.startsWith('GOVT. GIRLS HIGH SCHOOL') || upperMinistry.startsWith('GOVT GIRLS HIGH SCHOOL');
  const isGovtHigh = upperMinistry.startsWith('GOVT. HIGH SCHOOL') || upperMinistry.startsWith('GOVT HIGH SCHOOL');
  const isHigherSecondary = upperMinistry.startsWith('HIGHER SECONDARY SCHOOL') || upperMinistry.startsWith('GOVT. HIGHER SECONDARY SCHOOL') || upperMinistry.startsWith('GOVT HIGHER SECONDARY SCHOOL');
  const isPrimary = upperMinistry.startsWith('PRIMARY SCHOOL') || upperMinistry.startsWith('GOVT. PRIMARY SCHOOL') || upperMinistry.startsWith('GOVT PRIMARY SCHOOL');
  const title = isPrimary
    ? 'SDEO'
    : isGovtGirlsHigh
      ? 'HEADMISTRESS'
      : isGovtHigh
        ? 'HEADMASTER'
        : isHigherSecondary
          ? 'PRINCIPAL'
          : '';
  const office = cleanedMinistry ? (title ? `${title} ${cleanedMinistry}` : cleanedMinistry) : '';
  return { office, ddo };
};

/**
 * Check if a row head matches a valid code or is a total
 */
export const isValidRowHead = (head: string): boolean => {
  if (!head) return false;
  const headUpper = head.toUpperCase().trim();

  // Check for total rows
  if (isTotalRow(headUpper)) return true;

  // Extract and check code
  const code = extractCode(headUpper);
  return ALL_CODE_LIST.includes(code);
};