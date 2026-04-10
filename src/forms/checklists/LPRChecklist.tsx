
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getLPRChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const LPRChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getLPRChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR LEAVE ENCASHMENT (LPR)"
      items={items}
    />
  );
};
