import { useCallback, useMemo, useState, useEffect } from 'react';
import { ACRRecord, ACRCategory, ACRGrade } from '../types/acr';
import { ACR_GRADES, STORAGE_KEY_ACR } from '../constants/acr-constants';

export function useACR() {
  const [acrs, setACRs] = useState<ACRRecord[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACR);
      if (stored) {
        const parsed = JSON.parse(stored);
        setACRs(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading ACRs:', error);
      setACRs([]);
    }
  }, []);

  // Save to localStorage whenever acrs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACR, JSON.stringify(acrs));
    } catch (error) {
      console.error('Error saving ACRs:', error);
    }
  }, [acrs]);

  // Determine ACR category based on BPS
  const getACRCategory = useCallback((bps: number): ACRCategory => {
    if (bps >= 1 && bps <= 4) return 'BPS_01_04';
    if (bps >= 5 && bps <= 15) return 'BPS_05_15';
    if (bps >= 16 && bps <= 19) return 'BPS_16_19';
    return 'BPS_20_22';
  }, []);

  // Calculate grade from score
  const calculateGrade = useCallback((score: number): ACRGrade => {
    for (const gradeInfo of ACR_GRADES) {
      if (score >= gradeInfo.minScore && score <= gradeInfo.maxScore) {
        return gradeInfo.grade;
      }
    }
    return 'C';
  }, []);

  // Add new ACR
  const addACR = useCallback((acr: Omit<ACRRecord, 'id' | 'created_at' | 'updated_at'>) => {
    const newACR: ACRRecord = {
      ...acr,
      id: `ACR-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setACRs(prev => {
      const updated = [newACR, ...prev];
      console.log('ACR Added:', newACR);
      console.log('Total ACRs:', updated.length);
      return updated;
    });
    return newACR;
  }, []);

  // Update ACR
  const updateACR = useCallback((id: string, updates: Partial<ACRRecord>) => {
    setACRs(prev => prev.map(acr => 
      acr.id === id 
        ? { ...acr, ...updates, updated_at: new Date().toISOString() } 
        : acr
    ));
  }, []);

  // Delete ACR
  const deleteACR = useCallback((id: string) => {
    setACRs(prev => prev.filter(acr => acr.id !== id));
  }, []);

  // Get ACRs for employee
  const getEmployeeACRs = useCallback((employeeId: string) => {
    return acrs.filter(acr => acr.employee_id === employeeId);
  }, [acrs]);

  // Get pending ACRs
  const getPendingACRs = useCallback(() => {
    return acrs.filter(acr => acr.status === 'Draft' || acr.status === 'Initiated');
  }, [acrs]);

  // Statistics
  const statistics = useMemo(() => ({
    total: acrs.length,
    draft: acrs.filter(a => a.status === 'Draft').length,
    initiated: acrs.filter(a => a.status === 'Initiated').length,
    countersigned: acrs.filter(a => a.status === 'Countersigned').length,
    filed: acrs.filter(a => a.status === 'Filed').length,
    adverse: acrs.filter(a => a.status === 'Adverse' || a.grading?.overall_grade === 'E').length,
    byGrade: {
      A: acrs.filter(a => a.grading?.overall_grade === 'A').length,
      B: acrs.filter(a => a.grading?.overall_grade === 'B').length,
      C: acrs.filter(a => a.grading?.overall_grade === 'C').length,
      D: acrs.filter(a => a.grading?.overall_grade === 'D').length,
      E: acrs.filter(a => a.grading?.overall_grade === 'E').length,
    },
  }), [acrs]);

  // Get years for which ACR can be initiated
  const getACRYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(`${currentYear - i - 1}-${currentYear - i}`);
    }
    return years;
  }, []);

  return {
    acrs,
    addACR,
    updateACR,
    deleteACR,
    getEmployeeACRs,
    getPendingACRs,
    getACRCategory,
    calculateGrade,
    getACRYears,
    statistics,
  };
}
