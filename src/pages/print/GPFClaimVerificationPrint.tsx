
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { GPFClaimVerificationProforma } from '../../forms/gpf/GPFClaimVerificationProforma';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const GPFClaimVerificationPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `GCVP - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  const isGPF = caseRecord?.case_type.startsWith('gpf');

  useAutoPrint(!!caseRecord && !!employee && isGPF);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  if (!isGPF) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        GCVP is only applicable for GPF cases.
      </div>
    );
  }

  return (
    <PrintLayout orientation="landscape">
      <div className="flex justify-center py-4 print:p-0">
        <GPFClaimVerificationProforma employeeRecord={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
