import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Forms
import { RBDCChecklist } from '../../forms/checklists/RBDCChecklist';
import { RBDCApplication } from '../../forms/cover-letters/RBDCApplication';
import { LeaveAccountProforma } from '../../forms/retirement/LeaveAccountProforma';
import { RBDCOfficialForm } from '../../forms/official/RBDCOfficialForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RBDCPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `RBDC Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout caseId={caseId} documentId="rbdc-packet">
      {/* Mixed Orientation Support for Leave Account */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page landscape { size: A4 landscape; margin: 0; }
          .landscape-page {
             page: landscape;
             width: 297mm !important;
             height: 210mm !important;
          }
        }
      `}</style>

      <div className="flex flex-col items-center print:block">
        
        {/* Page 1: Checklist */}
        <div className="mb-8 print:mb-0">
          <RBDCChecklist employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 2: Cover Letter */}
        <div className="mb-8 print:mb-0">
          <RBDCApplication employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: Leave Account (Landscape) */}
        <div className="landscape-page mb-8 print:mb-0" style={{ width: '297mm' }}>
          <LeaveAccountProforma employeeRecord={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 4: Official Form */}
        <div className="mb-8 print:mb-0">
          <RBDCOfficialForm employee={employee} caseRecord={caseRecord} />
        </div>

      </div>
    </PrintLayout>
  );
};
