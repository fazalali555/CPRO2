import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { MedicalClaim } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useMedicalClaims() {
  const [claims, setClaims] = useLocalStorage<MedicalClaim[]>(
    STORAGE_KEYS.MEDICAL_CLAIMS,
    []
  );

  const addClaim = useCallback((claim: Omit<MedicalClaim, 'id' | 'submittedAt' | 'status'>) => {
    const newClaim: MedicalClaim = {
      ...claim,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: 'Submitted'
    };
    setClaims(prev => [newClaim, ...prev]);
    return newClaim;
  }, [setClaims]);

  const updateStatus = useCallback((id: string, status: MedicalClaim['status'], remarks?: string) => {
    setClaims(prev => prev.map(c => 
      c.id === id ? { ...c, status, remarks } : c
    ));
  }, [setClaims]);

  const statistics = useMemo(() => ({
    total: claims.length,
    totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
    submitted: claims.filter(c => c.status === 'Submitted').length,
    approved: claims.filter(c => c.status === 'Approved').length,
    rejected: claims.filter(c => c.status === 'Rejected').length,
    approvedAmount: claims.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0),
  }), [claims]);

  return {
    claims,
    addClaim,
    updateStatus,
    statistics,
  };
}
