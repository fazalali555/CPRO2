import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Forms
import { LPCChecklist } from '../../forms/checklists/LPCChecklist';
import { LastPayCertificate } from '../../forms/regular-pension/LastPayCertificate';
import { LastPayCertificateReverse } from '../../forms/regular-pension/LastPayCertificateReverse';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const LPCPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `LPC Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout caseId={caseId} documentId="lpc-packet">
      <div className="flex flex-col items-center print:block">
        
        {/* Page 1: Checklist */}
        <div className="mb-8 print:mb-0">
          <LPCChecklist employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 2: LPC Front */}
        <div className="mb-8 print:mb-0">
          <LastPayCertificate employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: LPC Reverse */}
        <div className="mb-8 print:mb-0">
          <LastPayCertificateReverse employee={employee} caseRecord={caseRecord} />
        </div>

      </div>
    </PrintLayout>
  );
};
