import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmployeeRecord, CaseRecord, INITIAL_EMPLOYEES } from '../types';
import { migrateToV2, migrateCasesToV1, autoCalculateRetirementDates } from '../utils';
import { resetBudgetingStorage, CURRENT_BUDGET_CACHE_VERSION } from '../budgeting/budget/storage';

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
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- EMPLOYEES STATE ---
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    const saved = localStorage.getItem('kpk_rpms_employees');
    let rawData = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    
    if (Array.isArray(rawData) && rawData.length === 0) {
      rawData = INITIAL_EMPLOYEES;
    }
    
    const migrated = migrateToV2(rawData);
    return autoCalculateRetirementDates(migrated);
  });

  // --- CASES STATE ---
  const [cases, setCases] = useState<CaseRecord[]>(() => {
    const saved = localStorage.getItem('kpk_rpms_cases');
    const rawData = saved ? JSON.parse(saved) : [];
    return migrateCasesToV1(rawData);
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('kpk_rpms_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('kpk_rpms_cases', JSON.stringify(cases));
  }, [cases]);

  // One-time cache invalidation to reflect latest edits/normalization
  useEffect(() => {
    const ver = localStorage.getItem('budgeting/cache/version');
    if (ver !== CURRENT_BUDGET_CACHE_VERSION) {
      resetBudgetingStorage();
    }
  }, []);

  // Handlers
  const addEmployee = (emp: EmployeeRecord) => setEmployees([...employees, emp]);
  const updateEmployee = (updatedEmp: EmployeeRecord) => 
    setEmployees(employees.map(e => e.id === updatedEmp.id ? updatedEmp : e));
  const deleteEmployee = (id: string) => 
    setEmployees(employees.filter(e => e.id !== id));

  const addCase = (c: CaseRecord) => setCases([...cases, c]);
  const updateCase = (updatedCase: CaseRecord) => 
    setCases(cases.map(c => c.id === updatedCase.id ? updatedCase : c));
  const deleteCase = (id: string) => 
    setCases(cases.filter(c => c.id !== id));

  return (
    <EmployeeContext.Provider value={{
      employees,
      cases,
      setEmployees,
      setCases,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addCase,
      updateCase,
      deleteCase
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider');
  }
  return context;
};
