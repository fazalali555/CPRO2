
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { GPFSanctionOrderClassIV } from '../../forms/gpf/GPFSanctionOrderClassIV';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { isClassIV } from '../../utils';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const GPFSanctionOrderClassIVPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Sanction Order - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  const isValidClassIV = employee && isClassIV(employee.employees.bps);

  useAutoPrint(!!caseRecord && !!employee && isValidClassIV);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  if (!isValidClassIV) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Not Applicable</h2>
        <p>This Sanction Order format is only for Class-IV employees (BPS 1-4).</p>
        <p className="text-sm mt-2 text-gray-500">Current Employee BPS: {employee.employees.bps}</p>
      </div>
    );
  }

  return (
    <PrintLayout orientation="portrait">
      <div className="flex justify-center py-4 print:p-0">
        <GPFSanctionOrderClassIV employeeRecord={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
