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
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================

/**
 * Debounced write to IndexedDB.
 * Prevents excessive writes when multiple state changes happen rapidly
 * (e.g., during bulk import or auto-calculation).
 */
const useDebouncedDBWrite = <T,>(
  data: T[],
  writeFunction: (data: T[]) => Promise<void>,
  delay: number = 500
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const lastWrittenRef = useRef<string>('');

  useEffect(() => {
    // Skip the initial render — data is loaded FROM db, no need to write back
    if (isFirstRender.current) {
      isFirstRender.current = false;
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
  }, [data, writeFunction, delay]);
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

        // Step 3: If IndexedDB is empty, try localStorage fallback
        if (dbEmployees.length === 0) {
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

        // Step 5: Save migrated data back to IndexedDB
        await Promise.all([
          employeeDB.replaceAll(calculatedEmployees),
          caseDB.replaceAll(migratedCases),
        ]);

        // Step 6: Set state
        setEmployeesState(calculatedEmployees);
        setCasesState(migratedCases);

        console.log(
          `[Context] Loaded: ${calculatedEmployees.length} employees, ${migratedCases.length} cases`
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown database error';
        console.error('[Context] Load error:', e);
        setDbError(msg);

        // Emergency fallback: try localStorage directly
        try {
          const lsEmp = localStorage.getItem('clerk_pro_rpms_employees');
          const lsCases = localStorage.getItem('clerk_pro_rpms_cases');

          const empData = lsEmp ? JSON.parse(lsEmp) : INITIAL_EMPLOYEES;
          const caseData = lsCases ? JSON.parse(lsCases) : [];

          setEmployeesState(migrateToV2(empData));
          setCasesState(migrateCasesToV1(caseData));

          console.warn('[Context] Fell back to localStorage due to IndexedDB error');
        } catch (fallbackErr) {
          console.error('[Context] localStorage fallback also failed:', fallbackErr);
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
    try {
      await employeeDB.replaceAll(data);
      // Also keep localStorage as backup (optional — remove if too large)
      try {
        localStorage.setItem('clerk_pro_rpms_employees', JSON.stringify(data));
      } catch {
        // localStorage full — that's fine, IndexedDB is primary now
      }
    } catch (e) {
      console.error('[DB] Employee write failed:', e);
    }
  }, []);

  const writeCases = useCallback(async (data: CaseRecord[]) => {
    try {
      await caseDB.replaceAll(data);
      try {
        localStorage.setItem('clerk_pro_rpms_cases', JSON.stringify(data));
      } catch {
        // localStorage full — fine
      }
    } catch (e) {
      console.error('[DB] Case write failed:', e);
    }
  }, []);

  useDebouncedDBWrite(employees, writeEmployees, 300);
  useDebouncedDBWrite(cases, writeCases, 300);

  // ── Setters (update in-memory state — DB write is debounced) ─────────
  const setEmployees = useCallback((newEmployees: EmployeeRecord[]) => {
    setEmployeesState(newEmployees);
  }, []);

  const setCases = useCallback((newCases: CaseRecord[]) => {
    setCasesState(newCases);
  }, []);

  // ── Individual CRUD Operations ───────────────────────────────────────
  const addEmployee = useCallback((emp: EmployeeRecord) => {
    setEmployeesState((prev) => [...prev, emp]);
    // Also write immediately to DB for single operations
    employeeDB.save(emp).catch(e => console.error('[DB] Add employee failed:', e));
  }, []);

  const updateEmployee = useCallback((updatedEmp: EmployeeRecord) => {
    setEmployeesState((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    employeeDB.save(updatedEmp).catch(e => console.error('[DB] Update employee failed:', e));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployeesState((prev) => prev.filter((e) => e.id !== id));
    employeeDB.delete(id).catch(e => console.error('[DB] Delete employee failed:', e));
  }, []);

  const addCase = useCallback((c: CaseRecord) => {
    setCasesState((prev) => [...prev, c]);
    caseDB.save(c).catch(e => console.error('[DB] Add case failed:', e));
  }, []);

  const updateCase = useCallback((updatedCase: CaseRecord) => {
    setCasesState((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
    caseDB.save(updatedCase).catch(e => console.error('[DB] Update case failed:', e));
  }, []);

  const deleteCase = useCallback((id: string) => {
    setCasesState((prev) => prev.filter((c) => c.id !== id));
    caseDB.delete(id).catch(e => console.error('[DB] Delete case failed:', e));
  }, []);

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