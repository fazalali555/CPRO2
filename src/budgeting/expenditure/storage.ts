export type ExpenditureRecord = {
  id: string;
  title: string;
  amount: number;
  date: string;
  notes?: string;
};

export type ExpenditureStatement = {
  id: string;
  title: string;
  officeName: string;
  ddoCode: string;
  fiscalYearLabel: string;
  monthKey: string;
  monthTitle: string;
  rows: any[];
  createdAt: string;
};

const YEAR_INDEX_KEY = 'budgeting/expenditure/years';

const loadLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getExpenditureYearKey = (year: number) => `budgeting/expenditure/${year}`;
const getExpenditureStatementsKey = (year: number) => `${getExpenditureYearKey(year)}/statements`;

export const listExpenditureYears = (): number[] => {
  const years = loadLocal<number[]>(YEAR_INDEX_KEY, []);
  return Array.from(new Set(years)).sort((a, b) => b - a);
};

export const ensureExpenditureYearFolder = (year: number) => {
  if (!Number.isFinite(year) || year < 2000) return;
  const years = listExpenditureYears();
  const next = years.includes(year) ? years : [year, ...years];
  saveLocal(YEAR_INDEX_KEY, next);
  const key = getExpenditureYearKey(year);
  const existing = loadLocal<ExpenditureRecord[]>(key, []);
  saveLocal(key, existing);
  const statementsKey = getExpenditureStatementsKey(year);
  const statements = loadLocal<ExpenditureStatement[]>(statementsKey, []);
  saveLocal(statementsKey, statements);
};

export const loadExpenditureRecords = (year: number): ExpenditureRecord[] => {
  const key = getExpenditureYearKey(year);
  return loadLocal<ExpenditureRecord[]>(key, []);
};

export const saveExpenditureRecord = (year: number, record: ExpenditureRecord) => {
  ensureExpenditureYearFolder(year);
  const key = getExpenditureYearKey(year);
  const records = loadExpenditureRecords(year);
  const next = [record, ...records];
  saveLocal(key, next);
  return next;
};

export const loadExpenditureStatements = (year: number): ExpenditureStatement[] => {
  const key = getExpenditureStatementsKey(year);
  return loadLocal<ExpenditureStatement[]>(key, []);
};

export const saveExpenditureStatement = (year: number, statement: ExpenditureStatement) => {
  ensureExpenditureYearFolder(year);
  const key = getExpenditureStatementsKey(year);
  const records = loadExpenditureStatements(year);
  const next = [statement, ...records];
  saveLocal(key, next);
  return next;
};
