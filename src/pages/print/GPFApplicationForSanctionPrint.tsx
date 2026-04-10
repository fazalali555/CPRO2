
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { GPFApplicationForSanction } from '../../forms/gpf/GPFApplicationForSanction';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { isBpsGreaterThan4 } from '../../utils';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const GPFApplicationForSanctionPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Application for Sanction - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  const isValidBPS = employee && isBpsGreaterThan4(employee.employees.bps);

  useAutoPrint(!!caseRecord && !!employee && isValidBPS);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  if (!isValidBPS) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Not Applicable</h2>
        <p>This Application for Sanction format is only for BPS 5 and above.</p>
        <p className="text-sm mt-2 text-gray-500">Current Employee BPS: {employee.employees.bps} (Use Sanction Order for Class IV)</p>
      </div>
    );
  }

  return (
    <PrintLayout orientation="portrait">
      <div className="flex justify-center py-4 print:p-0">
        <GPFApplicationForSanction employeeRecord={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
