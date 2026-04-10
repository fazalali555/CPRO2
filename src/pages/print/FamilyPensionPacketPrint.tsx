
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Components
import { FamilyPensionTitlePage } from '../../forms/family-pension/FamilyPensionTitlePage';
import { FamilyPensionCoverLetter } from '../../forms/family-pension/FamilyPensionCoverLetter';
import { FamilyPensionApplication } from '../../forms/family-pension/FamilyPensionApplication';
import { FamilyPensionInServiceDeathData } from '../../forms/family-pension/FamilyPensionInServiceDeathData';
import { FamilyPensionSanctionAuthority } from '../../forms/family-pension/FamilyPensionSanctionAuthority';
import { PostRetirementApplication } from '../../forms/family-pension/PostRetirementApplication';
import { PostRetirementSignatures } from '../../forms/family-pension/PostRetirementSignatures';
import { FamilyPensionSanctionOrder } from '../../forms/family-pension/FamilyPensionSanctionOrder';
import { DescriptiveRoll } from '../../forms/family-pension/DescriptiveRoll';
import { FamilyNoDemandCertificate } from '../../forms/family-pension/FamilyNoDemandCertificate';
import { FamilyUndertakingRecovery } from '../../forms/family-pension/FamilyUndertakingRecovery';
import { FamilyNonInvolvement } from '../../forms/family-pension/FamilyNonInvolvement';
import { FamilyClearance } from '../../forms/family-pension/FamilyClearance';
import { NonMarriageCertificate } from '../../forms/family-pension/NonMarriageCertificate';
import { LifeCertificate } from '../../forms/family-pension/LifeCertificate';
import { DCSOptionForm } from '../../forms/family-pension/DCSOptionForm';
import { RetirementLegalHeirsList } from '../../forms/retirement/RetirementLegalHeirsList';
import { FamilyMembersList } from '../../forms/family-pension/FamilyMembersList';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const FamilyPensionPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Family Pension Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  // Wrapper style to enforce strict A4 pages with no overflow
  const pageStyle: React.CSSProperties = {
    height: '297mm',
    width: '210mm',
    overflow: 'hidden',
    pageBreakAfter: 'always',
    marginBottom: '0'
  };

  return (
    <PrintLayout orientation="portrait" pageSize="A4">
      <div className="flex flex-col items-center bg-gray-100 print:bg-white print:block">
        
        {/* Page 7: Title Page */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionTitlePage employee={employee} />
        </div>

        {/* Page 8: Forwarding Letter */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionCoverLetter employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 1: Application Form 3 Part 1 */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionApplication employee={employee} caseRecord={caseRecord} />
        </div>

        {/* New Document: List of Surviving Family Members */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyMembersList employee={employee} />
        </div>

        {/* Page 2: Form 3 Part 2 (In Service) */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionInServiceDeathData employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: Form 3 Part 3 (Sanction) */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionSanctionAuthority employee={employee} />
        </div>

        {/* Page 4: Post Retirement App */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PostRetirementApplication employee={employee} />
        </div>

        {/* Page 5: Post Retirement Sigs */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PostRetirementSignatures employee={employee} />
        </div>

        {/* Page 6: Sanction Order */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyPensionSanctionOrder employee={employee} />
        </div>

        {/* Page 9: Descriptive Roll */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <DescriptiveRoll employee={employee} />
        </div>

        {/* Page 10: No Demand */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyNoDemandCertificate employee={employee} />
        </div>

        {/* Page 11: Undertaking */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyUndertakingRecovery employee={employee} />
        </div>

        {/* Page 12: Non Involvement */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyNonInvolvement employee={employee} />
        </div>

        {/* Page 13: Clearance */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <FamilyClearance employee={employee} />
        </div>

        {/* AFFIDAVITS REMOVED FROM PACKET - PRINT VIA THUMBNAIL */}

        {/* Page 16: Non Marriage */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <NonMarriageCertificate employee={employee} />
        </div>

        {/* Page 17: Life Cert */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <LifeCertificate employee={employee} />
        </div>

        {/* Page 18: DCS */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <DCSOptionForm employee={employee} />
        </div>

        {/* Page 19: Legal Heirs */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <RetirementLegalHeirsList employee={employee} caseRecord={caseRecord} />
        </div>

      </div>
    </PrintLayout>
  );
};
