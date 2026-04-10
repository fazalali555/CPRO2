import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { LPRPayForm } from '../../forms/lpr/LPRPayForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const LPRPayFormPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `LPR Pay Form - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout orientation="landscape" pageSize="A4">
      <div className="flex justify-center py-4 print:p-0">
        <LPRPayForm employee={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
