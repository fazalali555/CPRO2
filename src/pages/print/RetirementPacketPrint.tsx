import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { RetirementChecklist } from '../../forms/retirement/RetirementChecklist';
import { RetirementCoverLetter } from '../../forms/retirement/RetirementCoverLetter';
import { RetirementEmployeeApplication } from '../../forms/retirement/RetirementEmployeeApplication';
import { RetirementClearanceCertificate } from '../../forms/retirement/RetirementClearanceCertificate';
import { RetirementNoDemandCertificate } from '../../forms/retirement/RetirementNoDemandCertificate';
import { RetirementNonInvolvementCertificate } from '../../forms/retirement/RetirementNonInvolvementCertificate';
import { RetirementLeaveNotAvailingCertificate } from '../../forms/retirement/RetirementLeaveNotAvailingCertificate';
import { RetirementQualifyingServiceCertificate } from '../../forms/retirement/RetirementQualifyingServiceCertificate';
import { RetirementServiceCertificate } from '../../forms/retirement/RetirementServiceCertificate';
import { RetirementLegalHeirsList } from '../../forms/retirement/RetirementLegalHeirsList';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RetirementPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Retirement Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  // Longer delay for large packet
  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  const pages = [
    <RetirementChecklist key="checklist" employee={employee} caseRecord={caseRecord} />,
    <RetirementCoverLetter key="cover" employee={employee} caseRecord={caseRecord} />,
    <RetirementEmployeeApplication key="application" employee={employee} caseRecord={caseRecord} />,
    <RetirementClearanceCertificate key="clearance" employee={employee} caseRecord={caseRecord} />,
    <RetirementNoDemandCertificate key="no-demand" employee={employee} caseRecord={caseRecord} />,
    <RetirementNonInvolvementCertificate key="non-involvement" employee={employee} caseRecord={caseRecord} />,
    <RetirementLeaveNotAvailingCertificate key="leave" employee={employee} caseRecord={caseRecord} />,
    <RetirementQualifyingServiceCertificate key="qualifying" employee={employee} caseRecord={caseRecord} />,
    <RetirementServiceCertificate key="service" employee={employee} caseRecord={caseRecord} />,
    <RetirementLegalHeirsList key="heirs" employee={employee} caseRecord={caseRecord} />,
  ];

  return (
    <PrintLayout caseId={caseId} documentId="retirement-packet">
      <div className="flex flex-col items-center print:block">
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            <div className="print-page mb-8 print:mb-0 print:break-after-page last:print:break-after-auto">
              {page}
            </div>
          </React.Fragment>
        ))}
      </div>
    </PrintLayout>
  );
};