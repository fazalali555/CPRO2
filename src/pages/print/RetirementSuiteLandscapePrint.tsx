import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Landscape Components
import { LeaveAccountProforma } from '../../forms/retirement/LeaveAccountProforma';
import { PAYF06PermanentLoan } from '../../forms/gpf/PAYF06PermanentLoan';
import { GPFClaimVerificationProforma } from '../../forms/gpf/GPFClaimVerificationProforma';
import { LPRPayForm } from '../../forms/lpr/LPRPayForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RetirementSuiteLandscapePrint: React.FC<Props> = ({ employees, cases }) => {
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
      document.title = `Landscape Suite - ${employee.employees.name}`;
    }
  }, [employee]);

  useAutoPrint(!!employee, 2000);

  if (!employee || !currentCase) return <div className="p-10 text-center text-red-600 font-bold">Error: Required data not found.</div>;

  const pages: React.ReactNode[] = [];

  // --- 1. Leave Account ---
  const retCase = findCase('retirement');
  if (retCase) {
    pages.push(<LeaveAccountProforma key="ret-la" employeeRecord={employee} caseRecord={retCase} />);
  }

  const rbdcCase = findCase('rbdc');
  if (rbdcCase) {
    pages.push(<LeaveAccountProforma key="rbdc-la" employeeRecord={employee} caseRecord={rbdcCase} />);
  }

  // --- 2. GPF Final Landscape ---
  const gpfCase = findCase('gpf_final') || findCase('gpf_non_refundable') || findCase('gpf_refundable');
  if (gpfCase) {
    pages.push(
      <PAYF06PermanentLoan key="payf06" employeeRecord={employee} caseRecord={gpfCase} />,
      <GPFClaimVerificationProforma key="gcvp" employeeRecord={employee} caseRecord={gpfCase} />
    );
  }

  // --- 3. LPR Pay Form ---
  const lprCase = findCase('lpr');
  if (lprCase) {
    pages.push(<LPRPayForm key="lpr-pay" employee={employee} caseRecord={lprCase} />);
  }

  return (
    <PrintLayout caseId={caseId} documentId="suite-landscape" orientation="landscape">
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
