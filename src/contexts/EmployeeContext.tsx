import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { EmployeeRecord, CaseRecord, INITIAL_EMPLOYEES } from '../types';
import { migrateToV2, migrateCasesToV1, autoCalculateRetirementDates } from '../utils';
import { resetBudgetingStorage, CURRENT_BUDGET_CACHE_VERSION } from '../budgeting/budget/storage';
import { employeeDB, caseDB, migrateFromLocalStorage } from '../lib/db';

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeContextType {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  setEmployees: (employees: EmployeeRecord[]) => void;
  setCases: (cases: CaseRecord[]) => void;
  addEmployee: (emp: EmployeeRecord) => void;
  updateEmployee: (updatedEmp: EmployeeRecord) => void;
  deleteEmployee: (id: string) => void;
  addCase: (c: CaseRecord) => void;
  updateCase: (updatedCase: CaseRecord) => void;
  deleteCase: (id: string) => void;
  isLoading: boolean;
  dbError: string | null;
  canSave: boolean; // Exposed to allow UI to show warning if saving is disabled
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================

/**
 * Debounced write to IndexedDB.
 * Prevents excessive writes when multiple state changes happen rapidly.
 */
const useDebouncedDBWrite = <T,>(
  data: T[],
  writeFunction: (data: T[]) => Promise<void>,
  canSave: boolean, // Protection flag
  delay: number = 500
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const lastWrittenRef = useRef<string>('');

  useEffect(() => {
    // Skip if initial render OR if we are in a protected state (load failed)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!canSave) {
      console.warn('[DB] Write blocked: System is in protected mode due to load failure.');
      return;
    }

    // Quick hash to avoid writing identical data
    const hash = data.length.toString() + '_' + (data[0] as any)?.id + '_' + (data[data.length - 1] as any)?.id;
    if (hash === lastWrittenRef.current && data.length > 0) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Schedule write
    timerRef.current = setTimeout(async () => {
      try {
        await writeFunction(data);
        lastWrittenRef.current = hash;
      } catch (e) {
        console.error('[DB] Write error:', e);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, writeFunction, delay, canSave]);
};

// ============================================================================
// PROVIDER
// ============================================================================

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ── State ────────────────────────────────────────────────────────────
  const [employees, setEmployeesState] = useState<EmployeeRecord[]>([]);
  const [cases, setCasesState] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(false); // Critical protection flag

  // ── Load data from IndexedDB on mount ────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setDbError(null);

        // Step 1: Auto-migrate from localStorage if needed
        const migration = await migrateFromLocalStorage();
        if (migration.migrated) {
          console.log(
            `[Context] Migrated from localStorage: ${migration.employeeCount} employees, ${migration.caseCount} cases`
          );
        }

        // Step 2: Load from IndexedDB
        let [dbEmployees, dbCases] = await Promise.all([
          employeeDB.getAll(),
          caseDB.getAll(),
        ]);

        const isFreshInstall = dbEmployees.length === 0;

        // Step 3: If IndexedDB is empty, try localStorage fallback
        if (isFreshInstall) {
          console.log('[Context] IndexedDB empty, checking localStorage...');

          const lsEmployees = localStorage.getItem('clerk_pro_rpms_employees');
          if (lsEmployees) {
            try {
              const parsed = JSON.parse(lsEmployees);
              if (Array.isArray(parsed) && parsed.length > 0) {
                dbEmployees = parsed;
                console.log(`[Context] Loaded ${dbEmployees.length} from localStorage fallback`);
              }
            } catch (e) {
              console.error('[Context] Failed to parse localStorage employees:', e);
            }
          }

          // If still empty, use initial data
          if (dbEmployees.length === 0) {
            dbEmployees = INITIAL_EMPLOYEES;
            console.log('[Context] Using INITIAL_EMPLOYEES');
          }
        }

        if (dbCases.length === 0) {
          const lsCases = localStorage.getItem('clerk_pro_rpms_cases');
          if (lsCases) {
            try {
              const parsed = JSON.parse(lsCases);
              if (Array.isArray(parsed) && parsed.length > 0) {
                dbCases = parsed;
              }
            } catch (e) {
              console.error('[Context] Failed to parse localStorage cases:', e);
            }
          }
        }

        // Step 4: Migrate data schema
        const migratedEmployees = migrateToV2(dbEmployees);
        const calculatedEmployees = autoCalculateRetirementDates(migratedEmployees);
        const migratedCases = migrateCasesToV1(dbCases);

        // Step 5: Save migrated data back to IndexedDB (only if we actually have data or it's a fresh install)
        await Promise.all([
          employeeDB.replaceAll(calculatedEmployees),
          caseDB.replaceAll(migratedCases),
        ]);

        // Step 6: Set state & Enable Saving
        setEmployeesState(calculatedEmployees);
        setCasesState(migratedCases);
        setCanSave(true); // Load succeeded, we can now safely persist changes

        console.log(
          `[Context] Loaded: ${calculatedEmployees.length} employees, ${migratedCases.length} cases`
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown database error';
        console.error('[Context] Load error:', e);
        setDbError(msg);
        setCanSave(false); // CRITICAL: Stop auto-saving to prevent overwriting valid DB data with samples

        // Emergency READ-ONLY fallback: try localStorage directly
        try {
          const lsEmp = localStorage.getItem('clerk_pro_rpms_employees');
          const lsCases = localStorage.getItem('clerk_pro_rpms_cases');

          if (lsEmp) {
            const empData = JSON.parse(lsEmp);
            const caseData = lsCases ? JSON.parse(lsCases) : [];
            setEmployeesState(migrateToV2(empData));
            setCasesState(migrateCasesToV1(caseData));
            console.warn('[Context] Emergency Read-Only fallback to localStorage');
          } else {
            setEmployeesState(INITIAL_EMPLOYEES);
            setCasesState([]);
          }
        } catch (fallbackErr) {
          console.error('[Context] Emergency fallback failed:', fallbackErr);
          setEmployeesState(INITIAL_EMPLOYEES);
          setCasesState([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ── Budget cache invalidation ────────────────────────────────────────
  useEffect(() => {
    const ver = localStorage.getItem('budgeting/cache/version');
    if (ver !== CURRENT_BUDGET_CACHE_VERSION) {
      resetBudgetingStorage();
    }
  }, []);

  // ── Debounced writes to IndexedDB ────────────────────────────────────
  const writeEmployees = useCallback(async (data: EmployeeRecord[]) => {
    if (!canSave) return;
    try {
      await employeeDB.replaceAll(data);
      try {
        localStorage.setItem('clerk_pro_rpms_employees', JSON.stringify(data));
      } catch {
        // localStorage full
      }
    } catch (e) {
      console.error('[DB] Employee write failed:', e);
    }
  }, [canSave]);

  const writeCases = useCallback(async (data: CaseRecord[]) => {
    if (!canSave) return;
    try {
      await caseDB.replaceAll(data);
      try {
        localStorage.setItem('clerk_pro_rpms_cases', JSON.stringify(data));
      } catch {
        // localStorage full
      }
    } catch (e) {
      console.error('[DB] Case write failed:', e);
    }
  }, [canSave]);

  useDebouncedDBWrite(employees, writeEmployees, canSave, 300);
  useDebouncedDBWrite(cases, writeCases, canSave, 300);

  // ── Setters ──────────────────────────────────────────────────────────
  const setEmployees = useCallback((newEmployees: EmployeeRecord[]) => {
    setEmployeesState(newEmployees);
  }, []);

  const setCases = useCallback((newCases: CaseRecord[]) => {
    setCasesState(newCases);
  }, []);

  // ── Individual CRUD Operations ───────────────────────────────────────
  const addEmployee = useCallback((emp: EmployeeRecord) => {
    setEmployeesState((prev) => [...prev, emp]);
    if (canSave) {
      employeeDB.save(emp).catch(e => console.error('[DB] Add employee failed:', e));
    }
  }, [canSave]);

  const updateEmployee = useCallback((updatedEmp: EmployeeRecord) => {
    setEmployeesState((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    if (canSave) {
      employeeDB.save(updatedEmp).catch(e => console.error('[DB] Update employee failed:', e));
    }
  }, [canSave]);

  const deleteEmployee = useCallback((id: string) => {
    setEmployeesState((prev) => prev.filter((e) => e.id !== id));
    if (canSave) {
      employeeDB.delete(id).catch(e => console.error('[DB] Delete employee failed:', e));
    }
  }, [canSave]);

  const addCase = useCallback((c: CaseRecord) => {
    setCasesState((prev) => [...prev, c]);
    if (canSave) {
      caseDB.save(c).catch(e => console.error('[DB] Add case failed:', e));
    }
  }, [canSave]);

  const updateCase = useCallback((updatedCase: CaseRecord) => {
    setCasesState((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
    if (canSave) {
      caseDB.save(updatedCase).catch(e => console.error('[DB] Update case failed:', e));
    }
  }, [canSave]);

  const deleteCase = useCallback((id: string) => {
    setCasesState((prev) => prev.filter((c) => c.id !== id));
    if (canSave) {
      caseDB.delete(id).catch(e => console.error('[DB] Delete case failed:', e));
    }
  }, [canSave]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <EmployeeContext.Provider
      value={{
        employees,
        cases,
        setEmployees,
        setCases,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addCase,
        updateCase,
        deleteCase,
        isLoading,
        dbError,
        canSave,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider');
  }
  return context;
};