import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from './ChecklistLayout';
import { getOfficialPensionChecklist } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const PensionChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const items = getOfficialPensionChecklist(employee, caseRecord);
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR PENSION"
      items={items}
    />
  );
};
