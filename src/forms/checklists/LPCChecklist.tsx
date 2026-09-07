import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getLPCChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const LPCChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getLPCChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST FOR LAST PAY CERTIFICATE (LPC)"
      items={items}
    />
  );
};
