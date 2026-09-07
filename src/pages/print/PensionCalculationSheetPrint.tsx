import React from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PensionCalculationSheet } from '../../forms/regular-pension/PensionCalculationSheet';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const PensionCalculationSheetPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = employees.find(e => e.id === caseRecord?.employee_id) || employees[0];

  return (
    <div className="bg-slate-200 dark:bg-slate-900 min-h-screen py-8 print:py-0 print:bg-white">
      <PensionCalculationSheet employee={employee} caseRecord={caseRecord} />
    </div>
  );
};
