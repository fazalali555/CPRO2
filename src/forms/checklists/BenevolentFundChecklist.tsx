
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getBenevolentFundChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const BenevolentFundChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const isDeath = employee?.employees?.status === 'Deceased' || (caseRecord.extras?.nature_of_retirement || '').toLowerCase() === 'death';
  const items = getBenevolentFundChecklist(isDeath);
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR RETIREMENT GRANT (BF)"
      items={items}
    />
  );
};
