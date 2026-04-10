import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { EMISReport } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useEMIS() {
  const [reports, setReports] = useLocalStorage<EMISReport[]>(
    STORAGE_KEYS.EMIS_REPORTS,
    []
  );

  const addReport = useCallback((report: Omit<EMISReport, 'id'>) => {
    const newReport: EMISReport = {
      ...report,
      id: Date.now().toString(),
    };
    setReports(prev => [newReport, ...prev]);
    return newReport;
  }, [setReports]);

  const statistics = useMemo(() => {
    const totalBoys = reports.reduce((sum, r) => sum + r.boys, 0);
    const totalGirls = reports.reduce((sum, r) => sum + r.girls, 0);
    const avgAttendance = reports.length > 0 
      ? reports.reduce((sum, r) => sum + r.attendance, 0) / reports.length 
      : 0;

    return {
      total: reports.length,
      totalBoys,
      totalGirls,
      totalEnrollment: totalBoys + totalGirls,
      avgAttendance: Math.round(avgAttendance),
    };
  }, [reports]);

  return {
    reports,
    addReport,
    statistics,
  };
}
