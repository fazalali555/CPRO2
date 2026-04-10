import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { SchoolInspection } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useInspections() {
  const [inspections, setInspections] = useLocalStorage<SchoolInspection[]>(
    STORAGE_KEYS.INSPECTIONS,
    []
  );

  const addInspection = useCallback((inspection: Omit<SchoolInspection, 'id'>) => {
    const newInspection: SchoolInspection = {
      ...inspection,
      id: Date.now().toString(),
    };
    setInspections(prev => [newInspection, ...prev]);
    return newInspection;
  }, [setInspections]);

  const statistics = useMemo(() => ({
    total: inspections.length,
    compliant: inspections.filter(i => i.status === 'Compliant').length,
    deficient: inspections.filter(i => i.status === 'Deficient').length,
    thisMonth: inspections.filter(i => {
      const date = new Date(i.inspectionDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  }), [inspections]);

  return {
    inspections,
    addInspection,
    statistics,
  };
}
