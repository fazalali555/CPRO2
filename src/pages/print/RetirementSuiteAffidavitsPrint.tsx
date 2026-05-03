import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Affidavit Components
import { SuccessionCertificate } from '../../forms/family-pension/SuccessionCertificate';
import { BankAccountLetter } from '../../forms/family-pension/BankAccountLetter';
import { Affidavit1 } from '../../forms/family-pension/Affidavit1';
import { Affidavit2 } from '../../forms/family-pension/Affidavit2';
import { Affidavit3 } from '../../forms/family-pension/Affidavit3';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RetirementSuiteAffidavitsPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const currentCase = cases.find(c => c.id === caseId);
  const employee = currentCase ? employees.find(e => e.id === currentCase.employee_id) : null;

  const relatedCases = useMemo(() => {
    if (!employee) return [];
    return cases.filter(c => c.employee_id === employee.id);
  }, [employee, cases]);

  const findCase = (type: string) => {
    if (currentCase?.case_type === 'full_pension') return currentCase;
    return relatedCases.find(c => c.case_type === type);
  };

  useEffect(() => {
    if (employee) {
      document.title = `Affidavits Suite - ${employee.employees.name}`;
    }
  }, [employee]);

  useAutoPrint(!!employee, 2000);

  if (!employee || !currentCase) return <div className="p-10 text-center text-red-600 font-bold">Error: Required data not found.</div>;

  const pages: React.ReactNode[] = [];

  // --- 1. Pension Related Affidavits ---
  const penCase = findCase('pension');
  if (penCase) {
    pages.push(
      <SuccessionCertificate key="suc" employee={employee} caseRecord={penCase} />,
      <BankAccountLetter key="bal" employee={employee} caseRecord={penCase} />,
      <Affidavit1 key="aff1" employee={employee} />,
      <Affidavit2 key="aff2" employee={employee} />,
      <Affidavit3 key="aff3" employee={employee} />
    );
  }

  return (
    <PrintLayout caseId={caseId} documentId="suite-affidavits" pageSize="Legal">
      <div className="flex flex-col items-center print:block">
        {pages.map((page, index) => (
          <div key={index} className="print-page mb-8 print:mb-0 print:break-after-page last:print:break-after-auto">
            {page}
          </div>
        ))}
      </div>
    </PrintLayout>
  );
};
