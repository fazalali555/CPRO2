import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { SuccessionCertificate } from '../../forms/family-pension/SuccessionCertificate';
import { BankAccountLetter } from '../../forms/family-pension/BankAccountLetter';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const FamilyPensionMiscPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  const location = useLocation();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  const isSuccession = location.pathname.includes('succession');
  const docTitle = isSuccession ? 'Succession Certificate' : 'Bank Account Letter';

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `${docTitle} - ${employee.employees.name}`;
    }
  }, [caseRecord, employee, docTitle]);

  useAutoPrint(!!caseRecord && !!employee, 500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout orientation="portrait">
      <div className="flex justify-center bg-gray-100 print:bg-white py-8 print:p-0">
        <div>
           {isSuccession ? (
             <SuccessionCertificate employee={employee} />
           ) : (
             <BankAccountLetter employee={employee} />
           )}
        </div>
      </div>
    </PrintLayout>
  );
};
