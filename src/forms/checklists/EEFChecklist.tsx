
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getEEFChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const EEFChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getEEFChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR EMPLOYEE EDUCATION FOUNDATION (E.E.F)"
      items={items}
    />
  );
};
