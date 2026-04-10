
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getFamilyPensionChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FamilyPensionChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getFamilyPensionChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR FAMILY PENSION"
      items={items}
    />
  );
};
