
import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { Affidavit1 } from '../../forms/family-pension/Affidavit1';
import { Affidavit2 } from '../../forms/family-pension/Affidavit2';
import { Affidavit3 } from '../../forms/family-pension/Affidavit3';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const FamilyPensionAffidavitPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  const location = useLocation();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  // Determine which affidavit to show based on URL path
  const isAffidavit1 = location.pathname.includes('affidavit-1');
  const isAffidavit3 = location.pathname.includes('affidavit-3');
  const docTitle = isAffidavit1 ? 'Affidavit (Non-Marriage)' : isAffidavit3 ? 'Affidavit (Non-Availment)' : 'Indemnity Bond';

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
    <PrintLayout orientation="portrait" pageSize="Legal">
      <div className="flex justify-center bg-gray-100 print:bg-white py-8 print:p-0">
        <div>
           {isAffidavit1 ? (
             <Affidavit1 employee={employee} />
           ) : isAffidavit3 ? (
             <Affidavit3 employee={employee} />
           ) : (
             <Affidavit2 employee={employee} />
           )}
        </div>
      </div>
    </PrintLayout>
  );
};
