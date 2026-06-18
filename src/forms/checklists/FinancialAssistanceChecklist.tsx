
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getFinancialAssistanceChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FinancialAssistanceChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const isDeath = employee?.employees?.status === 'deceased' || String(caseRecord?.extras?.nature_of_retirement || '').toLowerCase().includes('death');
  const items = getFinancialAssistanceChecklist(isDeath);
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR FINANCIAL ASSISTANCE"
      items={items}
    />
  );
};
