
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PAYF05TemporaryLoan } from '../../forms/gpf/PAYF05TemporaryLoan';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const PAYF05Print: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `PAYF05 - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  const isValidType = caseRecord?.case_type === 'gpf_refundable';

  useAutoPrint(!!caseRecord && !!employee && isValidType);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  if (!isValidType) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Not Applicable</h2>
        <p>This form (PAYF05) is only for GPF Refundable cases.</p>
        <p className="text-sm mt-2 text-gray-500">Current Case Type: {caseRecord.case_type}</p>
      </div>
    );
  }

  return (
    <PrintLayout orientation="portrait">
      <div className="flex justify-center py-4 print:p-0">
        <PAYF05TemporaryLoan employeeRecord={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
