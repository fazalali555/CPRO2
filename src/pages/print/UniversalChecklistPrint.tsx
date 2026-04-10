
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Import all checklists
import { RetirementChecklist } from '../../forms/retirement/RetirementChecklist';
import { FamilyPensionChecklist } from '../../forms/checklists/FamilyPensionChecklist';
import { RBDCChecklist } from '../../forms/checklists/RBDCChecklist';
import { BenevolentFundChecklist } from '../../forms/checklists/BenevolentFundChecklist';
import { EEFChecklist } from '../../forms/checklists/EEFChecklist';
import { LPRChecklist } from '../../forms/checklists/LPRChecklist';
import { FinancialAssistanceChecklist } from '../../forms/checklists/FinancialAssistanceChecklist';
import { GPFChecklist } from '../../forms/gpf/GPFChecklist';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  type?: 'retirement' | 'family-pension' | 'rbdc' | 'bf' | 'eef' | 'lpr' | 'financial-assistance' | 'gpf';
}

export const UniversalChecklistPrint: React.FC<Props> = ({ employees, cases, type: propType }) => {
  const { caseId, type: urlType } = useParams();
  const type = propType || urlType;
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  const getChecklistInfo = () => {
    switch (type) {
      case 'retirement':
        return { title: 'Retirement Checklist', Component: RetirementChecklist };
      case 'family-pension':
        return { title: 'Family Pension Checklist', Component: FamilyPensionChecklist };
      case 'rbdc':
        return { title: 'RBDC Checklist', Component: RBDCChecklist };
      case 'bf':
        return { title: 'Benevolent Fund Checklist', Component: BenevolentFundChecklist };
      case 'eef':
        return { title: 'EEF Checklist', Component: EEFChecklist };
      case 'lpr':
        return { title: 'LPR Checklist', Component: LPRChecklist };
      case 'financial-assistance':
        return { title: 'Financial Assistance Checklist', Component: FinancialAssistanceChecklist };
      case 'gpf':
        return { title: 'GPF Checklist', Component: GPFChecklist };
      default:
        return { title: 'Checklist', Component: null };
    }
  };

  const { title, Component } = getChecklistInfo();

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
    <PrintLayout>
      <div className="flex justify-center py-4 print:p-0">
        <Component employee={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
