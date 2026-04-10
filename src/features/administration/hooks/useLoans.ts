import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { LoanApplication } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useLoans() {
  const [applications, setApplications] = useLocalStorage<LoanApplication[]>(
    STORAGE_KEYS.LOAN_APPLICATIONS,
    []
  );

  const addApplication = useCallback((app: Omit<LoanApplication, 'id' | 'submittedAt' | 'status'>) => {
    const newApp: LoanApplication = {
      ...app,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: 'Submitted'
    };
    setApplications(prev => [newApp, ...prev]);
    return newApp;
  }, [setApplications]);

  const updateStatus = useCallback((id: string, status: LoanApplication['status']) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, [setApplications]);

  const statistics = useMemo(() => ({
    total: applications.length,
    totalAmount: applications.reduce((sum, a) => sum + a.amount, 0),
    hba: applications.filter(a => a.loanType === 'HBA').length,
    vehicle: applications.filter(a => a.loanType === 'Vehicle').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    approvedAmount: applications.filter(a => a.status === 'Approved').reduce((sum, a) => sum + a.amount, 0),
  }), [applications]);

  return {
    applications,
    addApplication,
    updateStatus,
    statistics,
  };
}
