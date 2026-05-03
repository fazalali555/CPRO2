
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { ChecklistLayout } from '../checklists/ChecklistLayout';
import { getOfficialPensionChecklist } from '../../utils';

interface RetirementChecklistProps {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RetirementChecklist: React.FC<RetirementChecklistProps> = ({ employee, caseRecord }) => {
  const items = getOfficialPensionChecklist(employee, caseRecord);
  
  return (
    <ChecklistLayout 
      employee={employee} 
      caseRecord={caseRecord}
      title="CHECKLIST DOCUMENTS REQUIRED FOR PENSION PAPERS (PRE-MATURE/ SUPERANNUATION/ MEDICAL/ DEATH)"
      items={items}
    />
  );
};
