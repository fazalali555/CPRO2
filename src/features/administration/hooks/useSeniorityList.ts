import { useCallback, useMemo } from 'react';
import { useEmployeeContext } from '../../../contexts/EmployeeContext';
import { EmployeeRecord } from '../../../types';
import { Institution, SeniorityEntry } from '../types/institution';

export function useSeniorityList() {
  const { employees } = useEmployeeContext();

  // Get unique institutions from employees
  const institutions = useMemo<Institution[]>(() => {
    const institutionMap = new Map<string, Institution>();
    
    employees.forEach(emp => {
      const ddoCode = emp.employees.ddo_code || 'UNKNOWN';
      if (!institutionMap.has(ddoCode)) {
        institutionMap.set(ddoCode, {
          ddo_code: ddoCode,
          name: emp.employees.school_full_name || emp.employees.school_name || 'Unknown Institution',
          type: detectInstitutionType(emp.employees.school_full_name || ''),
          head_name: '', // Will be filled from employees or manually
          head_designation: detectHeadDesignation(emp.employees.school_full_name || ''),
          address: emp.employees.school_address || '',
          tehsil: emp.employees.tehsil || '',
          district: emp.employees.district || 'Peshawar',
        });
      }
    });

    return Array.from(institutionMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [employees]);

  // Get employees by institution
  const getEmployeesByInstitution = useCallback((ddoCode: string): EmployeeRecord[] => {
    return employees.filter(emp => 
      (emp.employees.ddo_code || 'UNKNOWN') === ddoCode
    );
  }, [employees]);

  // Get head of institution
  const getHeadOfInstitution = useCallback((ddoCode: string): EmployeeRecord | undefined => {
    const institutionEmployees = getEmployeesByInstitution(ddoCode);
    
    // Find by designation (highest authority)
    const headDesignations = [
      'Principal', 'Head Master', 'Headmaster', 'Head Mistress', 'Headmistress',
      'SST', 'Senior Subject Teacher', 'In-charge', 'Director', 'DEO', 'ADEO'
    ];

    for (const designation of headDesignations) {
      const head = institutionEmployees.find(emp => 
        emp.employees.designation?.toLowerCase().includes(designation.toLowerCase())
      );
      if (head) return head;
    }

    // If no head found, return employee with highest BPS
    return institutionEmployees.sort((a, b) => 
      (b.employees.bps || 0) - (a.employees.bps || 0)
    )[0];
  }, [getEmployeesByInstitution]);

  // Generate seniority list for an institution
  const generateSeniorityList = useCallback((
    ddoCode: string,
    filterDesignation?: string,
    filterBPS?: number,
    asOnDate?: string
  ): SeniorityEntry[] => {
    let institutionEmployees = getEmployeesByInstitution(ddoCode);

    // Apply filters
    if (filterDesignation) {
      institutionEmployees = institutionEmployees.filter(emp =>
        emp.employees.designation?.toLowerCase().includes(filterDesignation.toLowerCase())
      );
    }

    if (filterBPS) {
      institutionEmployees = institutionEmployees.filter(emp =>
        emp.employees.bps === filterBPS
      );
    }

    // Sort by seniority criteria
    const sorted = [...institutionEmployees].sort((a, b) => {
      // 1. First by BPS (higher BPS = more senior in that grade)
      const bpsA = a.employees.bps || 0;
      const bpsB = b.employees.bps || 0;
      
      if (bpsA !== bpsB) return bpsB - bpsA; // Higher BPS first within same category

      // 2. By regularization date (earlier = more senior)
      const regDateA = a.service_history.date_of_regularization || a.service_history.date_of_appointment;
      const regDateB = b.service_history.date_of_regularization || b.service_history.date_of_appointment;
      
      if (regDateA && regDateB) {
        const dateA = new Date(regDateA).getTime();
        const dateB = new Date(regDateB).getTime();
        if (dateA !== dateB) return dateA - dateB; // Earlier date first
      }

      // 3. By appointment date
      const appDateA = a.service_history.date_of_appointment;
      const appDateB = b.service_history.date_of_appointment;
      
      if (appDateA && appDateB) {
        const dateA = new Date(appDateA).getTime();
        const dateB = new Date(appDateB).getTime();
        if (dateA !== dateB) return dateA - dateB;
      }

      // 4. By date of birth (older = more senior)
      const dobA = a.employees.date_of_birth;
      const dobB = b.employees.date_of_birth;
      
      if (dobA && dobB) {
        return new Date(dobA).getTime() - new Date(dobB).getTime();
      }

      return 0;
    });

    // Convert to SeniorityEntry
    return sorted.map((emp, index) => ({
      seniority_no: index + 1,
      employee_id: emp.id,
      name: emp.employees.name,
      father_name: emp.employees.father_name || '',
      designation: emp.employees.designation || '',
      bps: emp.employees.bps || 0,
      date_of_birth: emp.employees.date_of_birth || '',
      date_of_appointment: emp.service_history.date_of_appointment || '',
      date_of_regularization: emp.service_history.date_of_regularization || '',
      date_of_entry_in_current_post: emp.service_history.date_of_entry_current_post || '',
      personal_no: emp.employees.personal_no || '',
      qualification: emp.employees.qualification || '',
      remarks: '',
    }));
  }, [getEmployeesByInstitution]);

  // Get statistics for an institution
  const getInstitutionStats = useCallback((ddoCode: string) => {
    const institutionEmployees = getEmployeesByInstitution(ddoCode);
    
    const bpsBreakdown = institutionEmployees.reduce((acc, emp) => {
      const bps = emp.employees.bps || 0;
      acc[bps] = (acc[bps] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const designationBreakdown = institutionEmployees.reduce((acc, emp) => {
      const designation = emp.employees.designation || 'Unknown';
      acc[designation] = (acc[designation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEmployees: institutionEmployees.length,
      bpsBreakdown,
      designationBreakdown,
      uniqueDesignations: Object.keys(designationBreakdown).length,
    };
  }, [getEmployeesByInstitution]);

  return {
    institutions,
    getEmployeesByInstitution,
    getHeadOfInstitution,
    generateSeniorityList,
    getInstitutionStats,
  };
}

// Helper functions
function detectInstitutionType(name: string): Institution['type'] {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('college')) return 'College';
  if (nameLower.includes('office') || nameLower.includes('deo') || nameLower.includes('directorate')) return 'Office';
  if (nameLower.includes('school') || nameLower.includes('high') || nameLower.includes('primary') || nameLower.includes('middle')) return 'School';
  return 'Other';
}

function detectHeadDesignation(institutionName: string): string {
  const nameLower = institutionName.toLowerCase();
  if (nameLower.includes('primary')) return 'Head Master';
  if (nameLower.includes('middle')) return 'Head Master';
  if (nameLower.includes('high')) return 'Principal';
  if (nameLower.includes('higher secondary')) return 'Principal';
  if (nameLower.includes('college')) return 'Principal';
  if (nameLower.includes('deo')) return 'District Education Officer';
  if (nameLower.includes('office')) return 'In-charge';
  return 'Head of Institution';
}
