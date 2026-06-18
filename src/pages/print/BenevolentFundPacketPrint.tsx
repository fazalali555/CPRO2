import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Forms
import { BenevolentFundChecklist } from '../../forms/checklists/BenevolentFundChecklist';
import { BenevolentFundApplication } from '../../forms/cover-letters/BenevolentFundApplication';
import { NonDrawalCertificate } from '../../forms/certificates/NonDrawalCertificate';
import { BenevolentFundOfficialForm } from '../../forms/official/BenevolentFundOfficialForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const BenevolentFundPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `BF Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout caseId={caseId} documentId="bf-packet">
      <div className="flex flex-col items-center print:block">
        
        {/* Page 1: Checklist */}
        <div className="mb-8 print:mb-0">
          <BenevolentFundChecklist employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 2: Cover Letter */}
        <div className="mb-8 print:mb-0">
          <BenevolentFundApplication employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: Non-Drawal Cert */}
        <div className="mb-8 print:mb-0">
          <NonDrawalCertificate employee={employee} type="Benevolent Fund" />
        </div>

        {/* Page 4: Contribution Cert */}
        <div className="mb-8 print:mb-0">
          <NonDrawalCertificate employee={employee} type="Contribution" />
        </div>

        {/* Page 5: Official Form */}
        <div className="mb-8 print:mb-0">
          <BenevolentFundOfficialForm employee={employee} caseRecord={caseRecord} />
        </div>

      </div>
    </PrintLayout>
  );
};
