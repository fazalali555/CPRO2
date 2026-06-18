
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getEEFChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const EEFChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const isDeath = employee?.employees?.status === 'deceased' || String(caseRecord?.extras?.nature_of_retirement || '').toLowerCase().includes('death');
  const items = getEEFChecklist(isDeath);
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR EMPLOYEE EDUCATION FOUNDATION (E.E.F)"
      items={items}
    />
  );
};
