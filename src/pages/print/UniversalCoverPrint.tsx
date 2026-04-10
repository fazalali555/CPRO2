
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Import all cover letters
import { RetirementCoverLetter } from '../../forms/retirement/RetirementCoverLetter';
import { BenevolentFundApplication as BFCoverLetter } from '../../forms/cover-letters/BenevolentFundApplication';
import { EEFApplication as EEFCoverLetter } from '../../forms/cover-letters/EEFApplication';
import { RBDCApplication as RBDCCoverLetter } from '../../forms/cover-letters/RBDCApplication';
import { FinancialAssistanceApplication as FACoverLetter } from '../../forms/cover-letters/FinancialAssistanceApplication';
import { LPRApplication as LPRCoverLetter } from '../../forms/cover-letters/LPRApplication';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  type?: 'retirement' | 'bf' | 'eef' | 'rbdc' | 'financial-assistance' | 'lpr';
}

export const UniversalCoverPrint: React.FC<Props> = ({ employees, cases, type: propType }) => {
  const { caseId, type: urlType } = useParams();
  const type = propType || urlType;
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  const getCoverInfo = () => {
    switch (type) {
      case 'retirement':
        return { title: 'Retirement Cover Letter', Component: RetirementCoverLetter };
      case 'bf':
        return { title: 'BF Cover Letter', Component: BFCoverLetter };
      case 'eef':
        return { title: 'EEF Cover Letter', Component: EEFCoverLetter };
      case 'rbdc':
        return { title: 'RBDC Cover Letter', Component: RBDCCoverLetter };
      case 'financial-assistance':
        return { title: 'Financial Assistance Cover Letter', Component: FACoverLetter };
      case 'lpr':
        return { title: 'LPR Cover Letter', Component: LPRCoverLetter };
      default:
        return { title: 'Cover Letter', Component: null };
    }
  };

  const { title, Component } = getCoverInfo();

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `${title} - ${employee.employees.name}`;
    }
  }, [caseRecord, employee, title]);

  useAutoPrint(!!caseRecord && !!employee);

  if (!caseRecord || !employee || !Component) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Required data or component not found.</div>;
  }

  return (
    <PrintLayout pageSize="A4" orientation="portrait">
      <div className="flex justify-center py-4 print:p-0">
        <Component employee={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
