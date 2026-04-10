export type BudgetSnapshot = {
  id: string;
  title: string;
  officeName: string;
  ddoCode: string;
  fiscalYearLabel: string;
  previousMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>;
  currentMap: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>;
  overrides: Record<string, { cfy: number; next: number }>;
  sanctioned: Record<string, number>;
  bm2Edits?: Record<string, { rev25?: number; est26?: number }>;
  createdAt: string;
};

export type Bm2AuditEntry = {
  ts: string;
  code: string;
  field: 'rev25' | 'est26';
  oldValue: number;
  newValue: number;
};

const SNAPSHOT_INDEX_KEY = 'budgeting/budget/snapshots';

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

export const listBudgetSnapshots = (): BudgetSnapshot[] => {
  return loadLocal<BudgetSnapshot[]>(SNAPSHOT_INDEX_KEY, []);
};

export const saveBudgetSnapshot = (snapshot: BudgetSnapshot): BudgetSnapshot[] => {
  const existing = listBudgetSnapshots();
  const next = [snapshot, ...existing].slice(0, 50);
  saveLocal(SNAPSHOT_INDEX_KEY, next);
  return next;
};

export const deleteBudgetSnapshot = (id: string): BudgetSnapshot[] => {
  const existing = listBudgetSnapshots();
  const next = existing.filter(s => s.id !== id);
  saveLocal(SNAPSHOT_INDEX_KEY, next);
  return next;
};

export const loadBm2Edits = (ddoCode: string): Record<string, { rev25?: number; est26?: number }> => {
  const key = `budgeting/bm2/edits/${(ddoCode || '').replace(/\s+/g, '').trim().toUpperCase() || 'DEFAULT'}`;
  return loadLocal<Record<string, { rev25?: number; est26?: number }>>(key, {});
};

export const saveBm2Edits = (ddoCode: string, edits: Record<string, { rev25?: number; est26?: number }>) => {
  const key = `budgeting/bm2/edits/${(ddoCode || '').replace(/\s+/g, '').trim().toUpperCase() || 'DEFAULT'}`;
  saveLocal(key, edits || {});
};

export const appendBm2Audit = (ddoCode: string, entry: Bm2AuditEntry) => {
  const key = `budgeting/bm2/audit/${(ddoCode || '').replace(/\s+/g, '').trim().toUpperCase() || 'DEFAULT'}`;
  const existing = loadLocal<Bm2AuditEntry[]>(key, []);
  const next = [entry, ...existing].slice(0, 500);
  saveLocal(key, next);
};

export const CURRENT_BUDGET_CACHE_VERSION = '2';

export const resetBudgetingStorage = () => {
  try {
    const keysToClearPrefixes = [
      'budgeting/budget/snapshots',
      'budgeting/bm2/edits/',
      'budgeting/bm2/audit/',
      'budgeting/posts/overrides/',
      'budgeting/posts/sanctioned/',
      'budgeting/bm6/projections/',
      'budgeting/bm6/groupBasic/',
    ];
    // Clear snapshot index safely
    localStorage.setItem('budgeting/budget/snapshots', JSON.stringify([]));
    // Remove prefixed keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => {
      if (keysToClearPrefixes.some(p => k.startsWith(p))) {
        localStorage.removeItem(k);
      }
    });
    // Mark version
    localStorage.setItem('budgeting/cache/version', CURRENT_BUDGET_CACHE_VERSION);
  } catch {}
};
