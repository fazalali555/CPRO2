/**
 * IndexedDB Storage Layer for KPK RPMS
 * 
 * Replaces localStorage for employee and case data.
 * Non-blocking, supports large datasets, indexed for fast lookups.
 * 
 * @module db
 * @version 1.0.0
 */

import { EmployeeRecord, CaseRecord } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'clerk_pro_rpms';
const DB_VERSION = 2; // Increment when schema changes

const STORES = {
  EMPLOYEES: 'employees',
  CASES: 'cases',
  SETTINGS: 'settings',
  FILES: 'files',
} as const;

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let dbInstance: IDBDatabase | null = null;

/**
 * Opens (or creates) the IndexedDB database with proper schema.
 * Reuses connection if already open.
 */
const getDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      console.log(`[DB] Upgrading from v${oldVersion} to v${DB_VERSION}`);

      // ── Employees Store ──────────────────────────────────────────
      if (!db.objectStoreNames.contains(STORES.EMPLOYEES)) {
        const empStore = db.createObjectStore(STORES.EMPLOYEES, { keyPath: 'id' });
        empStore.createIndex('cnic', 'employees.cnic_no', { unique: false });
        empStore.createIndex('personal_no', 'employees.personal_no', { unique: false });
        empStore.createIndex('name', 'employees.name', { unique: false });
        empStore.createIndex('district', 'employees.district', { unique: false });
        empStore.createIndex('office_name', 'employees.office_name', { unique: false });
        empStore.createIndex('status', 'employees.status', { unique: false });
        empStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('[DB] Created employees store with indexes');
      }

      // ── Cases Store ──────────────────────────────────────────────
      if (!db.objectStoreNames.contains(STORES.CASES)) {
        const caseStore = db.createObjectStore(STORES.CASES, { keyPath: 'id' });
        caseStore.createIndex('employee_id', 'employee_id', { unique: false });
        caseStore.createIndex('case_type', 'case_type', { unique: false });
        caseStore.createIndex('status', 'status', { unique: false });
        caseStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('[DB] Created cases store with indexes');
      }

      // ── Settings Store (key-value) ───────────────────────────────
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        console.log('[DB] Created settings store');
      }

      // ── Files Store (binary blobs) ───────────────────────────────
      if (!db.objectStoreNames.contains(STORES.FILES)) {
        db.createObjectStore(STORES.FILES);
        console.log('[DB] Created files store');
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle connection close (e.g., browser upgrade)
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };
  });
};

// ============================================================================
// GENERIC HELPERS
// ============================================================================

/**
 * Execute a transaction on a store and return a promise.
 */
const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all records from a store.
 */
const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Put multiple records in a single transaction (batch write).
 * Much faster than individual puts.
 */
const batchPut = async <T>(storeName: string, records: T[]): Promise<void> => {
  if (records.length === 0) return;

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    for (const record of records) {
      store.put(record);
    }
  });
};

/**
 * Clear all records from a store.
 */
const clearStore = async (storeName: string): Promise<void> => {
  await withStore(storeName, 'readwrite', (store) => store.clear());
};

// ============================================================================
// EMPLOYEE OPERATIONS
// ============================================================================

export const employeeDB = {
  /**
   * Get all employees
   */
  getAll: async (): Promise<EmployeeRecord[]> => {
    return getAllFromStore<EmployeeRecord>(STORES.EMPLOYEES);
  },

  /**
   * Get a single employee by ID
   */
  getById: async (id: string): Promise<EmployeeRecord | undefined> => {
    return withStore<EmployeeRecord | undefined>(
      STORES.EMPLOYEES,
      'readonly',
      (store) => store.get(id)
    );
  },

  /**
   * Get employees by CNIC
   */
  getByCnic: async (cnic: string): Promise<EmployeeRecord[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EMPLOYEES, 'readonly');
      const store = tx.objectStore(STORES.EMPLOYEES);
      const index = store.index('cnic');
      const request = index.getAll(cnic);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get employees by district
   */
  getByDistrict: async (district: string): Promise<EmployeeRecord[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EMPLOYEES, 'readonly');
      const store = tx.objectStore(STORES.EMPLOYEES);
      const index = store.index('district');
      const request = index.getAll(district);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Save a single employee (create or update)
   */
  save: async (employee: EmployeeRecord): Promise<void> => {
    await withStore(STORES.EMPLOYEES, 'readwrite', (store) =>
      store.put(employee)
    );
  },

  /**
   * Save multiple employees in a single transaction (fast bulk write)
   */
  saveAll: async (employees: EmployeeRecord[]): Promise<void> => {
    await batchPut(STORES.EMPLOYEES, employees);
  },

  /**
   * Replace ALL employees (used during import)
   */
  replaceAll: async (employees: EmployeeRecord[]): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EMPLOYEES, 'readwrite');
      const store = tx.objectStore(STORES.EMPLOYEES);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      // Clear first, then add all
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const emp of employees) {
          store.put(emp);
        }
      };
    });
  },

  /**
   * Delete a single employee
   */
  delete: async (id: string): Promise<void> => {
    await withStore(STORES.EMPLOYEES, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  /**
   * Delete multiple employees
   */
  deleteMany: async (ids: string[]): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EMPLOYEES, 'readwrite');
      const store = tx.objectStore(STORES.EMPLOYEES);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      for (const id of ids) {
        store.delete(id);
      }
    });
  },

  /**
   * Get total count without loading all data
   */
  count: async (): Promise<number> => {
    return withStore<number>(STORES.EMPLOYEES, 'readonly', (store) =>
      store.count()
    );
  },

  /**
   * Clear all employees
   */
  clear: async (): Promise<void> => {
    await clearStore(STORES.EMPLOYEES);
  },

  /**
   * Search employees by name (client-side filter on indexed field)
   */
  search: async (query: string, limit: number = 50): Promise<EmployeeRecord[]> => {
    const all = await getAllFromStore<EmployeeRecord>(STORES.EMPLOYEES);
    if (!query.trim()) return all.slice(0, limit);

    const q = query.toLowerCase();
    return all
      .filter(emp =>
        emp.employees.name?.toLowerCase().includes(q) ||
        emp.employees.cnic_no?.includes(q) ||
        emp.employees.personal_no?.includes(q) ||
        emp.employees.school_full_name?.toLowerCase().includes(q)
      )
      .slice(0, limit);
  },
};

// ============================================================================
// CASE OPERATIONS
// ============================================================================

export const caseDB = {
  getAll: async (): Promise<CaseRecord[]> => {
    return getAllFromStore<CaseRecord>(STORES.CASES);
  },

  getById: async (id: string): Promise<CaseRecord | undefined> => {
    return withStore<CaseRecord | undefined>(
      STORES.CASES,
      'readonly',
      (store) => store.get(id)
    );
  },

  getByEmployeeId: async (employeeId: string): Promise<CaseRecord[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASES, 'readonly');
      const store = tx.objectStore(STORES.CASES);
      const index = store.index('employee_id');
      const request = index.getAll(employeeId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  save: async (caseRecord: CaseRecord): Promise<void> => {
    await withStore(STORES.CASES, 'readwrite', (store) =>
      store.put(caseRecord)
    );
  },

  saveAll: async (cases: CaseRecord[]): Promise<void> => {
    await batchPut(STORES.CASES, cases);
  },

  replaceAll: async (cases: CaseRecord[]): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASES, 'readwrite');
      const store = tx.objectStore(STORES.CASES);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const c of cases) {
          store.put(c);
        }
      };
    });
  },

  delete: async (id: string): Promise<void> => {
    await withStore(STORES.CASES, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  count: async (): Promise<number> => {
    return withStore<number>(STORES.CASES, 'readonly', (store) =>
      store.count()
    );
  },

  clear: async (): Promise<void> => {
    await clearStore(STORES.CASES);
  },
};

// ============================================================================
// SETTINGS OPERATIONS (key-value store)
// ============================================================================

export const settingsDB = {
  get: async <T = any>(key: string): Promise<T | undefined> => {
    const result = await withStore<{ key: string; value: T } | undefined>(
      STORES.SETTINGS,
      'readonly',
      (store) => store.get(key)
    );
    return result?.value;
  },

  set: async <T = any>(key: string, value: T): Promise<void> => {
    await withStore(STORES.SETTINGS, 'readwrite', (store) =>
      store.put({ key, value })
    );
  },

  delete: async (key: string): Promise<void> => {
    await withStore(STORES.SETTINGS, 'readwrite', (store) =>
      store.delete(key)
    );
  },

  clear: async (): Promise<void> => {
    await clearStore(STORES.SETTINGS);
  },
};

// ============================================================================
// MIGRATION: localStorage → IndexedDB
// ============================================================================

const LS_KEYS = {
  EMPLOYEES: 'clerk_pro_rpms_employees',
  CASES: 'clerk_pro_rpms_cases',
  MIGRATED: 'clerk_pro_rpms_migrated_to_idb',
};

/**
 * One-time migration from localStorage to IndexedDB.
 * Runs automatically on first load. Safe to call multiple times.
 */
export const migrateFromLocalStorage = async (): Promise<{
  migrated: boolean;
  employeeCount: number;
  caseCount: number;
}> => {
  // Check if already migrated
  const alreadyMigrated = localStorage.getItem(LS_KEYS.MIGRATED);
  if (alreadyMigrated === 'true') {
    return { migrated: false, employeeCount: 0, caseCount: 0 };
  }

  console.log('[DB Migration] Starting localStorage → IndexedDB migration...');

  let employeeCount = 0;
  let caseCount = 0;

  try {
    // ── Migrate Employees ──────────────────────────────────────────
    const empJson = localStorage.getItem(LS_KEYS.EMPLOYEES);
    if (empJson) {
      try {
        const employees: EmployeeRecord[] = JSON.parse(empJson);
        if (Array.isArray(employees) && employees.length > 0) {
          // Check if IDB already has data (avoid overwriting)
          const existingCount = await employeeDB.count();
          if (existingCount === 0) {
            await employeeDB.saveAll(employees);
            employeeCount = employees.length;
            console.log(`[DB Migration] Migrated ${employeeCount} employees`);
          } else {
            console.log(`[DB Migration] IDB already has ${existingCount} employees, skipping`);
            employeeCount = existingCount;
          }
        }
      } catch (e) {
        console.error('[DB Migration] Failed to parse employees from localStorage:', e);
      }
    }

    // ── Migrate Cases ──────────────────────────────────────────────
    const caseJson = localStorage.getItem(LS_KEYS.CASES);
    if (caseJson) {
      try {
        const cases: CaseRecord[] = JSON.parse(caseJson);
        if (Array.isArray(cases) && cases.length > 0) {
          const existingCount = await caseDB.count();
          if (existingCount === 0) {
            await caseDB.saveAll(cases);
            caseCount = cases.length;
            console.log(`[DB Migration] Migrated ${caseCount} cases`);
          } else {
            console.log(`[DB Migration] IDB already has ${existingCount} cases, skipping`);
            caseCount = existingCount;
          }
        }
      } catch (e) {
        console.error('[DB Migration] Failed to parse cases from localStorage:', e);
      }
    }

    // Mark migration complete
    localStorage.setItem(LS_KEYS.MIGRATED, 'true');

    // Optional: Remove old localStorage data to free space
    // Uncomment these lines after you've confirmed the migration works:
    // localStorage.removeItem(LS_KEYS.EMPLOYEES);
    // localStorage.removeItem(LS_KEYS.CASES);

    console.log(`[DB Migration] Complete: ${employeeCount} employees, ${caseCount} cases`);

    return { migrated: true, employeeCount, caseCount };

  } catch (e) {
    console.error('[DB Migration] Migration failed:', e);
    return { migrated: false, employeeCount: 0, caseCount: 0 };
  }
};

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Get database size estimate
 */
export const getDBSize = async (): Promise<{
  employees: number;
  cases: number;
  estimatedSizeMB: number;
}> => {
  const empCount = await employeeDB.count();
  const caseCount = await caseDB.count();

  // Rough estimate: ~2KB per employee, ~1KB per case
  const estimatedSizeMB = ((empCount * 2) + (caseCount * 1)) / 1024;

  return {
    employees: empCount,
    cases: caseCount,
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
  };
};

/**
 * Export all data as JSON (for backup)
 */
export const exportAllData = async (): Promise<{
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  exportDate: string;
  version: string;
}> => {
  const [employees, cases] = await Promise.all([
    employeeDB.getAll(),
    caseDB.getAll(),
  ]);

  return {
    employees,
    cases,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
};

/**
 * Delete the entire database (nuclear option)
 */
export const deleteDatabase = async (): Promise<void> => {
  dbInstance?.close();
  dbInstance = null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      localStorage.removeItem(LS_KEYS.MIGRATED);
      console.log('[DB] Database deleted');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};