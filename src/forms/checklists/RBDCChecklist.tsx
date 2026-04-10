
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getRBDCChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RBDCChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getRBDCChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR RETIREMENT BENEFIT & DEATH COMPENSATION"
      items={items}
    />
  );
};
