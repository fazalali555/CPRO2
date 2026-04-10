
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getFinancialAssistanceChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FinancialAssistanceChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getFinancialAssistanceChecklist();
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR FINANCIAL ASSISTANCE"
      items={items}
    />
  );
};
