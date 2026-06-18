import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Forms
import { LPRChecklist } from '../../forms/checklists/LPRChecklist';
import { LPRApplication } from '../../forms/cover-letters/LPRApplication';
import { NonDrawalCertificate } from '../../forms/certificates/NonDrawalCertificate';
import { LPRPayForm } from '../../forms/lpr/LPRPayForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const LPRPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `LPR Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout caseId={caseId} documentId="lpr-packet">
      <div className="flex flex-col items-center print:block">
        
        {/* Page 1: Checklist */}
        <div className="mb-8 print:mb-0">
          <LPRChecklist employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 2: Cover Letter */}
        <div className="mb-8 print:mb-0">
          <LPRApplication employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: Non-Drawal Cert */}
        <div className="mb-8 print:mb-0">
          <NonDrawalCertificate employee={employee} type="LPR" />
        </div>

        {/* Page 4: Pay Form */}
        <div className="mb-8 print:mb-0">
          <LPRPayForm employee={employee} caseRecord={caseRecord} />
        </div>

      </div>
    </PrintLayout>
  );
};
